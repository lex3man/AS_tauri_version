use std::sync::Mutex;

use serde_json::json;
use tauri::State;

use crate::{
    race::types::{CheckPoint, Race},
    state::race_config::RaceState,
    AppState,
};

#[tauri::command]
pub async fn snapshot(state: State<'_, Mutex<AppState>>, snapshot: &str) -> Result<(), ()> {
    if let Ok(mut s) = state.lock() {
        if let Some(storage) = &s.storage {
            storage.set("snapshot", json!(snapshot));
            storage.close_resource();
        }
        s.snapshot = Some(snapshot.to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn get_snapshot(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    if let Ok(state) = state.lock() {
        if let Some(storage) = &state.storage {
            if let Some(value) = storage.get("snapshot") {
                storage.close_resource();
                return Ok(value.to_string());
            };
            storage.close_resource();
        }
    }
    Err(())
}

#[tauri::command]
pub fn update_config(state: State<'_, Mutex<AppState>>, data: &str) -> Result<String, ()> {
    if let Ok(config) = serde_json::from_str::<Race>(data) {
        let mut state = state.lock().unwrap();
        state.race = RaceState::new();
        state.race.update(&config);
        return Ok("Race config updated".to_string());
    }
    Err(())
}

#[tauri::command]
pub fn get_current_cp_list(state: State<'_, Mutex<AppState>>) -> String {
    let mut point_list = Vec::new();
    let state = state.lock().unwrap();
    if let Some(race) = &state.race.race {
        for p in &race.areas.get(&state.race.active_code).unwrap().points_set {
            point_list.push(CheckPoint {
                num: p.num,
                name: p.name.clone(),
                ptype: p.point_type.clone(),
                checked: false,
            });
        }
    };
    serde_json::to_string(&point_list).unwrap()
}
