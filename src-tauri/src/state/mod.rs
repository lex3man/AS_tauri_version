pub mod dashboard;
pub mod race_config;

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::Wry;
use tauri_plugin_store::Store;

use crate::{
    config::Config,
    state::{
        dashboard::DashBoard,
        race_config::{RaceState, SpecEreaState},
    },
};

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Coords {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f64,
    pub altitude_accuracy: Option<f32>,
    pub altitude: Option<f32>,
    pub speed: Option<f32>,
    pub heading: Option<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Position {
    pub timestamp: u64,
    pub coords: Coords,
}

pub struct AppState {
    pub storage: Option<Arc<Store<Wry>>>,
    pub race_number: Option<String>,
    pub is_admin: bool,
    pub settings: Config,
    pub coords: Option<Coords>,
    pub snapshot: Option<String>,
    pub spec_area: SpecEreaState,
    pub race: RaceState,
    pub dashboard: DashBoard,
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
            spec_area: SpecEreaState::new(),
            race: RaceState::new(),
            dashboard: DashBoard::new(),
        }
    }
}

impl AppState {
    pub fn sync(&self) {
        if let Some(storage) = &self.storage {
            storage.set("as_race_number", json!(self.race_number));
            storage.set("as_settings", json!(self.settings));
            storage.set("as_coords", json!(self.coords));
            storage.set("as_snapshot", json!(self.snapshot));
            storage.set("as_spec_area", json!(self.spec_area));
            storage.set("as_race", json!(self.race));
            storage.set("as_dashboard", json!(self.dashboard));

            storage.close_resource();
        }
    }
}
