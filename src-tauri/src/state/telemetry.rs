use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::state::Position;

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct Exceed {
    pub speed: u32,
    pub limit: u8,
    pub time: u64,
}

impl Exceed {
    pub fn new(speed: u32, limit: u8, time: u64) -> Self {
        Self { speed, limit, time }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PointCapture {
    pub point: String,
    pub time: u64,
    pub speed: f32,
    pub accuracy: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Telemetry {
    pub events: Vec<String>,
    pub steps: Vec<Position>,
    pub speed_exceeds: HashMap<u32, Exceed>,
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
