
use std::{collections::HashMap, sync::Mutex};
use serde_json::json;
use tauri::{State};
use crate::state::{AppState, telemetry::{Exceed, Telemetry}};

#[tauri::command]
pub fn increase_total(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.total += 100.0;
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn decrease_total(state: State<'_, Mutex<AppState>>) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        state.dashboard.metrics.total -= 100.0;
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
        result = state.telemetry.get(&area).unwrap_or(&Telemetry::new()).speed_exceeds.clone();
    }
    println!("get_exceeds: {:?}", result);
    Ok(json!(result).to_string())
}