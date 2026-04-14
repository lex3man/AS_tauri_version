use crate::{AppState, state::{GPSData, Position}, utils::actor::make_culc};
use serde_json::json;
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn location_update(app: AppHandle, state: State<'_, Mutex<AppState>>, data: &str) {
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
    match make_culc(&app, &state, &gps_data) {
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

pub fn send_telemetry(
    app: &AppHandle,
    state: &MutexGuard<AppState>,
    checked: bool,
) -> Result<(), ()> {
    let data = json!({
            "race_number": &state.race_number.clone(),
            "device_id": "",
            "etape": &state.race.active_code.clone(),
            "exceeding": state.dashboard.sog > state.dashboard.max_speed,
            "speed": state.dashboard.sog,
            "lat": state.coords.as_ref().unwrap_or(&GPSData::default()).latitude,
            "lon": state.coords.as_ref().unwrap_or(&GPSData::default()).longitude,
            "accuracy": "",
            "point_name": state.race.spec_area_state.next_point.clone(),
            "checked": checked,
            "time": ""})
    .to_string();
    match app.emit("send_telemetry", data) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    };
}
