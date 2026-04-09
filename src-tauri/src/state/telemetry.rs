use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::state::Position;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Exceed {
    pub speed: f32,
    pub limit: u32,
    pub time: u64,
}

impl Exceed {
    pub fn new(speed: f32, limit: u32, time: u64) -> Self {
        Self { speed, limit, time }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Telemetry {
    pub events: Vec<String>,
    pub steps: Vec<Position>,
    pub speed_exceeds: HashMap<u32, Vec<Exceed>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SecondlyShot {
    pub race_number: String,
    pub device_id: String,
    pub etape: String,
    pub exceeding: bool,
    pub speed: f32,
    pub lat: String,
    pub lon: String,
    pub accuracy: String,
    pub point_name: String,
    pub checked: bool,
    pub time: u64,
}
