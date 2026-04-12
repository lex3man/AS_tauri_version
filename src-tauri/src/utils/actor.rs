use std::{sync::Mutex};

use serde_json::json;
use tauri::AppHandle;

use crate::{
    ipc::location::send_telemetry,
    race::types::Coords,
    state::{
        AppState, GPSData, Position, telemetry::{Exceed, PointCapture, Telemetry}
    },
    utils::converters::{course_in_degrees, distance},
};

pub fn make_culc(app: &AppHandle, state: &Mutex<AppState>, pos: &Position) -> Result<(), ()> {
    if pos.coords.speed.unwrap_or(0.0) * 3.6 < 5.0 {
        return Ok(());
    }
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
        let mut total_correction = None;
        let sog = (coords.speed.unwrap_or(0.0) * 3.6) as u32;
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

        // ============================================================================
        // loading current state
        // ============================================================================
        let code = &state.race.active_code;
        if let Some(area) = state.race.race.as_ref().unwrap().areas.get(code) {
            area_id = area.id.clone();
            next_point_id = state.race.spec_area_state.next_point.clone();

            let _ = &area.points_set.iter().for_each(|point| {
                if distance(
                    Coords {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    },
                    Coords {
                        lat: point.lat,
                        lon: point.lon,
                    },
                ) * 1000.0
                    <= point.capture_radius as f64
                    && !state
                        .race
                        .spec_area_state
                        .points
                        .get(&point.get_id())
                        .unwrap()
                        .checked
                {
                    next_point_id = point.get_id();
                }
            });

            if let Some(next_point) = area.get_point_by_id(&next_point_id) {
                is_open = next_point.flags.is_open;
                max_speed = next_point.speed_limit;
                prev_point_id = state.race.spec_area_state.prev_point.clone();
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
                                    lat: pos.coords.latitude,
                                    lon: pos.coords.longitude,
                                },
                            );
                            ctw = course_in_degrees(
                                Coords {
                                    lat: pos.coords.latitude,
                                    lon: pos.coords.longitude,
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
                    // point capture
                    // ============================================================================
                    if dtw * 1000.0 <= next_point.capture_radius as f64 {
                        prev_point_id = next_point_id.clone();
                        is_open = false;
                        if next_point.odo <= next_point.capture_radius {
                            total_correction = Some(0.0);
                        } else {
                            total_correction = Some(
                                ((next_point.odo as u32 - next_point.capture_radius as u32) / 1000)
                                    as f64,
                            );
                        }
                        state
                            .race
                            .spec_area_state
                            .point_controller
                            .set_active(&next_point_id);
                        if state.race.spec_area_state.point_controller.has_next() {
                            state
                                .race
                                .spec_area_state
                                .points
                                .get_mut(&next_point_id)
                                .unwrap()
                                .checked = true;
                            state.dashboard.metrics.cp_counter += 1;
                            state.race.spec_area_state.point_controller.move_next();
                            next_point_id = state
                                .race
                                .spec_area_state
                                .point_controller
                                .get_active()
                                .unwrap()
                                .clone();
                        }
                        tel.events.push(
                            json!({
                                "type": "point_capture",
                                "point": state.race.spec_area_state.next_point.clone(),
                                "time": pos.timestamp,
                                "speed": pos.coords.speed.unwrap_or(0.0) * 3.6,
                                "accuracy": pos.coords.accuracy
                            })
                            .to_string(),
                        );
                        tel.captures.push(PointCapture {
                            point: state.race.spec_area_state.next_point.clone(),
                            time: pos.timestamp,
                            speed: pos.coords.speed.unwrap_or(0.0) * 3.6,
                            accuracy: pos.coords.accuracy,
                        });
                        send_telemetry(app, &state, true).unwrap();
                    } else {
                        send_telemetry(app, &state, false).unwrap();
                    }
                }
            }
        }

        // ============================================================================
        // updating current state
        // ============================================================================
        
        state.current.speed_exceeded = sog > state.current.speed_limit as u32;
        state.dashboard.dtw = dtw as f32;
        state.dashboard.cog = cog;
        state.dashboard.ctw = ctw;
        state.dashboard.sog = sog;
        state.current.speed_limit = max_speed;
        if let Some(new_total) = total_correction {
            state.dashboard.metrics.total = new_total;
        } else {
            state.dashboard.metrics.total += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
        }
        state.dashboard.metrics.partial += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
        state.race.spec_area_state.prev_point = prev_point_id;
        state.race.spec_area_state.next_point = next_point_id;
        if state.current.speed_exceeded {
            let odo_key = (state.dashboard.metrics.total / 150.0) as u32;
            let exceed = Exceed::new(sog, state.current.speed_limit, pos.timestamp);
            if exceed.speed > tel.speed_exceeds.get(&odo_key).unwrap_or(&Exceed::new(0, 0, 0)).speed {  
                    tel.speed_exceeds.insert(odo_key, exceed);
            }
        }
        state.telemetry.insert(area_id.clone(), tel);
        state.dashboard.widget_shown.arrow = is_open || in_visiable_zone;
    }
    Ok(())
}
