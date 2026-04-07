use serde::{Deserialize, Serialize};

use crate::race::types::Coords;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DashBoard {
    pub cog: u32,
    pub sog: u32,
    pub ctw: u32,
    pub dtw: f32,

    pub max_speed: u32,
    pub coords: Coords,
    pub metrics: Metrics,

    pub widget_shown: Widgets,
}

// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct Coords {
//     pub lat: f32,
//     pub lon: f32,
// }

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Metrics {
    pub abs_total: f64,
    pub total: f64,
    pub partial: f64,
    pub countdown: u32,
    pub cp_counter: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Widgets {
    pub total: bool,
    pub partial: bool,
    pub countdown: bool,
}

impl DashBoard {
    pub fn new() -> DashBoard {
        DashBoard {
            cog: 15,
            sog: 15,
            ctw: 25,
            dtw: 321.22,
            max_speed: 120,
            coords: Coords {
                lat: 0f64,
                lon: 0f64,
            },
            metrics: Metrics {
                abs_total: 0f64,
                total: 0f64,
                partial: 0f64,
                countdown: 0,
                cp_counter: 0,
            },
            widget_shown: Widgets {
                total: false,
                partial: false,
                countdown: false,
            },
        }
    }
}
