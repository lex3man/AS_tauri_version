pub mod dashboard;
pub mod points_evolution;
pub mod race_config;
pub mod telemetry;

use std::{collections::HashMap, sync::Arc};

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::Wry;
use tauri_plugin_store::Store;

use crate::{
    config::Config,
    race::types::SpecAreaID,
    state::{dashboard::DashBoard, race_config::RaceState, telemetry::Telemetry},
};

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct GPSData {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f64,
    pub altitude_accuracy: Option<f32>,
    pub altitude: Option<f32>,
    pub speed: Option<f32>,
    pub heading: Option<f32>,
}

impl Default for GPSData {
    fn default() -> Self {
        GPSData {
            latitude: 0.0,
            longitude: 0.0,
            accuracy: 0.0,
            altitude_accuracy: None,
            altitude: None,
            speed: None,
            heading: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Position {
    pub timestamp: u64,
    pub coords: GPSData,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JumpSuggestion {
    pub suggested: bool,
    pub point: String,
}

pub struct Flags {
    pub speed_exceeded: bool,
    pub capture: bool,
    pub finished: bool,
    pub _gps_signal_lost: bool,
    pub _low_battery: bool,
    pub _internert_disconnected: bool,
}

impl Flags {
    pub fn new() -> Self {
        Flags {
            speed_exceeded: false,
            capture: false,
            finished: false,
            _gps_signal_lost: false,
            _low_battery: false,
            _internert_disconnected: false,
        }
    }
}

pub struct AppState {
    pub storage: Option<Arc<Store<Wry>>>,
    pub race_number: Option<String>,
    pub is_admin: bool,
    pub settings: Config,
    pub coords: Option<GPSData>,
    pub snapshot: Option<String>,
    pub race: RaceState,
    pub dashboard: DashBoard,
    pub telemetry: HashMap<SpecAreaID, Telemetry>,
    pub current: Flags,
    pub jump_suggestion: JumpSuggestion,
    pub gps_timestamp: u64,
    pub collected: Vec<String>,
    pub last_report: String,
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
            race: RaceState::new(),
            dashboard: DashBoard::new(),
            telemetry: HashMap::new(),
            current: Flags::new(),
            jump_suggestion: JumpSuggestion {
                suggested: false,
                point: "None".to_string(),
            },
            gps_timestamp: 0,
            collected: vec![],
            last_report: String::from(""),
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
            storage.set("as_spec_area", json!(self.race.spec_area_state));
            storage.set("as_race", json!(self.race));
            storage.set("as_dashboard", json!(self.dashboard));
            storage.set("as_telemetry", json!(self.telemetry));

            storage.close_resource();
        }
    }
}
