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

/// Hand the pending telemetry batch to the frontend, which does the actual
/// POST. Takes what `AppState::collected_batch()` produced, so `None` — an
/// empty buffer — emits nothing: there is nothing to upload and nothing to
/// ack.
pub fn send_collected(app: &AppHandle, batch: Option<String>) -> Result<(), ()> {
    let Some(payload) = batch else {
        return Ok(());
    };
    match app.emit("send_collected", payload) {
        Ok(_) => {
            return Ok(());
        }
        Err(_) => {
            return Err(());
        }
    }
}
