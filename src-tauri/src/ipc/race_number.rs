use std::sync::Mutex;
// use serde_json::json;
use tauri::State;

use crate::AppState;

#[tauri::command]
pub fn get_race_number(state: State<'_, Mutex<AppState>>) -> Option<String> {
    let state = state.lock().unwrap();
    state.race_number.clone()
}

#[tauri::command]
pub async fn set_race_number(state: State<'_, Mutex<AppState>>, value: &str) -> Result<(), ()> {
    let mut state = state.lock().unwrap();
    if let Some(storage) = &state.storage {
        storage.set("race_number", value);
        storage.close_resource();
    };
    state.race_number = Some(value.to_string());
    Ok(())
}