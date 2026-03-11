use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;
use crate::AppState;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Coords {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f64,
    pub altitude_accuracy: Option<f32>,
    pub altitude: Option<f32>,
    pub speed: Option<f32>,
    pub heading: Option<f32>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Position {
    timestamp: u64,
    coords: Coords,
}

#[tauri::command]
pub fn location_update(state: State<'_, Mutex<AppState>>, data: &str) {
    let gps_data: Position = serde_json::from_str(data).unwrap();
    println!("{:?}", gps_data);

    if let Ok(mut state) = state.lock() {
        state.coords = Some(gps_data.coords.clone());
        if let Some(store) = &state.storage {
            store.set("position", json!(gps_data.coords));
        }
    }
}

#[tauri::command]
pub fn get_coords(state: State<'_, Mutex<AppState>>) -> Option<String> {
    if let Ok(state) = state.lock() {
        if let Some(coords) = state.coords {
            return Some(json!(coords).to_string())
        }
    }
    None
}