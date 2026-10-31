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
    pub oncoming: bool,
    // Level flag — recomputed every tick from already-checked RBP/DSS
    // points, not a one-shot capture pulse (see actor.rs).
    pub roadbook_unlocked: bool,
    // Same kind of level flag, but specifically for DSS — the roadbook's
    // slide odo values are relative to the special stage start, so
    // auto-scroll must not run before DSS is actually taken even if RBP
    // already unlocked the roadbook for viewing.
    pub dss_taken: bool,
    // One-shot pulse — true only on the tick an ASS point is captured, like
    // `capture` itself (see actor.rs). Drives the automatic report send.
    pub ass_captured: bool,
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
            oncoming: false,
            roadbook_unlocked: false,
            dss_taken: false,
            ass_captured: false,
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
    // Telemetry records waiting to be accepted by the server, oldest first.
    // Survives restarts, and is trimmed only by ack_collected() once the
    // upload has actually gone through.
    pub collected: Vec<String>,
    // Sequence number that `collected[0]` carries — equivalently, how many
    // records have ever been dropped from the front. The i-th record's
    // sequence is `collected_base + i`, which is what lets an ack name
    // exactly how far the server got. It only ever grows, so an ack left
    // over from a previous day code can never bite into a newer buffer.
    pub collected_base: u64,
    pub last_report: String,
    pub config_updated: String,
    pub report_sent_auto: String,
    pub report_sent_manual: String,
    // A generated report file that still has to reach the server. Survives
    // restarts, so a report produced with no connectivity keeps being
    // retried until it is actually delivered. Empty path = nothing queued.
    pub pending_report_path: String,
    pub pending_report_mode: String,
    pub pending_report_etape: String,
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
            collected_base: 0,
            last_report: String::from(""),
            config_updated: String::from(""),
            report_sent_auto: String::from(""),
            report_sent_manual: String::from(""),
            pending_report_path: String::from(""),
            pending_report_mode: String::from(""),
            pending_report_etape: String::from(""),
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
            storage.set("as_config_updayed_time", json!(self.config_updated));
            storage.set("as_report_sent_auto_time", json!(self.report_sent_auto));
            storage.set("as_report_sent_manual_time", json!(self.report_sent_manual));
            storage.set("as_pending_report_path", json!(self.pending_report_path));
            storage.set("as_pending_report_mode", json!(self.pending_report_mode));
            storage.set("as_pending_report_etape", json!(self.pending_report_etape));
            storage.set("as_last_report", json!(self.last_report));
            storage.set("as_collected", json!(self.collected));
            storage.set("as_collected_base", json!(self.collected_base));

            storage.close_resource();
        }
    }

    /// The pending batch in the shape the frontend uploads: the records plus
    /// the sequence number of the last one, which is what it acks back.
    /// `None` when there is nothing waiting.
    pub fn collected_batch(&self) -> Option<String> {
        if self.collected.is_empty() {
            return None;
        }
        Some(
            json!({
                "last_seq": self.collected_base + self.collected.len() as u64 - 1,
                "records": self.collected,
            })
            .to_string(),
        )
    }

    /// Drop every collected record up to and including `last_seq`, returning
    /// how many were actually removed.
    ///
    /// The buffer keeps growing while an upload is in flight, so an ack names
    /// a sequence number rather than a count. Trimming by count would be
    /// wrong the moment two batches overlap: a slow first upload acking after
    /// a larger second one would eat records gathered in between. Comparing
    /// against the base instead makes any ack that has already been
    /// superseded a no-op.
    pub fn ack_collected(&mut self, last_seq: u64) -> usize {
        if last_seq < self.collected_base {
            return 0;
        }
        let acked = (last_seq - self.collected_base + 1) as usize;
        let drop = acked.min(self.collected.len());
        self.collected.drain(..drop);
        self.collected_base += drop as u64;
        drop
    }

    /// Abandon every pending collected record without sending it. The
    /// sequence counter moves past them instead of restarting, so an upload
    /// still in flight for the records just dropped acks a range that is now
    /// behind the base and is ignored, rather than trimming whatever the new
    /// day code has started gathering.
    pub fn drop_collected(&mut self) {
        self.collected_base += self.collected.len() as u64;
        self.collected.clear();
    }

    pub fn reset(&mut self) {
        if let Some(storage) = &self.storage {
            storage.clear();
        }
        self.race = RaceState::new();
        self.dashboard = DashBoard::new();
        self.race_number = None;
        self.is_admin = false;
        self.settings = Config::new();
        self.coords = None;
        self.telemetry = HashMap::new();
        self.current = Flags::new();
        self.jump_suggestion = JumpSuggestion {
            suggested: false,
            point: "None".to_string(),
        };
        self.gps_timestamp = 0;
        self.snapshot = None;
        self.drop_collected();
        self.last_report = String::from("");
        self.config_updated = String::from("");
        self.report_sent_auto = String::from("");
        self.report_sent_manual = String::from("");
        self.pending_report_path = String::from("");
        self.pending_report_mode = String::from("");
        self.pending_report_etape = String::from("");
        self.sync();
    }
}
