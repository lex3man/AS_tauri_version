use crate::{
    race::types::Coords,
    state::Position,
    utils::{actor::make_culc, converters::distance},
    AppState,
};
use serde_json::json;
use std::sync::Mutex;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn location_update(app: AppHandle, state: State<'_, Mutex<AppState>>, data: &str) {
    let gps_data: Position = serde_json::from_str(data).unwrap();

    if let Ok(mut state) = state.lock() {
        state.coords = Some(gps_data.coords.clone());
        if let Some(store) = &state.storage {
            store.set("position", json!(gps_data.coords));
            store.set("sa_state", json!(state.race.spec_area_state));
            store.set("race_state", json!(state.race));
            store.set("dashboard", json!(state.dashboard));
        }
        state.sync();
    }
    match make_culc(&app, &state, &gps_data) {
        Ok(_) => {}
        Err(_) => {}
    }
}

#[tauri::command]
pub fn get_coords(state: State<'_, Mutex<AppState>>) -> Option<String> {
    if let Ok(state) = state.lock() {
        if let Some(coords) = state.coords {
            return Some(json!(coords).to_string());
        }
    }
    None
}

#[tauri::command]
pub fn jump_reaction(state: State<'_, Mutex<AppState>>, flag: &str) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        let jump_to = state.jump_suggestion.point.clone();
        match flag {
            "yes" => {
                state
                    .race
                    .spec_area_state
                    .point_controller
                    .set_active(&jump_to);
                state.race.spec_area_state.prev_point =
                    state.race.spec_area_state.next_point.clone();
                state.race.spec_area_state.next_point = jump_to;
            }
            _ => {}
        }
        state.settings.jump_mode_switch("off");
        state.jump_suggestion.suggested = false;
        return Ok(());
    }
    Err(())
}

#[tauri::command]
pub fn get_location_history(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    let mut result: Vec<Coords> = vec![];
    if let Ok(state) = state.lock() {
        let dist = state.settings.get_track();
        let mut counter = 0.0;
        if let Some(tel) = state.telemetry.get(&state.race.current_sa) {
            if let Some(last_position) = tel.steps.last() {
                let mut prev_pos = last_position.coords;
                let mut full_buffer = tel.steps.clone();
                while (counter as u64) < dist {
                    if let Some(pos) = full_buffer.pop() {
                        counter += distance(
                            Coords {
                                lat: prev_pos.latitude,
                                lon: prev_pos.longitude,
                            },
                            Coords {
                                lat: pos.coords.latitude,
                                lon: pos.coords.longitude,
                            },
                        ) as f64;
                        prev_pos = pos.coords;
                        result.push(Coords {
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                        });
                    } else {
                        break;
                    }
                }
            }
        }
    }
    if let Ok(res) = serde_json::to_string(&result) {
        return Ok(res);
    } else {
        return Ok("[]".to_string());
    }
}
