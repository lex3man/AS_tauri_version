use crate::{state::Position, utils::actor::make_culc, AppState};
use serde_json::json;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn location_update(state: State<'_, Mutex<AppState>>, data: &str) {
    let gps_data: Position = serde_json::from_str(data).unwrap();

    if let Ok(mut state) = state.lock() {
        state.coords = Some(gps_data.coords.clone());
        if let Some(store) = &state.storage {
            store.set("position", json!(gps_data.coords));
            store.set("sa_state", json!(state.race.spec_area_state));
            store.set("race_state", json!(state.race));
            store.set("dashboard", json!(state.dashboard));
        }
        state.sync();
    }
    match make_culc(&state, &gps_data) {
        Ok(_) => {}
        Err(_) => {}
    }
}

#[tauri::command]
pub fn get_coords(state: State<'_, Mutex<AppState>>) -> Option<String> {
    if let Ok(state) = state.lock() {
        if let Some(coords) = state.coords {
            return Some(json!(coords).to_string());
        }
    }
    None
}
