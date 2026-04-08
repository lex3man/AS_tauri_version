use std::{collections::HashMap, sync::Mutex};

use crate::{
    race::types::Coords,
    state::{telemetry::Telemetry, AppState, GPSData, Position},
    utils::converters::{course_in_degrees, distance},
};

pub fn make_culc(state: &Mutex<AppState>, pos: &Position) -> Result<(), ()> {
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
        let code = &state.race.active_code;
        let sog = (coords.speed.unwrap_or(0.0) * 3.6) as u32;
        let mut next_point_id = "".to_string();
        let mut prev_point_id = "".to_string();
        let mut dtw = 0.0f64;
        let mut cog = 0;
        let mut ctw = 0;
        let mut area_id = String::new();
        let mut tel = Telemetry {
            events: vec![],
            steps: vec![],
            speed_exceeds: HashMap::new(),
        };

        // ============================================================================
        // loading current state
        // ============================================================================
        if let Some(area) = &state.race.race.as_ref().unwrap().areas.get(code) {
            area_id = area.id.clone();
            next_point_id = state.race.spec_area_state.next_point.clone();
            if let Some(next_point) = area.get_point_by_id(&next_point_id) {
                next_point_id = next_point.get_id();
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
                    ) / 1000.0;
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
                        if next_point.odo <= next_point.capture_radius {
                            total_correction = Some(0.0);
                        } else {
                            total_correction = Some(
                                ((next_point.odo as u32 - next_point.capture_radius as u32) / 1000)
                                    as f64,
                            );
                        }
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
                    }
                }
            }
        }

        // ============================================================================
        // updating current state
        // ============================================================================
        state.dashboard.dtw = dtw as f32;
        state.dashboard.cog = cog;
        state.dashboard.ctw = ctw;
        state.dashboard.sog = sog;
        if let Some(new_total) = total_correction {
            state.dashboard.metrics.total = new_total;
        } else {
            state.dashboard.metrics.total += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
        }
        state.dashboard.metrics.partial += (coords.speed.unwrap_or(0.0) / 1000.0) as f64;
        state.race.spec_area_state.prev_point = prev_point_id;
        state.race.spec_area_state.next_point = next_point_id;
        state.telemetry.insert(area_id.clone(), tel);
    }
    Ok(())
}
