use crate::race::types::Race;

pub enum FormatedData {
    Json(String),
    Toml(String),
    Xml(String),
}

pub fn upload_config(data: FormatedData) -> Option<Race> {
    match data {
        FormatedData::Toml(content) => {
            for line in content.lines() {
                println!("{}", line);
            }
        }
        FormatedData::Json(content) => {
            if let Ok(race) = serde_json::from_str::<Race>(&content) {
                return Some(race);
            };
        }
        FormatedData::Xml(content) => {
            for line in content.lines() {
                println!("{}", line);
            }
        }
    }
    None
}
