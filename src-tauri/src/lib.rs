mod config;
mod ipc;
mod race;
mod state;
#[cfg(test)]
mod tests;
mod utils;

use std::sync::Mutex;

use tauri::Manager;
use tauri_plugin_store::StoreExt as _;

use crate::{
    config::Config,
    state::{dashboard::DashBoard, race_config::RaceState, AppState},
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_device_info::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_app_control::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_android_fs::init())
        .plugin(tauri_plugin_geolocation::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ipc::race_number::get_race_number,
            ipc::race_number::set_race_number,
            ipc::settings::get_settings,
            ipc::settings::switch_background,
            ipc::settings::switch_theme,
            ipc::location::location_update,
            ipc::location::get_coords,
            ipc::states::snapshot,
            ipc::states::get_snapshot,
            ipc::states::update_config,
            ipc::states::get_current_cp_list,
            ipc::states::get_race_info,
            ipc::states::sync_data,
            ipc::states::point_switch,
            ipc::codes::activate_code,
            ipc::roadbook::get_roadbook,
            ipc::roadbook::get_roadbook_image,
            ipc::metrics::increase_total,
            ipc::metrics::decrease_total,
            ipc::metrics::reset_partial,
            ipc::admin::is_admin,
            ipc::admin::activate_cmd,
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
            if let Some(val) = store.get("race_state") {
                state.race = serde_json::from_value::<RaceState>(val).unwrap();
            }
            if let Some(val) = store.get("dashboard") {
                state.dashboard = serde_json::from_value::<DashBoard>(val).unwrap();
            }
            state.storage = Some(store);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
