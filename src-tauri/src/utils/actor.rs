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
    utils::{
        converters::{course_in_degrees, distance},
        send_data::{send_collected, send_report, send_telemetry},
    },
};

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
        let mut area_id = String::new();
        let mut tel = Telemetry::new();
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
            });

            // Roadbook unlock is a level, not a one-shot pulse: recomputed
            // fresh every tick from already-checked RBP/DSS points, so it
            // survives an app restart/resume without waiting for a brand
            // new RBP/DSS crossing to fire it again.
            roadbook_unlocked = area.points_set.iter().any(|p| {
                (p.point_type == "RBP" || p.point_type == "DSS")
                    && state
                        .race
                        .spec_area_state
                        .points
                        .get(&p.get_id())
                        .map(|ps| ps.checked)
                        .unwrap_or(false)
            });
            // Same idea, but DSS specifically — roadbook slide odo values
            // are relative to the special stage start, so auto-scroll needs
            // this even when RBP alone already unlocked the roadbook view.
            dss_taken = area.points_set.iter().any(|p| {
                p.point_type == "DSS"
                    && state
                        .race
                        .spec_area_state
                        .points
                        .get(&p.get_id())
                        .map(|ps| ps.checked)
                        .unwrap_or(false)
            });

            // "Keep pointing at WPT": while a point is held, it overrides
            // whatever the proximity scan / stored next_point picked — the
            // arrow must not move off it until the device exits its radius.
            let keep_pointing_at_wpt = state.settings.keep_pointing_at_wpt();
            if let Some(held_id) = holding_now {
                next_point_id = held_id;
            }

            if let Some(next_point) = area.get_point_by_id(&next_point_id) {
                next_point_type = next_point.point_type.clone();
                is_open = next_point.flags.is_open;
                max_speed = next_point.speed_limit;
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
                    tel.steps.push(*pos);
                    //
                    // ============================================================================
                    // oncoming detection
                    // ============================================================================
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
                    {
                        capture = true;
                        prev_point_id = next_point_id.clone();
                        let is_rbp_point = next_point.point_type == "RBP";
                        // ASS capture auto-triggers a full checkpoint report
                        // send on the frontend (see App.tsx's sync_data poll).
                        if next_point.point_type == "ASS" {
                            ass_captured = true;
                        }
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
                            send_report(app, data.clone()).unwrap();
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
                    send_telemetry(app, data).unwrap();
                }
            }
        }

        // ============================================================================
        // updating current state
        // ============================================================================

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
            state.telemetry.insert(area_id.clone(), tel);
            state.jump_suggestion = JumpSuggestion {
                suggested: jump_suggested,
                point: jump_point_id.clone(),
            };
        } else {
            state.dashboard.sog = 0;
        }
        state.dashboard.widget_shown.arrow = is_open || in_visiable_zone;
        state.dashboard.arrow_color = arrow_color;
        state.current.capture = capture;
        state.current.roadbook_unlocked = roadbook_unlocked;
        state.current.dss_taken = dss_taken;
        state.current.ass_captured = ass_captured;
        state.current.finished = finished;
        state.dashboard.max_speed = max_speed as u32;
        state.race.spec_area_state.prev_point = prev_point_id;
        state.race.spec_area_state.next_point = next_point_id;
        state.current.oncoming = oncoming;

        if capture {
            match send_collected(app, state.collected.clone()) {
                Ok(_) => {
                    println!("Collected data sent!!!");
                }
                Err(_) => {
                    println!("Collected data sending faild!!!");
                }
            }
        }
    }
    Ok(())
}
