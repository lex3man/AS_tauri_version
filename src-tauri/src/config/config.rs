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
    oncoming_angle: u16,
    oncoming_detection: u32,
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
            oncoming_angle: 60,
            oncoming_detection: 300,
        }
    }

    pub fn theme_switch(&mut self) {
        self.dark_mode = !self.dark_mode
    }

    pub fn background_switch(&mut self) {
        self.background = !self.background
    }

    pub fn jump_mode_switch(&mut self, status: &str) {
        match status {
            "on" => self.jump_mode = true,
            "off" => self.jump_mode = false,
            _ => self.jump_mode = false,
        }
    }

    pub fn increase_dist(&mut self) {
        self.correction_distance = Meters(self.correction_distance.0 + 10);
    }

    pub fn decrease_dist(&mut self) {
        if self.correction_distance.0 == 0 {
            return;
        }
        self.correction_distance = Meters(self.correction_distance.0 - 10);
    }

    pub fn increase_track(&mut self) {
        self.track_distance = Kilometers(self.track_distance.0 + 5);
    }

    pub fn decrease_track(&mut self) {
        if self.track_distance.0 == 0 {
            return;
        }
        self.track_distance = Kilometers(self.track_distance.0 - 5);
    }

    pub fn get_dist(&self) -> u64 {
        self.correction_distance.0
    }

    pub fn get_track(&self) -> u64 {
        self.track_distance.0
    }

    pub fn get_oncoming_angle(&self) -> u16 {
        self.oncoming_angle
    }

    pub fn increase_oncoming_angle(&mut self) {
        if self.oncoming_angle > 180 {
            return;
        }
        self.oncoming_angle += 5;
    }

    pub fn decrease_oncoming_angle(&mut self) {
        if self.oncoming_angle <= 10 {
            return;
        }
        self.oncoming_angle -= 5;
    }

    pub fn increase_oncoming_detection(&mut self) {
        self.oncoming_detection += 50;
    }

    pub fn decrease_oncoming_detection(&mut self) {
        if self.oncoming_detection < 50 {
            return;
        }
        self.oncoming_detection -= 50;
    }
}
