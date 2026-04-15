use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::state::{Position, race_config::PointID};

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Exceed {
    pub speed: u32,
    pub limit: u8,
    pub time: u64,
    pub km: u32,
}

impl Exceed {
    pub fn new(speed: u32, limit: u8, time: u64, km: u32) -> Self {
        Self { speed, limit, time, km }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PointCapture {
    pub point: PointID,
    pub point_type: String,
    pub time: u64,
    pub speed: f32,
    pub accuracy: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Telemetry {
    pub events: Vec<String>,
    pub steps: Vec<Position>,
    pub speed_exceeds: HashMap<String, Exceed>,
    pub captures: Vec<PointCapture>,
}

impl Telemetry {
    pub fn new() -> Self {
        Telemetry {
            events: Vec::new(),
            steps: Vec::new(),
            speed_exceeds: HashMap::new(),
            captures: Vec::new(),
        }
    }
}
