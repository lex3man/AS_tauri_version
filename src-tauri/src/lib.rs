mod config;
mod ipc;
mod race;
mod state;
#[cfg(test)]
mod tests;
mod utils;

use std::{collections::HashMap, sync::Mutex};

use tauri::Manager;
use tauri_plugin_device_info::DeviceInfoExt as _;
use tauri_plugin_store::StoreExt as _;

use crate::{
    config::Config,
    state::{dashboard::DashBoard, race_config::RaceState, telemetry::Telemetry, AppState},
    utils::crypto,
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
            ipc::report::get_pending_report,
            ipc::report::mark_report_sent,
            ipc::report::set_report_status,
            ipc::report::ack_collected,
            ipc::report::get_pending_collected,
        ])
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            let store = app.store("AS_storage.json")?;

            // Derive the at-rest key before a single value is read. The salt
            // is per-install and sits in the store in the clear — it is the
            // device identifier, which is deliberately not written anywhere,
            // that makes a copied file useless elsewhere.
            //
            // No device id means no vault, and every read and write below
            // falls back to plaintext rather than refusing to run: a build
            // on a platform the plugin does not answer for is still a
            // working app, just an unencrypted one.
            let salt = match store.get("as_vault_salt").and_then(|v| v.as_str().map(String::from)) {
                Some(salt) => Some(salt),
                None => {
                    let fresh = crypto::new_salt();
                    if let Some(salt) = &fresh {
                        store.set("as_vault_salt", serde_json::json!(salt));
                    }
                    fresh
                }
            };
            let device_id = app
                .device_info()
                .get_device_info()
                .ok()
                .and_then(|info| info.uuid);
            if let (Some(device_id), Some(salt)) = (device_id, salt) {
                if let Ok(salt) = base64::Engine::decode(
                    &base64::engine::general_purpose::STANDARD,
                    salt.as_bytes(),
                ) {
                    crypto::init(&device_id, &salt);
                }
            }

            let state = app.state::<Mutex<AppState>>();
            let mut state = state.lock().unwrap();

            // Every restore below is now tolerant of a value that will not
            // parse. It has to be: a store carried to another device, or
            // written by a build with a different secret, decrypts to
            // nothing, and the old `.unwrap()` would have turned that into
            // an abort on startup — the release profile has no unwinding —
            // leaving an app that could not be opened at all. Dropping back
            // to defaults is recoverable; a boot loop is not.
            if let Some(val) = crypto::open(store.get("race_number")) {
                state.race_number = val.as_str().map(|s| s.to_string());
            }
            if let Some(cfg) = crypto::open(store.get("settings"))
                .and_then(|val| serde_json::from_value::<Config>(val).ok())
            {
                state.settings = cfg;
            }
            if let Some(val) = crypto::open(store.get("snapshot")) {
                state.snapshot = val.as_str().map(|s| s.to_string());
            }
            if let Some(race) = crypto::open(store.get("race_state"))
                .and_then(|val| serde_json::from_value::<RaceState>(val).ok())
            {
                state.race = race;
            }
            if let Some(dash) = crypto::open(store.get("as_dashboard"))
                .and_then(|val| serde_json::from_value::<DashBoard>(val).ok())
            {
                state.dashboard = dash;
            }
            if let Some(tel) = crypto::open(store.get("as_telemetry"))
                .and_then(|val| serde_json::from_value::<HashMap<String, Telemetry>>(val).ok())
            {
                state.telemetry = tel;
            }
            // .to_string() on a serde_json::Value re-serializes it as JSON
            // text (quotes and all) rather than giving back the raw string
            // — .as_str() is what race_number/snapshot above correctly use.
            // Using .to_string() here quoted-and-escaped this value on every
            // restart, and since AppState::sync() re-persists it on every
            // GPS tick, each subsequent restart escaped the already-escaped
            // text again — compounding into a growing run of `\` and `"`
            // characters in CONFIG UPDATED.
            if let Some(val) = crypto::open(store.get("as_config_updayed_time")) {
                state.config_updated = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_report_sent_auto_time")) {
                state.report_sent_auto = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_report_sent_manual_time")) {
                state.report_sent_manual = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_pending_report_path")) {
                state.pending_report_path = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_pending_report_mode")) {
                state.pending_report_mode = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_pending_report_etape")) {
                state.pending_report_etape = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_last_report")) {
                state.last_report = val.as_str().unwrap_or_default().to_string();
            }
            if let Some(val) = crypto::open(store.get("as_report_status")) {
                state.report_error = val.as_str().unwrap_or_default().to_string();
            }
            // Telemetry that never reached the server. Restored as a pair:
            // the base is what gives the restored records their sequence
            // numbers again, so an ack can still name them.
            if let Some(val) = crypto::open(store.get("as_collected")) {
                state.collected = serde_json::from_value::<Vec<String>>(val).unwrap_or_default();
            }
            if let Some(val) = crypto::open(store.get("as_collected_base")) {
                state.collected_base = val.as_u64().unwrap_or_default();
            }
            state.storage = Some(store);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
