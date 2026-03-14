mod ipc;
mod utils;
mod config;
mod state;

use std::sync::{Mutex};

use tauri::{Manager};
use tauri_plugin_store::{StoreExt as _};

use crate::{config::Config, state::AppState};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_geolocation::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ipc::init::initialization,
            ipc::race_number::get_race_number,
            ipc::race_number::set_race_number,
            ipc::settings::get_settings,
            ipc::settings::switch_background,
            ipc::settings::switch_theme,
            ipc::location::location_update,
            ipc::location::get_coords,
            ipc::states::snapshot,
            ipc::states::get_snapshot,
            ])
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            let store = app.store("AS_storage.json")?;
            let state = app.state::<Mutex<AppState>>();
            let mut state = state.lock().unwrap();
            
            if let Some(val) = store.get("race_number") {
                state.race_number = Some(val.as_str().unwrap().to_string());
            }
            if let Some(val) = store.get("settings") {
                state.settings = serde_json::from_value::<Config>(val).unwrap();
            }
            if let Some(val) = store.get("snapshot") {
                state.snapshot = Some(val.as_str().unwrap().to_string());
            }
            state.storage = Some(store);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}