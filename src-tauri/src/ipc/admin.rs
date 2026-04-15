use std::sync::Mutex;

use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub fn is_admin(state: State<'_, Mutex<AppState>>) -> bool {
    if let Ok(state) = state.lock() {
        if state.is_admin {
            return true;
        }
    }
    false
}

#[tauri::command]
pub async fn activate_cmd(state: State<'_, Mutex<AppState>>, cmd: &str) -> Result<String, String> {
    println!("GOT COMMAND {}", cmd);
    if let Ok(state) = state.lock() {
        if let Some(rnum) = &state.race_number {
            if rnum == "DEMO" {
                return Err("NO COMMANDS IN DEMO MODE".to_string());
            }
        }
    }
    Ok(String::from("DONE!"))
}
