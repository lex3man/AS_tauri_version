pub mod race_config;

use std::sync::Arc;

use tauri::Wry;
use tauri_plugin_store::Store;

use crate::{config::Config, ipc::location::Coords};

pub struct AppState {
    pub storage: Option<Arc<Store<Wry>>>,
    pub race_number: Option<String>,
    pub is_admin: bool, 
    pub settings: Config,
    pub coords: Option<Coords>,
    pub snapshot: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        AppState {
            storage: None,
            race_number: None,
            is_admin: false,
            settings: Config::new(),
            coords: None,
            snapshot: None,
        }
    }
}