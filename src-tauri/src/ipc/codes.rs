use std::sync::Mutex;

use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub fn activate_code(state: State<'_, Mutex<AppState>>, code: &str) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        if let Some(_storage) = &state.storage {
            if code == "007" {
                state.is_admin = true;
            } else {
                state.is_admin = false;
                
            }
        }
    }
    Ok(())
}