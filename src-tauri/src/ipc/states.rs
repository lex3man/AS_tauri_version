use std::sync::Mutex;

use chrono::{Local};
use serde_json::json;
use tauri::{AppHandle, State};

use crate::{
    race::types::{CheckPoint, PointBuilder},
    state::race_config::RaceState,
    utils::{parser::FormatedData, rb_store::download_images},
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
pub async fn update_config(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    data: &str,
) -> Result<String, ()> {
    let cfg = crate::utils::parser::upload_config(FormatedData::Json(data.to_string()));
    if let Some(cfg) = cfg {
        let areas = {
            let mut state = state.lock().unwrap();
            state.race = RaceState::new();
            state.race.update(&cfg);
            state.config_updated = Local::now().format("%d.%m.%Y %H:%M:%S").to_string();
            state.race.race.as_ref().unwrap().areas.clone()
        };
        for area in areas {
            let _ = download_images(app.clone(), &area.1.roadbook).await;
        }
        return Ok("Race config updated".to_string());
    }
    Err(())
}

#[tauri::command]
pub fn get_current_cp_list(state: State<'_, Mutex<AppState>>) -> String {
    let mut point_list = Vec::new();
    let state = state.lock().unwrap();
    if let Some(race) = &state.race.race {
        if &state.race.active_code == "" {
            return "[]".to_string();
        }
        for p in &race.areas.get(&state.race.active_code).unwrap().points_set {
            let point_state = state.race.spec_area_state.points.get(&p.get_id());
            let is_next = &p.get_id() == &state.race.spec_area_state.next_point;
            point_list.push(CheckPoint {
                num: p.num,
                name: p.name.clone(),
                ptype: p.point_type.clone(),
                checked: point_state.is_some() && point_state.unwrap().checked,
                next: is_next,
            });
        }
    };
    serde_json::to_string(&point_list).unwrap()
}

#[tauri::command]
pub fn get_points_list(state: State<'_, Mutex<AppState>>) -> String {
    let mut point_list = Vec::new();
    let state = state.lock().unwrap();
    if let Some(race) = &state.race.race {
        if &state.race.active_code == "" {
            return "[]".to_string();
        }
        for p in &race.areas.get(&state.race.active_code).unwrap().points_set {
            point_list.push(p.clone()); 
        }
    };
    serde_json::to_string(&point_list).unwrap()
}

#[tauri::command]
pub fn get_race_info(state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state = state.lock().unwrap();
    if let Some(race) = &state.race.race {
        return Ok(format!(
            "{}={}={}={}={}",
            &race.name,
            &race.serial,
            &state.race_number.clone().unwrap_or_default(),
            &state.race.active_code,
            &state.config_updated.clone()
        ));
    }
    Err("Race not found".to_string())
}

#[tauri::command]
pub fn sync_data(state: State<'_, Mutex<AppState>>) -> Result<String, ()> {
    if let Ok(state) = state.lock() {
        if state.race.race.is_none() || state.race.active_code == "" {
            return Err(());
        }
        let mut next_point_type = "none".to_string();
        if let Some(race) = &state.race.race {
            if let Some(area) = race.areas.get(&state.race.active_code) {
                let next_point = area
                    .get_point_by_id(&state.race.spec_area_state.next_point)
                    .unwrap_or(&PointBuilder::new(0, "none", "none").build())
                    .clone();
                next_point_type = next_point.point_type.clone();
            }
        }
        let response = json!({
            "cog": state.dashboard.cog,
            "sog": state.dashboard.sog,
            "ctw": state.dashboard.ctw,
            "dtw": state.dashboard.dtw,
            "max_speed": state.dashboard.max_speed,
            "capture": state.current.capture,
            "activation_code": state.race.active_code,
            "metrics": {
                "abs_total": state.dashboard.metrics.abs_total,
                "total": state.dashboard.metrics.total,
                "partial": state.dashboard.metrics.partial,
                "countdown": state.dashboard.metrics.countdown,
                "cp_counter": state.dashboard.metrics.cp_counter
            },
            "next_point": state.race.spec_area_state.next_point.clone(),
            "next_point_type": next_point_type,
            "visiable": state.dashboard.widget_shown.arrow,
            "jump_suggestion": state.jump_suggestion.suggested,
            "jump_point": state.jump_suggestion.point.clone(),
            "oncoming": state.current.oncoming,
        });
        Ok(response.to_string())
    } else {
        Err(())
    }
}

#[tauri::command]
pub fn point_switch(state: State<'_, Mutex<AppState>>, move_to: &str) -> Result<(), ()> {
    if let Ok(mut state) = state.lock() {
        match move_to {
            "prev" => {
                if state.race.spec_area_state.point_controller.has_prev() {
                    state.race.spec_area_state.point_controller.move_prev();
                }
            }
            "next" => {
                if state.race.spec_area_state.point_controller.has_next() {
                    state.race.spec_area_state.point_controller.move_next();
                }
            }
            _ => {}
        }
        let next_point_id = state
            .race
            .spec_area_state
            .point_controller
            .get_active()
            .unwrap()
            .clone();
        if state.race.spec_area_state.point_controller.has_prev() {
            let prev_point_id = state
                .race
                .spec_area_state
                .point_controller
                .peek_prev()
                .unwrap()
                .clone();

            state.race.spec_area_state.prev_point = prev_point_id;
        }
        state.race.spec_area_state.next_point = next_point_id;
        return Ok(());
    }
    Err(())
}
