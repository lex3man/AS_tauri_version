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
    // Arrow tint for "Keep pointing at WPT" mode: "black" (default/approaching),
    // "green" (held, still approaching the captured point) or "orange" (held,
    // moving away from it again). Meaningless while the mode is off — the
    // arrow just stays "black", matching its unmodified pre-feature look.
    #[serde(default = "default_arrow_color")]
    pub arrow_color: String,
}

fn default_arrow_color() -> String {
    String::from("black")
}

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
    pub arrow: bool,
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
                arrow: false,
            },
            arrow_color: String::from("black"),
        }
    }
}
