
use std::sync::{Mutex};
use tauri::{State};
use crate::state::AppState;

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