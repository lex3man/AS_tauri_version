mod config;
mod ipc;
mod race;
mod state;
#[cfg(test)]
mod tests;
mod utils;

use std::{collections::HashMap, sync::Mutex};

use tauri::Manager;
use tauri_plugin_store::StoreExt as _;

use crate::{
    config::Config,
    state::{dashboard::DashBoard, race_config::RaceState, telemetry::Telemetry, AppState},
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_gamepad::init())
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
            ipc::settings::set_dist_step,
            ipc::settings::set_track_dist,
            ipc::settings::increase_angle,
            ipc::settings::decrease_angle,
            ipc::settings::increase_detection,
            ipc::settings::decrease_detection,
            ipc::settings::switch_oncoming_mode,
            ipc::settings::switch_jump_mode,
            ipc::settings::switch_auto_move,
            ipc::settings::switch_keep_pointing_at_wpt,
            ipc::settings::switch_auto_move_after_dss,
            ipc::settings::close_app,
            ipc::location::location_update,
            ipc::location::get_coords,
            ipc::location::jump_reaction,
            ipc::location::get_location_history,
            ipc::states::snapshot,
            ipc::states::get_snapshot,
            ipc::states::update_config,
            ipc::states::get_current_cp_list,
            ipc::states::get_points_list,
            ipc::states::get_race_info,
            ipc::states::sync_data,
            ipc::states::point_switch,
            ipc::states::state_reset,
            ipc::codes::activate_code,
            ipc::codes::get_active_code,
            ipc::roadbook::get_roadbook,
            ipc::roadbook::get_roadbook_image,
            ipc::metrics::increase_total,
            ipc::metrics::decrease_total,
            ipc::metrics::reset_partial,
            ipc::metrics::get_exceeds,
            ipc::metrics::update_total,
            ipc::admin::is_admin,
            ipc::admin::activate_cmd,
            ipc::report::export_telemetry_report,
            ipc::report::get_report_sent_time,
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
            if let Some(val) = store.get("as_dashboard") {
                state.dashboard = serde_json::from_value::<DashBoard>(val).unwrap();
            }
            if let Some(val) = store.get("as_telemetry") {
                state.telemetry =
                    serde_json::from_value::<HashMap<String, Telemetry>>(val).unwrap();
            }
            // .to_string() on a serde_json::Value re-serializes it as JSON
            // text (quotes and all) rather than giving back the raw string
            // — .as_str() is what race_number/snapshot above correctly use.
            // Using .to_string() here quoted-and-escaped this value on every
            // restart, and since AppState::sync() re-persists it on every
            // GPS tick, each subsequent restart escaped the already-escaped
            // text again — compounding into a growing run of `\` and `"`
            // characters in CONFIG UPDATED.
            if let Some(val) = store.get("as_config_updayed_time") {
                state.config_updated = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = store.get("as_report_sent_auto_time") {
                state.report_sent_auto = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = store.get("as_report_sent_manual_time") {
                state.report_sent_manual = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = store.get("as_last_report") {
                state.last_report = val.as_str().unwrap_or_default().to_string();
            }
            state.storage = Some(store);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
