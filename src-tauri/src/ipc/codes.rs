use std::sync::Mutex;

use serde_json::json;
use tauri::State;

use crate::{
    state::{race_config::RaceState, AppState},
    utils::parser::{upload_config, FormatedData},
};

/// Exposes the currently active day code so the frontend can restore its own
/// `activeCode` state on app mount. `state.race.active_code` itself already
/// survives an app restart (activate_code persists it immediately, and
/// location_update re-persists it on every GPS tick) — but nothing on the
/// frontend ever pulls it back in, so `activeCode` was silently resetting
/// to "" every time the app (re)loads, even though the backend still knew it.
#[tauri::command]
pub fn get_active_code(state: State<'_, Mutex<AppState>>) -> String {
    state
        .lock()
        .map(|s| s.race.active_code.clone())
        .unwrap_or_default()
}

#[tauri::command]
pub fn activate_code(state: State<'_, Mutex<AppState>>, code: &str) -> Result<String, ()> {
    let area_id;
    if let Ok(mut state) = state.lock() {
        if code == "007" {
            state.is_admin = true;
            return Ok("Admin privileges granted".to_string());
        } else {
            state.is_admin = false;
        }
        if code == "" {
            return Ok("".to_string());
        }
        if code == "DEMO" {
            if let Some(race) =
                upload_config(FormatedData::Toml(crate::config::DEMO_CONFIG.to_string()))
            {
                state.race = RaceState::new();
                state.race.active_code = "demo".to_string();
                state.race.expired = "none".to_string();
                state.race.current_sa = race.areas.get("demo").unwrap().id.clone();
                state.race.race = Some(race);
                state.last_report = String::from("");
            }
            return Ok("Demo mode activated".to_string());
        } else {
            if let Some(race) = state.race.race.as_ref() {
                if let Some(area) = race.areas.get(code) {
                    area_id = area.id.clone();
                    // `activate()` sets active_code/current_sa itself, and
                    // needs to read their pre-call values first to tell
                    // whether this is a genuine (re)activation — a new
                    // code, or a changed point list — versus a no-op
                    // re-entry of an already-active, unchanged code.
                    let rebuilt = state.race.activate(code);
                    if let Some(storage) = &state.storage {
                        storage.set("race_state", json!(state.race));
                        storage.close_resource();
                    }
                    if rebuilt {
                        state.dashboard.metrics.total = 0.0;
                        state.dashboard.metrics.partial = 0.0;
                        state.dashboard.metrics.countdown = 0;
                        state.dashboard.metrics.cp_counter = 0;
                        state.dashboard.metrics.abs_total = 0.0;
                        state.last_report = String::from("");
                        state.collected = vec![];
                        state
                            .telemetry
                            .insert(area_id.clone(), crate::state::telemetry::Telemetry::new());
                    }
                    return Ok(format!("Code {} activated", code));
                }
                return Ok("There's no such area".to_string());
            }
            return Ok("There's no Race Config".to_string());
        }
    }
    Ok("Code activated".to_string())
}
