use crate::state::{
    telemetry::{Exceed, Telemetry},
    AppState,
};
use serde_json::json;
use std::{collections::HashMap, sync::Mutex};
use tauri::State;

#[tauri::command]
pub fn increase_total(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.total += state.settings.get_dist() as f64 / 1000.0;
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn decrease_total(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.total -= state.settings.get_dist() as f64 / 1000.0;
        if state.dashboard.metrics.total < 0.0 {
            state.dashboard.metrics.total = 0.0;
        }
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn reset_partial(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.partial = 0.0;
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub async fn get_exceeds(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    let mut result: HashMap<String, Exceed> = HashMap::new();
    if let Ok(state) = state.lock() {
        let area = state.race.current_sa.clone();
        result = state
            .telemetry
            .get(&area)
            .unwrap_or(&Telemetry::new())
            .speed_exceeds
            .clone();
    }
    Ok(json!(result).to_string())
}

#[tauri::command]
pub fn update_total(state: State<'_, Mutex<AppState>>, total: f64) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.total = total;
        return Ok(());
    }
    Err(())
}
