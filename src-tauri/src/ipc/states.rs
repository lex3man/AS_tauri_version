use std::sync::Mutex;

use serde_json::json;
use tauri::State;

use crate::AppState;

#[tauri::command]
pub async fn snapshot(state: State<'_, Mutex<AppState>>, snapshot: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        if let Some(storage) = &s.storage {
            storage.set("snapshot", json!(snapshot));
            storage.close_resource();
        }
        s.snapshot = Some(snapshot.to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn get_snapshot(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    if let Ok(state) = state.lock() {
        if let Some(storage) = &state.storage {
            if let Some(value) = storage.get("snapshot") {
                storage.close_resource();
                return Ok(value.to_string());
            };
            storage.close_resource();
        }
    }
    Err(())
}
