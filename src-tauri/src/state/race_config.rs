use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::race::types::{Race, SpecAreaID};

pub type PointID = String;

#[derive(Serialize, Deserialize)]
pub struct PointState {
    pub checked: bool,
    pub jumpable: bool,
    pub active: bool,
}

impl PointState {
    pub fn new() -> Self {
        PointState {
            checked: false,
            jumpable: true,
            active: false,
        }
    }
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
            prev_point: String::from(""),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct RaceState {
    pub race: Option<Race>,
    pub current_sa: SpecAreaID,
    pub spec_area_state: SpecEreaState,
    pub active_code: String,
    pub expired: String,
}

impl RaceState {
    pub fn new() -> Self {
        RaceState {
            race: None,
            current_sa: "".to_string(),
            spec_area_state: SpecEreaState::new(),
            active_code: "".to_string(),
            expired: "".to_string(),
        }
    }

    pub fn activate(&mut self, code: &str) {
        self.active_code = code.to_string();
        if let Some(race) = &self.race {
            if let Some(area) = race.areas.get(code) {
                self.current_sa = area.id.clone();
            }
            let mut ses = SpecEreaState::new();
            if let Some(area) = race.areas.get(&self.current_sa) {
                for point in &area.points_set {
                    ses.points.insert(point.get_id(), PointState::new());
                }
                ses.next_point = area.points_set[0].name.clone();
                self.spec_area_state = ses;
            }
        }
    }

    pub fn update(&mut self, race: &Race) {
        self.race = Some(race.clone());
        self.expired = race.expire_date.clone();
    }
}
