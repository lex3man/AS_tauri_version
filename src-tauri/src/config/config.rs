use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize)]
pub struct Config {
    dark_theme: bool,
    background: bool,
    demo: bool,
    correction_distance_m: u16,
    track_distance_km: u16,
    jump_mode: bool,
    road_book: bool,
    dtw_enabled: bool,
}

impl Config {
    pub fn new() -> Self {
        Config {
            dark_theme: true,
            background: true,
            demo: false,
            correction_distance_m: 100,
            track_distance_km: 30,
            jump_mode: false,
            road_book: false,
            dtw_enabled: true
        }
    }

    pub fn theme_switch(&mut self) {
        self.dark_theme = !self.dark_theme
    }

    pub fn background_switch(&mut self) {
        self.background = !self.background
    }
}