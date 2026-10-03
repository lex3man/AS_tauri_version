use crate::AppState;
use serde_json::json;
use std::{process, sync::Mutex};
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
        let _ = s.settings.theme_switch();
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn switch_jump_mode(state: State<'_, Mutex<AppState>>, status: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        s.settings.jump_mode_switch(status);
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn switch_keep_pointing_at_wpt(state: State<'_, Mutex<AppState>>, status: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        s.settings.keep_pointing_at_wpt_switch(status);
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn switch_oncoming_mode(state: State<'_, Mutex<AppState>>, status: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        let new_state = s.settings.oncoming_detection_switch();
        match status {
            "on" => if !new_state {
                s.settings.oncoming_detection_switch();
            },
            "off" => if new_state {
                s.settings.oncoming_detection_switch();
            },
            _ => {}
        }
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn switch_auto_move(state: State<'_, Mutex<AppState>>, status: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        let new_state = s.settings.auto_move_switch();
        match status {
            "on" => if !new_state {
                s.settings.auto_move_switch();
            },
            "off" => if new_state {
                s.settings.auto_move_switch();
            },
            _ => {}
        }
        if let Some(storage) = &s.storage {
            storage.set("settings", json!(s.settings));
            storage.close_resource();
        }
    };
    Ok(())
}

#[tauri::command]
pub fn switch_auto_move_after_dss(state: State<'_, Mutex<AppState>>, status: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        s.settings.auto_move_after_dss_switch(status);
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
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
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
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn increase_angle(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.settings.increase_oncoming_angle();
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn decrease_angle(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.settings.decrease_oncoming_angle();
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn increase_detection(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.settings.increase_oncoming_detection();
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn decrease_detection(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.settings.decrease_oncoming_detection();
        if let Some(storage) = &state.storage {
            storage.set("settings", json!(state.settings));
            storage.close_resource();
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn close_app() {
    process::exit(1);
}