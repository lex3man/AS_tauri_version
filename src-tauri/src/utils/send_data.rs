use serde_json::json;
use tauri::{AppHandle, Emitter};

pub fn send_report(app: &AppHandle, data: String) -> Result<(), ()> {
    match app.emit("send_report", data) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    };
}

pub fn send_telemetry(app: &AppHandle, data: String) -> Result<(), ()> {
    match app.emit("send_telemetry", data) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    };
}

pub fn send_collected(app: &AppHandle, data: Vec<String>) -> Result<(), ()> {
    match app.emit("send_collected", json!(data).to_string()) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    }
}
