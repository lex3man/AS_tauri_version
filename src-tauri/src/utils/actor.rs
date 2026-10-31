use std::sync::Mutex;

use serde_json::json;
use tauri::AppHandle;

use crate::{
    race::types::Coords,
    state::{
        race_config::PointState,
        telemetry::{Exceed, PointCapture, Telemetry},
        AppState, GPSData, JumpSuggestion, Position,
    },
    ipc::report::build_and_queue_report,
    utils::{
        converters::{course_in_degrees, distance},
        send_data::{send_collected, send_report, send_telemetry},
    },
};
use crate::utils::crypto;

/// How far the rider must have run since capturing DSS before the stage's
/// ASS point will accept a capture. On a circular stage start and finish sit
/// in the same place, so the two capture radiuses overlap and the finish is
/// in range from the moment the stage begins; a kilometre is comfortably more
/// than any capture radius and comfortably less than any real stage.
const ASS_MIN_RUN_KM: f64 = 1.0;

pub async fn make_culc(app: &AppHandle, state: &Mutex<AppState>, pos: &Position) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        let coords = GPSData {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude_accuracy: pos.coords.altitude_accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
        };
        state.coords = Some(coords);
        if state.race.race.is_none() {
            return Ok(());
        }
        let sog = (coords.speed.unwrap_or(0.0) * 3.6) as u32;
        let next_point_type;
        let mut jump_suggested = false;
        let mut capture = false;
        let mut ass_captured = false;
        let mut jump_point_id = String::new();
        let mut total_correction = None;
        let mut next_point_id = "".to_string();
        let mut prev_point_id = "".to_string();
        let mut dtw = 0.0f64;
        let mut cog = 0;
        let mut ctw = 0;
        let mut max_speed = 0u8;
        let mut sign_limit = 0u8;
        let mut sign_state = "none";
        let mut zone_speed_limit: Option<u8> = None;
        let mut area_id = String::new();
        let mut tel = Telemetry::new();
        // Whether `tel` actually holds this area's stored telemetry. It stays
        // the empty placeholder when no area or no next point resolves, and
        // writing that back would wipe the stage's record.
        let mut tel_loaded = false;
        let mut is_open = false;
        let mut in_visiable_zone = false;
        let mut counter = 0;
        let mut finished = state.current.finished;
        let mut oncoming = false;
        let mut roadbook_unlocked = false;
        let mut dss_taken = false;
        let mut arrow_color = "black".to_string();

        // ============================================================================
        // loading current state
        // ============================================================================
        let code = &state.race.active_code;
        if let Some(area) = state.race.race.as_ref().unwrap().areas.get(code) {
            area_id = area.id.clone();
            next_point_id = state.race.spec_area_state.next_point.clone();

            // While a point is held ("keep pointing at WPT"), the proximity
            // scan below must not touch next_point_id/prev_point_id at all —
            // otherwise a coincidentally-nearby unchecked point could
            // clobber prev_point_id with the held point's own id, skewing
            // oncoming detection and the telemetry point_name for this tick.
            let holding_now = state.race.spec_area_state.held_point.clone();
            let mut dss_in_sight = false;

            // On a circular stage the finish is laid out on top of the start,
            // so ASS is inside its own capture radius from the moment the
            // rider rolls up to DSS — and the proximity scan below, which
            // retargets navigation onto any unchecked point in range, would
            // hand them the finish before they had gone anywhere. ASS is
            // therefore held shut until DSS has been captured and the
            // odometer has moved on by ASS_MIN_RUN_KM since.
            let dss_checked = area.points_set.iter().any(|p| {
                p.point_type == "DSS"
                    && state
                        .race
                        .spec_area_state
                        .points
                        .get(&p.get_id())
                        .map(|ps| ps.checked)
                        .unwrap_or(false)
            });
            // abs_total, not total: the per-capture odo corrections rewrite
            // `total`, and a correction landing between DSS and ASS would
            // move the anchor's meaning out from under the comparison.
            let run_since_dss = state
                .race
                .spec_area_state
                .dss_odo
                .map(|odo| state.dashboard.metrics.abs_total - odo);
            // A stage with no DSS has nothing to gate against, and a captured
            // DSS with no anchor means the capture predates this field (state
            // restored from an older build) — neither is a reason to lock a
            // rider out of their own finish.
            let has_dss = area.points_set.iter().any(|p| p.point_type == "DSS");
            let ass_unlocked = !has_dss
                || (dss_checked
                    && run_since_dss
                        .map(|run| run >= ASS_MIN_RUN_KM)
                        .unwrap_or(true));
            let takeable = |point: &crate::race::types::Point| {
                point.point_type != "ASS" || ass_unlocked
            };

            let _ = &area.points_set.iter().for_each(|point| {
                let distance_to_point = distance(
                    Coords {
                        lat: coords.latitude,
                        lon: coords.longitude,
                    },
                    Coords {
                        lat: point.lat,
                        lon: point.lon,
                    },
                ) * 1000.0;
                if holding_now.is_none()
                    && distance_to_point <= point.capture_radius as f64
                    && takeable(point)
                    && !state
                        .race
                        .spec_area_state
                        .points
                        .get(&point.get_id())
                        .unwrap()
                        .checked
                {
                    prev_point_id = next_point_id.clone();
                    next_point_id = point.get_id();
                }

                if distance_to_point <= point.visible_radius as f64
                    && takeable(point)
                    && !state
                        .race
                        .spec_area_state
                        .points
                        .get(&point.get_id())
                        .unwrap()
                        .checked
                    && (point.get_id() != state.race.spec_area_state.next_point)
                {
                    jump_suggested = true;
                    jump_point_id = point.get_id();
                }

                // The roadbook opens as soon as DSS comes into sight — note
                // this is the visible radius, not the capture one, and it
                // deliberately ignores `checked` so it also fires on a DSS
                // that was already captured.
                if point.point_type == "DSS"
                    && distance_to_point <= point.visible_radius as f64
                {
                    dss_in_sight = true;
                }
            });

            // Speed rules for the DZ -> FZ stretch. Inside DZ's capture radius
            // the approach limit (DZ's own) still counts, and the sign shows
            // the stricter FZ limit in grey as a heads-up. Past the radius the
            // FZ limit is what's enforced and the sign turns red to mark the
            // penalised stretch. The zone clears once FZ is captured.
            let distance_to = |p: &crate::race::types::Point| {
                distance(
                    Coords {
                        lat: coords.latitude,
                        lon: coords.longitude,
                    },
                    Coords {
                        lat: p.lat,
                        lon: p.lon,
                    },
                ) * 1000.0
            };
            let is_checked = |p: &crate::race::types::Point| {
                state
                    .race
                    .spec_area_state
                    .points
                    .get(&p.get_id())
                    .map(|s| s.checked)
                    .unwrap_or(false)
            };
            let in_dz_radius = area.points_set.iter().position(|p| {
                p.point_type == "DZ" && distance_to(p) <= p.capture_radius as f64
            });
            // Past the radius the zone stays open while a captured DZ still has
            // an uncaptured FZ ahead of it. Stepping navigation past that FZ by
            // hand (W+) closes it too, so a skipped FZ can't pin the sign red
            // for the rest of the leg.
            let next_idx = area
                .points_set
                .iter()
                .position(|p| p.get_id() == next_point_id);
            let active_zone = in_dz_radius.or_else(|| {
                area.points_set
                    .iter()
                    .enumerate()
                    .rev()
                    .find_map(|(i, p)| {
                        if p.point_type != "DZ" || !is_checked(p) {
                            return None;
                        }
                        let fz_idx = area.points_set[i + 1..]
                            .iter()
                            .position(|q| q.point_type == "FZ")
                            .map(|off| i + 1 + off)?;
                        let still_open = !is_checked(&area.points_set[fz_idx])
                            && next_idx.map(|n| fz_idx >= n).unwrap_or(false);
                        if still_open { Some(i) } else { None }
                    })
            });
            if let Some(dz_idx) = active_zone {
                let dz = &area.points_set[dz_idx];
                let fz_limit = area.points_set[dz_idx + 1..]
                    .iter()
                    .find(|p| p.point_type == "FZ")
                    .map(|p| p.speed_limit)
                    .unwrap_or(dz.speed_limit);
                let inside_radius = in_dz_radius == Some(dz_idx);
                let effective = if inside_radius {
                    dz.speed_limit
                } else {
                    fz_limit
                };
                if effective > 0 {
                    zone_speed_limit = Some(effective);
                }
                sign_limit = fz_limit;
                sign_state = if effective > 0 && sog > effective as u32 {
                    "blink"
                } else if inside_radius {
                    "grey"
                } else {
                    "red"
                };
            }

            // Inside the capture radius of an FZ that a DZ opened, the
            // rider is at the seam between two limits, and which seam it is
            // depends on what follows the point.
            //
            // Another FZ behind it — a cascade like DZ, FZ50, FZ30, FZ50 —
            // means the restriction continues at a new figure. The point
            // then plays the part the DZ played at the head of the zone: the
            // sign goes grey carrying the limit that is about to apply, and
            // enforcement stays at the more forgiving of the two until the
            // transition is behind them. Judging the passage at the stricter
            // figure would book a rider for a limit that only starts where
            // they are still braking into it.
            //
            // Anything else behind it — this FZ ends the run — means the
            // restriction is over: the zone sign comes down and what governs
            // is the limit of the point ahead. (With no zone sign the screen
            // falls back to its plain speeding warning, as it does anywhere
            // outside a zone.)
            let run_after_dz = |mut i: usize| {
                // Walk back over the run this FZ belongs to — these rules are
                // about a zone a DZ opened, not a stray FZ.
                while i > 0 && area.points_set[i - 1].point_type == "FZ" {
                    i -= 1;
                }
                i > 0 && area.points_set[i - 1].point_type == "DZ"
            };
            // Set when the branch below has taken the sign down on purpose,
            // so the lone-FZ fallback further on does not put it straight
            // back up for the tick before the capture lands.
            let mut zone_ended_here = false;
            let fz_in_radius = area.points_set.iter().enumerate().find_map(|(i, p)| {
                if p.point_type != "FZ"
                    || distance_to(p) > p.capture_radius as f64
                    || !run_after_dz(i)
                {
                    return None;
                }
                // No point after it at all: that is the end of the stage,
                // not a handover, and there is no limit to hand over to.
                Some((p.speed_limit, area.points_set.get(i + 1)?))
            });
            if let Some((here, ahead)) = fz_in_radius {
                if ahead.point_type == "FZ" {
                    let effective = here.max(ahead.speed_limit);
                    if effective > 0 {
                        zone_speed_limit = Some(effective);
                    }
                    sign_limit = ahead.speed_limit;
                    sign_state = if effective > 0 && sog > effective as u32 {
                        "blink"
                    } else {
                        "grey"
                    };
                } else {
                    sign_limit = 0;
                    sign_state = "none";
                    // Deliberately Some(0) when the point ahead carries no
                    // limit: past the zone there is nothing left to enforce,
                    // and leaving this None would keep the FZ's own figure.
                    zone_speed_limit = Some(ahead.speed_limit);
                    zone_ended_here = true;
                }
            }

            // Roadbook unlock latches on: entering the DSS visible radius,
            // or capturing an RBP (the pre-start marker whose whole job is
            // to open the roadbook) / DSS. Once set it stays set for this
            // area — it's persisted with the area state, so it survives an
            // app restart and only clears when a new day code rebuilds the
            // area.
            let captured_opener = area.points_set.iter().any(|p| {
                (p.point_type == "RBP" || p.point_type == "DSS")
                    && state
                        .race
                        .spec_area_state
                        .points
                        .get(&p.get_id())
                        .map(|ps| ps.checked)
                        .unwrap_or(false)
            });
            roadbook_unlocked = state.race.spec_area_state.roadbook_shown
                || dss_in_sight
                || captured_opener;
            // Same idea, but DSS specifically — roadbook slide odo values
            // are relative to the special stage start, so auto-scroll needs
            // this even when RBP alone already unlocked the roadbook view.
            // (Computed with the ASS guard above, which asks the same
            // question of the same points.)
            dss_taken = dss_checked;

            // "Keep pointing at WPT": while a point is held, it overrides
            // whatever the proximity scan / stored next_point picked — the
            // arrow must not move off it until the device exits its radius.
            let keep_pointing_at_wpt = state.settings.keep_pointing_at_wpt();
            // The hold is a navigation override only. The speed limit has to
            // keep following the real next point: while holding, the point
            // controller is deliberately left sitting on the captured point,
            // so that is peek_next(), not next_point_id — which the override
            // below is about to set to the held point itself.
            let limit_point_id = if holding_now.is_some() {
                state
                    .race
                    .spec_area_state
                    .point_controller
                    .peek_next()
                    .cloned()
                    .unwrap_or_else(|| next_point_id.clone())
            } else {
                next_point_id.clone()
            };
            if let Some(held_id) = holding_now {
                next_point_id = held_id;
            }

            if let Some(next_point) = area.get_point_by_id(&next_point_id) {
                next_point_type = next_point.point_type.clone();
                is_open = next_point.flags.is_open;
                max_speed = area
                    .get_point_by_id(&limit_point_id)
                    .map(|p| p.speed_limit)
                    .unwrap_or(next_point.speed_limit);
                // An FZ the zone branch above did not cover. In practice
                // that is a chained zone: the zone closes at the *first* FZ
                // after its DZ, so on a DZ,FZ50,FZ30,FZ50 leg every step
                // past the first one lands here — most of the restricted
                // distance — all of it except the capture radiuses
                // themselves, which the cascade rule above owns. The limit
                // is in force on those steps just the
                // same (max_speed right above comes from this very point),
                // so the sign is drawn the way it is inside a zone: red,
                // and blinking once the limit is actually broken. Anything
                // less understates it, and it used to be a flat grey that
                // stayed calm while the violation went into the report.
                //
                // The !is_checked guard separates "approaching an FZ" from
                // "that FZ ended the stage and is now captured", where
                // next_point_id stops advancing — the old screen-side rule
                // (`next_point_type === "FZ"`) could not tell them apart and
                // left the sign stuck on for the rest of the leg.
                if sign_limit == 0 && !zone_ended_here {
                    if let Some(p) = area.get_point_by_id(&limit_point_id) {
                        if p.point_type == "FZ" && !is_checked(p) {
                            sign_limit = p.speed_limit;
                            sign_state = if p.speed_limit > 0 && sog > p.speed_limit as u32 {
                                "blink"
                            } else {
                                "red"
                            };
                        }
                    }
                }
                if prev_point_id.is_empty() {
                    if let Some(point_id) = state.race.spec_area_state.point_controller.peek_prev() {
                        prev_point_id = point_id.clone()
                    }
                }
                if let Some(telemetry) = state.telemetry.get(&area.id) {
                    //
                    // ============================================================================
                    // calculating distance and course
                    // ============================================================================
                    dtw = distance(
                        Coords {
                            lat: coords.latitude,
                            lon: coords.longitude,
                        },
                        Coords {
                            lat: next_point.lat,
                            lon: next_point.lon,
                        },
                    );
                    in_visiable_zone = (dtw * 1000.0) <= (next_point.visible_radius as f64);
                    tel = telemetry.clone();
                    tel_loaded = true;
                    if let Some(_prev_position) = telemetry.steps.last() {
                        let length = telemetry.steps.len();
                        if length > 2 {
                            let prev_pos = &telemetry.steps[length - 2];
                            cog = course_in_degrees(
                                Coords {
                                    lat: prev_pos.coords.latitude,
                                    lon: prev_pos.coords.longitude,
                                },
                                Coords {
                                    lat: coords.latitude,
                                    lon: coords.longitude,
                                },
                            );
                            ctw = course_in_degrees(
                                Coords {
                                    lat: coords.latitude,
                                    lon: coords.longitude,
                                },
                                Coords {
                                    lat: next_point.lat,
                                    lon: next_point.lon,
                                },
                            )
                        }
                    }
                    // Track points only while actually moving. The speed gate
                    // used to sit on the telemetry write-back at the end of
                    // the tick, so standing still discarded the whole local
                    // copy and this push with it. Now that the write-back is
                    // unconditional (captures must survive a stop), the gate
                    // has to live here instead — otherwise a device parked
                    // for ten minutes would append six hundred points that
                    // all sit on the same spot, bloating the track buffer
                    // and the stored telemetry for nothing.
                    if sog > 3 {
                        tel.steps.push(*pos);
                    }
                    //
                    // ============================================================================
                    // oncoming detection
                    // ============================================================================
                    // Opt-in from SETUP: with the mode off, oncoming stays
                    // false so the warning screen never arms.
                    if state.settings.is_oncoming_detection_enabled() {
                        if let Some(prev_point) = area.get_point_by_id(&prev_point_id) {
                            let pathway = course_in_degrees(
                                Coords {
                                    lat: prev_point.lat,
                                    lon: prev_point.lon,
                                },
                                Coords {
                                    lat: next_point.lat,
                                    lon: next_point.lon,
                                },
                            );
                            let angle_diff = (pathway as i64 - cog as i64).abs() as u32;
                            let oncoming_angle = state.settings.get_oncoming_angle() as u32;
                            oncoming = angle_diff > 180 - (oncoming_angle / 2)
                                && angle_diff < 180 + (oncoming_angle / 2);
                        }
                    }
                    //
                    // ============================================================================
                    // point capture
                    // ============================================================================
                    let next_point_checked = state
                        .race
                        .spec_area_state
                        .points
                        .get(&next_point_id)
                        .unwrap_or(&PointState::new())
                        .checked;

                    let next_point_odo = next_point.odo;
                    let is_holding = state.race.spec_area_state.held_point.is_some();
                    if dtw * 1000.0 <= next_point.capture_radius as f64
                        && (!state.current.finished || !next_point_checked)
                        && !is_holding
                        && takeable(next_point)
                    {
                        capture = true;
                        prev_point_id = next_point_id.clone();
                        let is_rbp_point = next_point.point_type == "RBP";
                        // ASS capture auto-triggers a full checkpoint report
                        // send on the frontend (see App.tsx's sync_data poll).
                        if next_point.point_type == "ASS" {
                            ass_captured = true;
                        }
                        // Read up front, written below once `next_point` —
                        // and with it the borrow of `area` — is out of the
                        // way of the state writes.
                        let is_dss_point = next_point.point_type == "DSS";
                        if next_point.point_type.contains("NZ") {
                            counter = next_point.name.replace("NZ", "").parse().unwrap_or(0);
                            tel.events.push(
                                json!({
                                    "type": "neitrolization timer started",
                                    "point": state.race.spec_area_state.next_point.clone(),
                                    "time": pos.timestamp,
                                    "speed": coords.speed.unwrap_or(0.0) * 3.6,
                                    "accuracy": coords.accuracy
                                })
                                .to_string(),
                            );
                        }
                        is_open = false;
                        if !is_rbp_point {
                            let distance_to_point = dtw * 1000.0;
                            if (next_point_odo as f64) <= distance_to_point {
                                total_correction = Some(0.0);
                            } else {
                                total_correction = Some(
                                    (next_point_odo as f64 - distance_to_point) / 1000.0,
                                );
                            }
                        }
                        // Start the clock for the ASS guard: the stage
                        // proper begins here, and the finish stays shut until
                        // the odometer has moved on by ASS_MIN_RUN_KM from
                        // this reading.
                        if is_dss_point {
                            state.race.spec_area_state.dss_odo =
                                Some(state.dashboard.metrics.abs_total);
                        }
                        state
                            .race
                            .spec_area_state
                            .point_controller
                            .set_active(&next_point_id);
                        state
                            .race
                            .spec_area_state
                            .points
                            .get_mut(&next_point_id)
                            .unwrap()
                            .checked = true;
                        if !is_rbp_point {
                            state.dashboard.metrics.cp_counter += 1;
                        }
                        if keep_pointing_at_wpt && !is_rbp_point {
                            // Hold the arrow on this point instead of advancing
                            // to the next one — keep tracking it until the
                            // device exits this point's capture radius.
                            state.race.spec_area_state.held_point = Some(next_point_id.clone());
                            state.race.spec_area_state.held_min_dtw = Some(dtw);
                            arrow_color = "green".to_string();
                        } else if state.race.spec_area_state.point_controller.has_next() {
                            state.race.spec_area_state.point_controller.move_next();
                            prev_point_id = next_point_id.clone();
                            next_point_id = state
                                .race
                                .spec_area_state
                                .point_controller
                                .get_active()
                                .unwrap()
                                .clone();
                        } else {
                            finished = true;
                        }
                        // RBP is a pre-start marker only — keep it out of the
                        // captures report sent to the server.
                        if !is_rbp_point {
                            tel.captures.push(PointCapture {
                                point: prev_point_id.clone(),
                                point_type: next_point_type,
                                time: pos.timestamp,
                                speed: coords.speed.unwrap_or(0.0) * 3.6,
                                accuracy: coords.accuracy,
                                odo: next_point_odo,
                            });

                            let data = json!({
                                "race_number": state.race_number.clone(),
                                "device_id": "",
                                "etape": &state.race.active_code.clone(),
                                "report": {
                                    "points_captures": tel.captures,
                                    "speed_exceeds": tel.speed_exceeds,
                                    "other_events": tel.events,
                                },
                                "time": pos.timestamp,
                            })
                            .to_string();
                            // Same reasoning as the per-second telemetry
                            // emit: a failed emit must not abort the app
                            // under the release profile's panic = "abort",
                            // and least of all on the capture tick, which
                            // is where the ASS report is triggered from.
                            if send_report(app, data.clone()).is_err() {
                                println!("Capture report could not be handed over");
                            }
                            state.last_report = data;
                        }
                    } else if is_holding {
                        // Still holding: track the approach/retreat trend for
                        // the arrow color, and release once the device exits
                        // the held point's capture radius (resume normal nav).
                        // (Read capture_radius up front — next_point borrows
                        // from `area`, which must stay free of the mutable
                        // `state.race.spec_area_state` writes below.)
                        let capture_radius = next_point.capture_radius as f64;
                        let min_dtw = state.race.spec_area_state.held_min_dtw.unwrap_or(dtw);
                        if dtw <= min_dtw {
                            state.race.spec_area_state.held_min_dtw = Some(dtw);
                            arrow_color = "green".to_string();
                        } else {
                            arrow_color = "orange".to_string();
                        }
                        if dtw * 1000.0 > capture_radius {
                            state.race.spec_area_state.held_point = None;
                            state.race.spec_area_state.held_min_dtw = None;
                            if state.race.spec_area_state.point_controller.has_next() {
                                state.race.spec_area_state.point_controller.move_next();
                                prev_point_id = next_point_id.clone();
                                next_point_id = state
                                    .race
                                    .spec_area_state
                                    .point_controller
                                    .get_active()
                                    .unwrap()
                                    .clone();
                            } else {
                                finished = true;
                            }
                        }
                    }

                    let data = json!({
                        "race_number": state.race_number.clone(),
                        "device_id": "",
                        "etape": state.race.active_code.clone(),
                        "exceeding": state.dashboard.sog > state.dashboard.max_speed,
                        "speed": state.dashboard.sog,
                        "lat": state.coords.as_ref().unwrap_or(&GPSData::default()).latitude,
                        "lon": state.coords.as_ref().unwrap_or(&GPSData::default()).longitude,
                        "accuracy": "",
                        "point_name": prev_point_id.split("-").nth(1).unwrap_or(&""),
                        "checked": capture,
                        "time": pos.timestamp,
                    })
                    .to_string();
                    state.collected.push(data.clone());
                    // Never unwrap here: a failed emit would abort the whole
                    // app under the release profile's panic = "abort", and
                    // for the sake of one dropped per-second frame that the
                    // collected buffer is already holding a copy of anyway.
                    if send_telemetry(app, data).is_err() {
                        println!("Per-second telemetry could not be handed over");
                    }
                }
            }
        }

        // ============================================================================
        // updating current state
        // ============================================================================

        // Inside a DZ -> FZ zone the zone's own limit replaces next_point's,
        // so the sign, the beep, the telemetry record and the report all judge
        // against the same number.
        if let Some(limit) = zone_speed_limit {
            max_speed = limit;
        }

        state.current.speed_exceeded = sog > max_speed as u32;
        state.dashboard.metrics.countdown = counter;
        if sog > 3 {
            state.dashboard.dtw = dtw as f32;
            state.dashboard.cog = cog;
            state.dashboard.ctw = ctw;
            state.dashboard.sog = sog;
            state.dashboard.metrics.abs_total += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
            if let Some(new_total) = total_correction {
                state.dashboard.metrics.total = new_total;
            } else {
                state.dashboard.metrics.total += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
            }
            state.dashboard.metrics.partial += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
            if max_speed > 0 && sog > max_speed as u32 {
                let exceed = Exceed::new(
                    sog,
                    max_speed,
                    pos.timestamp,
                    state.dashboard.metrics.total as u32,
                );
                let odo_key = ((state.dashboard.metrics.total * 1000.0 / 150.0) as u32).to_string();
                if let Some(exceed_at_key) = tel.speed_exceeds.get(&odo_key) {
                    if sog > exceed_at_key.speed {
                        tel.speed_exceeds.insert(odo_key, exceed);
                    }
                } else {
                    tel.speed_exceeds.insert(odo_key, exceed);
                };
            }
            state.jump_suggestion = JumpSuggestion {
                suggested: jump_suggested,
                point: jump_point_id.clone(),
            };
        } else {
            state.dashboard.sog = 0;
        }
        // Write the tick's telemetry back whatever the speed. This used to
        // sit inside the `sog > 3` branch above, which quietly threw away
        // everything the tick had put in the local copy whenever the device
        // was barely moving — the capture record among it. Riders stop at
        // FZ and CP points, so exactly the captures that matter were the
        // ones going missing: navigation still advanced (`checked` lives in
        // spec_area_state and is written unconditionally), but the point
        // never reached the Captures sheet or the JSON report.
        //
        // Guarded on the load instead: when no area or no next point
        // resolves, `tel` is still the empty placeholder, and writing that
        // back would wipe the stage's accumulated record.
        if tel_loaded {
            state.telemetry.insert(area_id.clone(), tel);
        }

        // Make a capture durable the instant it happens. AppState::sync()
        // runs at the *start* of the next location_update, so until one
        // arrives the capture exists only in memory — and at an ASS one may
        // never arrive, since watchPosition goes quiet the moment the rider
        // stops at the finish. Being killed in that window rolls both the
        // record the report is built from and the point's checked flag back
        // one tick, while the collected buffer keeps its own copy (it is
        // persisted on its own ack), which is exactly the shape of "collected
        // saw the ASS, the report says it was never taken".
        if capture {
            if let Some(storage) = &state.storage {
                storage.set("as_telemetry", crypto::seal(json!(state.telemetry)));
                storage.set("race_state", crypto::seal(json!(state.race)));
                storage.close_resource();
            }
        }
        state.dashboard.widget_shown.arrow = is_open || in_visiable_zone;
        state.dashboard.arrow_color = arrow_color;
        state.current.capture = capture;
        // Write the latch back only when set: this runs even when no area
        // resolved this tick, and assigning the local unconditionally would
        // clear an already-open roadbook.
        if roadbook_unlocked {
            state.race.spec_area_state.roadbook_shown = true;
        }
        state.current.roadbook_unlocked = roadbook_unlocked;
        state.current.dss_taken = dss_taken;
        state.current.ass_captured = ass_captured;
        state.current.finished = finished;
        state.dashboard.max_speed = max_speed as u32;
        state.dashboard.sign_limit = sign_limit as u32;
        state.dashboard.sign_state = sign_state.to_string();
        state.race.spec_area_state.prev_point = prev_point_id;
        state.race.spec_area_state.next_point = next_point_id;
        state.current.oncoming = oncoming;

        // Queue the end-of-stage report here, in the same pass that captured
        // the ASS point. It used to be the frontend's job, triggered off the
        // `ass_captured` flag above — but that flag is a single-tick pulse
        // read by a *separate* sync_data call, so an overlapping GPS tick
        // could clear it before the frontend ever saw it. A missed pulse
        // meant the report was never generated or queued at all, and then
        // neither the retry timer nor the return of connectivity had
        // anything to send. Queued here it exists regardless, and the
        // frontend only has to upload it.
        //
        // Must come after the telemetry write-back above, or the report
        // would be built without the ASS capture that triggered it.
        if ass_captured {
            if let Err(e) = build_and_queue_report(app, &mut state, "auto") {
                println!("Auto report could not be built: {}", e);
                // Keep it where a human can reach it. This is the one report
                // nobody is watching being made, and a println on a phone is
                // the same as saying nothing at all.
                state.report_error = e;
            }
        }

        if capture {
            match send_collected(app, state.collected_batch()) {
                Ok(_) => {
                    println!("Collected batch handed to the frontend");
                }
                Err(_) => {
                    println!("Collected batch could not be handed over");
                }
            }
        }
    }
    Ok(())
}
