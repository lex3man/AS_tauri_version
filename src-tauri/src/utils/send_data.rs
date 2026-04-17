use std::sync::MutexGuard;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::state::{AppState, GPSData, telemetry::Telemetry};

pub fn send_report(
    app: &AppHandle,
    state: &MutexGuard<AppState>,
    tel: &Telemetry
) -> Result<(), ()> {
    let data = json!({
        "race_number": &state.race_number.clone(),
        "device_id": "",
        "etape": &state.race.active_code.clone(),
        "report": {
            "points_captures": tel.captures,
            "speed_exceeds": tel.speed_exceeds,
            "other_events": tel.events,
        }
    
    })
    .to_string();

    match app.emit("send_report", data) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    };
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
        "time": "",
    })
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