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
    // "Keep pointing at WPT" mode: once Some, the just-captured point is held
    // as the navigation target (instead of advancing to the real next point)
    // until the device exits its capture radius. held_min_dtw tracks the
    // closest distance reached so far while held, to detect approach vs
    // retreat for the arrow color.
    #[serde(default)]
    pub held_point: Option<PointID>,
    #[serde(default)]
    pub held_min_dtw: Option<f64>,
}

impl SpecEreaState {
    pub fn new() -> Self {
        SpecEreaState {
            points: BTreeMap::new(),
            point_controller: PointLinkedList::new(),
            next_point: String::from(""),
            prev_point: String::from(""),
            held_point: None,
            held_min_dtw: None,
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

    /// Activates `code` as the current day/area. Returns `true` if this
    /// rebuilt `spec_area_state` from scratch (a genuinely new activation —
    /// different code, or the area's point list changed or was reordered),
    /// or `false` if it preserved already-tracked progress (re-entering the
    /// same code with an identical, identically-ordered point list). Config
    /// gets re-fetched on every day-code entry — including harmless
    /// re-entries of an already-active code — so without this distinction,
    /// simply re-entering your current code would wipe checked points and
    /// position back to the start.
    pub fn activate(&mut self, code: &str) -> bool {
        let already_active_unchanged = self
            .race
            .as_ref()
            .and_then(|race| race.areas.get(code))
            .map(|area| {
                self.active_code == code
                    && self.spec_area_state.point_controller._to_vec()
                        == area.points_set.iter().map(|p| p.get_id()).collect::<Vec<_>>()
            })
            .unwrap_or(false);

        self.active_code = code.to_string();
        if already_active_unchanged {
            return false;
        }

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
        true
    }

    pub fn update(&mut self, race: &Race) {
        self.race = Some(race.clone());
        self.expired = race.expire_date.clone();
    }
}
