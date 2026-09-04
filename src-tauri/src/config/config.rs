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
    oncoming_detection_enabled: bool,
    auto_move: bool,
    #[serde(default)]
    keep_pointing_at_wpt: bool,
    // Auto-scroll behavior: "on" (default) waits for DSS to be taken before
    // scrolling (slide odo values are stage-relative, meaningless before
    // then); "off" scrolls from total=0 regardless.
    #[serde(default = "default_auto_move_after_dss")]
    auto_move_after_dss: bool,
}

fn default_auto_move_after_dss() -> bool {
    true
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
            oncoming_detection_enabled: true,
            auto_move: true,
            keep_pointing_at_wpt: false,
            auto_move_after_dss: true,
        }
    }

    pub fn auto_move_switch(&mut self) -> bool {
        self.auto_move = !self.auto_move;
        self.auto_move
    }

    pub fn oncoming_detection_switch(&mut self) -> bool {
        self.oncoming_detection_enabled = !self.oncoming_detection_enabled;
        self.oncoming_detection_enabled
    }
    
    pub fn theme_switch(&mut self) -> bool {
        self.dark_mode = !self.dark_mode;
        self.dark_mode
    }

    pub fn background_switch(&mut self) -> bool {
        self.background = !self.background;
        self.background
    }

    pub fn jump_mode_switch(&mut self, status: &str) -> bool {
        match status {
            "on" => self.jump_mode = true,
            "off" => self.jump_mode = false,
            _ => self.jump_mode = false,
        }
        self.jump_mode
    }

    pub fn auto_move_after_dss_switch(&mut self, status: &str) -> bool {
        match status {
            "on" => self.auto_move_after_dss = true,
            "off" => self.auto_move_after_dss = false,
            _ => self.auto_move_after_dss = false,
        }
        self.auto_move_after_dss
    }

    pub fn keep_pointing_at_wpt(&self) -> bool {
        self.keep_pointing_at_wpt
    }

    pub fn keep_pointing_at_wpt_switch(&mut self, status: &str) -> bool {
        match status {
            "on" => self.keep_pointing_at_wpt = true,
            "off" => self.keep_pointing_at_wpt = false,
            _ => self.keep_pointing_at_wpt = false,
        }
        self.keep_pointing_at_wpt
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
