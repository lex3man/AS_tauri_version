use std::sync::Mutex;

use tauri::State;

use crate::{
    state::{race_config::RaceState, AppState},
    utils::parser::{upload_config, FormatedData},
};

#[tauri::command]
pub fn activate_code(state: State<'_, Mutex<AppState>>, code: &str) -> Result<String, ()> {
    if let Ok(mut state) = state.lock() {
        if let Some(_storage) = &state.storage {
            if code == "007" {
                state.is_admin = true;
            } else {
                state.is_admin = false;
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
                    return Ok("DEMO".to_string());
                }
            }
        }
    }
    Ok("Code activated".to_string())
}
