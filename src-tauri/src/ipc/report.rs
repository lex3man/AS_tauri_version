use std::sync::Mutex;

use chrono::{DateTime, Local, TimeZone, Utc};
use rust_xlsxwriter::workbook::Workbook;
use tauri::{Manager, State};

use crate::{state::AppState, utils::send_data::send_report};

#[tauri::command]
pub async fn export_telemetry_report(
    app: tauri::AppHandle,
    state: State<'_, Mutex<AppState>>,
) -> Result<String, String> {
    if let Ok(state) = state.lock() {
        let ps = app.path().document_dir().map_err(|e| e.to_string())?;
        let file_name = format!(
            "report_{}_{}_{}.xlsx",
            &state.race_number.clone().unwrap(),
            Local::now().format("%d%m%Y"),
            state.race.active_code
        );
        let output_path = ps.join(&file_name);
        if let Some(telemetry) = state.telemetry.get(&state.race.current_sa) {
            let rn = &state.race_number.clone().unwrap_or("None".to_string());
            if let Some(race) = &state.race.race {
                let mut workbook = Workbook::new();
                {
                    let sheet = workbook.add_worksheet();
                    sheet.set_name("Summary").map_err(|e| e.to_string())?;
                    sheet
                        .write(0, 0, "Race Number")
                        .map_err(|e| e.to_string())?;
                    sheet.write(0, 1, rn).map_err(|e| e.to_string())?;
                    sheet.write(1, 0, "Serial").map_err(|e| e.to_string())?;
                    sheet
                        .write(1, 1, race.serial.clone())
                        .map_err(|e| e.to_string())?;
                    sheet.write(2, 0, "Race Name").map_err(|e| e.to_string())?;
                    sheet
                        .write(2, 1, race.name.clone())
                        .map_err(|e| e.to_string())?;
                    sheet
                        .write(3, 0, "Activation Code")
                        .map_err(|e| e.to_string())?;
                    sheet
                        .write(3, 1, state.race.active_code.clone())
                        .map_err(|e| e.to_string())?;
                    sheet.write(5, 0, "Events").map_err(|e| e.to_string())?;
                    sheet
                        .write(5, 1, telemetry.events.len() as u32)
                        .map_err(|e| e.to_string())?;
                    sheet.write(6, 0, "Captures").map_err(|e| e.to_string())?;
                    sheet
                        .write(6, 1, telemetry.captures.len() as u32)
                        .map_err(|e| e.to_string())?;
                    sheet.write(7, 0, "Exceeds").map_err(|e| e.to_string())?;
                    sheet
                        .write(7, 1, telemetry.speed_exceeds.len() as u32)
                        .map_err(|e| e.to_string())?;
                }

                {
                    let sheet = workbook.add_worksheet();
                    sheet.set_name("Exceeds").map_err(|e| e.to_string())?;
                    sheet.write(0, 1, "Speed").map_err(|e| e.to_string())?;
                    sheet.write(0, 2, "Limit").map_err(|e| e.to_string())?;
                    sheet.write(0, 3, "Time").map_err(|e| e.to_string())?;
                    sheet.write(0, 4, "Km").map_err(|e| e.to_string())?;

                    for (row, (_key, exceed)) in telemetry.speed_exceeds.iter().enumerate() {
                        let r = (row + 1) as u32;
                        let datetime: DateTime<Utc> =
                            Utc.timestamp_millis_opt(exceed.time as i64).unwrap();
                        sheet.write(r, 1, exceed.speed).map_err(|e| e.to_string())?;
                        sheet.write(r, 2, exceed.limit).map_err(|e| e.to_string())?;
                        sheet
                            .write(r, 3, &datetime.to_string())
                            .map_err(|e| e.to_string())?;
                        sheet.write(r, 4, exceed.km).map_err(|e| e.to_string())?;
                    }
                }

                {
                    let sheet = workbook.add_worksheet();
                    sheet.set_name("Captures").map_err(|e| e.to_string())?;
                    sheet.write(0, 0, "Point").map_err(|e| e.to_string())?;
                    sheet.write(0, 1, "Type").map_err(|e| e.to_string())?;
                    sheet.write(0, 2, "Time").map_err(|e| e.to_string())?;
                    sheet.write(0, 3, "Speed").map_err(|e| e.to_string())?;

                    for (row, capture) in telemetry.captures.iter().enumerate() {
                        let r = (row + 1) as u32;
                        let datetime: DateTime<Utc> =
                            Utc.timestamp_millis_opt(capture.time as i64).unwrap();
                        sheet
                            .write(r, 0, format!("{:?}", capture.point))
                            .map_err(|e| e.to_string())?;
                        sheet
                            .write(r, 1, capture.point_type.as_str())
                            .map_err(|e| e.to_string())?;
                        sheet
                            .write(r, 2, &datetime.to_string())
                            .map_err(|e| e.to_string())?;
                        sheet
                            .write(r, 3, capture.speed)
                            .map_err(|e| e.to_string())?;
                    }
                }

                workbook.save(&output_path).map_err(|e| e.to_string())?;
            }
        }
        send_report(&app, state.last_report.clone()).map_err(|_| "Can't send report".to_string())?;
        return Ok(output_path.to_str().unwrap().to_string());
    }
    Err("Faild to get state".to_string())
}
