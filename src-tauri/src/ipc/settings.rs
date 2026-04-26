use crate::AppState;
use serde_json::json;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn get_settings(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    if let Ok(state) = state.lock() {
        if let Some(storage) = &state.storage {
            if let Some(value) = storage.get("settings") {
                storage.close_resource();
                return Ok(value.to_string());
            };
            storage.close_resource();
        }
    }
    Ok("".to_string())
}

#[tauri::command]
pub async fn switch_background(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        s.settings.background_switch();
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn switch_theme(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        s.settings.theme_switch();
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn set_dist_step(state: State<'_, Mutex<AppState>>, c: &str) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        match c {
            "up" => {
                state.settings.increase_dist();
            }
            "down" => {
                state.settings.decrease_dist();
            }
            _ => {}
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn set_track_dist(state: State<'_, Mutex<AppState>>, c: &str) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        match c {
            "up" => {
                state.settings.increase_track();
            }
            "down" => {
                state.settings.decrease_track();
            }
            _ => {}
        }
        return Ok(());
    }
    Err(())
}
