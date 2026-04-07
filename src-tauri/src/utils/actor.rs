use std::sync::Mutex;

use crate::{
    race::types::Coords,
    state::{AppState, GPSData, Position},
    utils::converters::distance,
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
        let code = &state.race.active_code;
        let next_point_id = &state.race.spec_area_state.next_point;
        if let Some(area) = &state.race.race.as_ref().unwrap().areas.get(code) {
            if let Some(next_point) = area.get_point_by_id(next_point_id) {
                let distance = distance(
                    Coords {
                        lat: coords.latitude,
                        lon: coords.longitude,
                    },
                    Coords {
                        lat: next_point.lat,
                        lon: next_point.lon,
                    },
                );
                state.dashboard.dtw = (distance / 1000.0) as f32;
            }
        }
    }
    Ok(())
}
