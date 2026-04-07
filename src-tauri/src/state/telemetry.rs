use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::state::Position;

#[derive(Serialize, Deserialize, Debug)]
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

#[derive(Serialize, Deserialize, Debug)]
pub struct Telemetry {
    pub events: Vec<String>,
    pub steps: Vec<Position>,
    pub speed_exceeds: HashMap<u32, Vec<Exceed>>,
}
