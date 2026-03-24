use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Meters(u64);

#[derive(Serialize, Deserialize)]
struct Kilometers(u64);

#[derive(Serialize, Deserialize)]
pub struct Config {
    dark_mode: bool,
    background: bool,
    demo_mode: bool,
    correction_distance: Meters,
    track_distance: Kilometers,
    jump_mode: bool,
    road_book: bool,
    dtw_enabled: bool,
}

impl Config {
    pub fn new() -> Self {
        Config {
            dark_mode: true,
            background: true,
            demo_mode: false,
            correction_distance: Meters(100),
            track_distance: Kilometers(30),
            jump_mode: false,
            road_book: false,
            dtw_enabled: true,
        }
    }

    pub fn theme_switch(&mut self) {
        self.dark_mode = !self.dark_mode
    }

    pub fn background_switch(&mut self) {
        self.background = !self.background
    }
}
