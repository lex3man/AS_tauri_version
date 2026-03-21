use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

use crate::race::types::{Race, SpecAreaID};

pub type PointID = String;

#[derive(Serialize, Deserialize)]
pub struct PointState {
    pub checked: bool,
    pub jumpable: bool,
    pub active: bool,
}

#[derive(Serialize, Deserialize)]
pub struct SpecEreaState {
    pub points: BTreeMap<PointID, PointState>,
    pub next_point: PointID,
    pub prev_point: PointID,
    
}

impl SpecEreaState {
    pub fn new() -> Self {
        SpecEreaState {
            points: BTreeMap::new(),
            next_point: String::from(""),
            prev_point: String::from("")
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct RaceState {
    pub race: Option<Race>,
    pub current_sa: SpecAreaID,
    pub active_code: String,
    pub expired: String,
}

impl RaceState {
    pub fn new() -> Self {
        RaceState {
            race: None,
            current_sa: "".to_string(),
            active_code: "".to_string(),
            expired: "".to_string()
        }
    }
}