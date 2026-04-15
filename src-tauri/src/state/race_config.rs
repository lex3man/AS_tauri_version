use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::{
    race::types::{Race, SpecAreaID},
    state::points_evolution::PointLinkedList,
};

pub type PointID = String;

#[derive(Serialize, Deserialize)]
pub struct PointState {
    pub checked: bool,
    pub jumpable: bool,
}

impl PointState {
    pub fn new() -> Self {
        PointState {
            checked: false,
            jumpable: true,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct SpecEreaState {
    pub points: BTreeMap<PointID, PointState>,
    pub point_controller: PointLinkedList,
    pub next_point: PointID,
    pub prev_point: PointID,
}

impl SpecEreaState {
    pub fn new() -> Self {
        SpecEreaState {
            points: BTreeMap::new(),
            point_controller: PointLinkedList::new(),
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
            let mut ses = SpecEreaState::new();
            if let Some(area) = race.areas.get(code) {
                self.current_sa = area.id.clone();
                let mut list = vec![];
                for point in &area.points_set {
                    ses.points.insert(point.get_id(), PointState::new());
                    list.push(point.get_id());
                }
                ses.point_controller = PointLinkedList::from_point_ids(list);
                ses.point_controller.move_to_first();
                ses.next_point = area.points_set.first().unwrap().get_id();
                self.spec_area_state = ses;
            }
        }
    }

    pub fn update(&mut self, race: &Race) {
        self.race = Some(race.clone());
        self.expired = race.expire_date.clone();
    }
}
