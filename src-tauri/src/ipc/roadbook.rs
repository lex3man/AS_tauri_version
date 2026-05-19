use std::sync::Mutex;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use tauri_plugin_android_fs::{AndroidFsExt, PrivateDir};

use crate::state::AppState;

#[tauri::command]
pub fn get_roadbook(state: tauri::State<'_, Mutex<AppState>>) -> Result<String, String> {
    #[derive(serde::Serialize)]
    struct Slide {
        subdir: String,
        name: String,
    }

    if let Ok(state) = state.lock() {
        let active_code = state.race.active_code.clone();
        if let Some(race) = &state.race.race {
            if let Some(area) = race.areas.get(&active_code) {
                let mut slides = vec![];
                for slide in &area.roadbook {
                    let mut url_path: Vec<&str> = slide.url.split('/').collect();
                    let name = url_path.pop().unwrap();
                    let subdir = url_path.pop().unwrap();
                    slides.push(Slide {
                        subdir: subdir.to_string(),
                        name: name.to_string(),
                    })
                }
                return Ok(serde_json::to_string(&slides).unwrap());
            }
        }
    }
    Err("[]".to_string())
}

#[tauri::command]
pub async fn get_roadbook_image<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    subdir: String,
    name: String,
) -> Result<ImageData, String> {
    let ps = app.android_fs_async().private_storage();
    let cache_dir = ps
        .resolve_path(PrivateDir::Cache)
        .await
        .map_err(|e| e.to_string())?;
    let file_path = cache_dir.join("roadbooks").join(subdir).join(name);

    let bytes = std::fs::read(&file_path).map_err(|e| e.to_string())?;
    let base64_data = BASE64.encode(&bytes);

    let mime_type = match file_path.extension().and_then(|e| e.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        _ => "application/octet-stream",
    };

    Ok(ImageData {
        data: base64_data,
        mime_type: mime_type.to_string(),
    })
}

#[derive(serde::Serialize)]
pub struct ImageData {
    pub data: String,
    pub mime_type: String,
}
