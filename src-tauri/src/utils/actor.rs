use std::sync::Mutex;

use crate::state::{AppState, Coords, Position};

pub fn make_culc(state: &Mutex<AppState>, pos: &Position) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        let coords = Coords {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude_accuracy: pos.coords.altitude_accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
        };
        state.coords = Some(coords);
    }
    Ok(())
}
