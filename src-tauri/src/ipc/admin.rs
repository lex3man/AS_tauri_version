use std::sync::Mutex;

use tauri::State;

use crate::state::AppState;

// #[tauri::command]
// pub async fn setValue(state: State<'_, Mutex<AppState>>, data: &str) -> Result<(), ()> {
//     if let Ok(state) = state.lock() {
//         if state.is_admin {

//             if let Some(storage) = &state.storage {
//                 storage.set(key, value);
//             }
//             return Ok(())
//         }
//     }
//     return Err(())
// }

#[tauri::command]
pub fn is_admin(state: State<'_, Mutex<AppState>>) -> bool {
    if let Ok(state) = state.lock() {
        if state.is_admin { return true; }
    }
    false
}
