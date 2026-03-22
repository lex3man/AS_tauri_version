use std::collections::{BTreeMap, HashMap};

use serde::{Deserialize, Serialize};

pub type Kilometers = f32;
pub type Meters = u32;
pub type Minutes = u8;
pub type SpecAreaID = String;
pub type ActivationCode = String;
pub struct Coords {
    pub lat: f32,
    pub lon: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Flags {
    pub is_open: bool,
    pub is_ghost: bool,
    pub in_game: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Defaults {
    pub capture_radius: Meters,
    pub visible_radius: Meters,
    pub speed_limit: u8,
    pub countdown: u8,
    pub flags: Flags,
}

impl Default for Defaults {
    fn default() -> Self {
        Defaults { 
            capture_radius: 100,
            visible_radius: 800,
            speed_limit: 100,
            countdown: 0,
            flags: Flags {
                is_open: false,
                is_ghost: false,
                in_game: true
            }
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PointTypes {
    pub map: BTreeMap<String, Defaults>
}

impl PointTypes {
    pub fn add(&mut self, name: &str, def: &Defaults) {
        self.map.insert(name.to_string(), def.clone());
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Point {
    pub num: u32,
    pub name: String,
    pub lat: f32,
    pub lon: f32,
    pub odo: Meters,
    pub point_type: String,
    pub capture_radius: Meters,
    pub visible_radius: Meters,
    pub countdown: Minutes,
    pub speed_limit: u8,
    pub flags: Flags,
}

pub struct PointBuilder {
    pub num: u32,
    pub name: String,
    pub lat: f32,
    pub lon: f32,
    pub odo: Meters,
    pub point_type: String,
    pub capture_radius: Meters,
    pub visible_radius: Meters,
    pub countdown: Minutes,
    pub speed_limit: u8,
    pub flags: Flags,
}

impl PointBuilder {
    pub fn new(num: u32, caption: &str, p_type: &str) -> PointBuilder {
        let defaults = Defaults::default();
        PointBuilder {
            num: num,
            name: caption.to_string(),
            lat: 0f32,
            lon: 0f32,
            odo: 0,
            point_type: p_type.to_string(),
            capture_radius: defaults.capture_radius,
            visible_radius: defaults.visible_radius,
            countdown: defaults.countdown,
            speed_limit: defaults.speed_limit,
            flags: defaults.flags.clone()
        }
    }

    pub fn update_defaults(mut self, def: &Defaults) -> Self {
        self.capture_radius = def.capture_radius;
        self.flags = def.flags.clone();
        self.countdown = def.countdown;
        self.visible_radius = def.visible_radius;
        self.speed_limit = def.speed_limit;
        self
    }

    pub fn with_coords(mut self, coords: Coords) -> Self {
        self.lat = coords.lat;
        self.lon = coords.lon;
        self
    }

    pub fn with_odo(mut self, odo: u32) -> Self {
        self.odo = odo;
        self
    }

    pub fn with_countdown(mut self, val: Minutes) -> Self {
        self.countdown = val;
        self
    }

    pub fn set_capture_radius(mut self, value: u32) -> Self {
        self.capture_radius = value;
        self
    }
    pub fn set_visible_radius(mut self, value: u32) -> Self {
        self.visible_radius = value;
        self
    }
    pub fn set_speed_limit(mut self, value: u8) -> Self {
        self.speed_limit = value;
        self
    }
    pub fn set_is_open(mut self, status: bool) -> Self {
        self.flags.is_open = status;
        self
    }
    pub fn set_is_ghost(mut self, status: bool) -> Self {
        self.flags.is_ghost = status;
        self
    }
    pub fn set_is_ingame(mut self, status: bool) -> Self {
        self.flags.in_game = status;
        self
    }

    pub fn build(self) -> Point {
        Point { 
            num: self.num, 
            name: self.name, 
            lat: self.lat, 
            lon: self.lon, 
            odo: self.odo, 
            point_type: self.point_type, 
            capture_radius: self.capture_radius, 
            visible_radius: self.visible_radius, 
            countdown: self.countdown, 
            speed_limit: self.speed_limit, 
            flags: self.flags 
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpecArea {
    pub id: SpecAreaID,
    pub activation_code: ActivationCode,
    pub points_set: Vec<Point>,
    pub roadbook: Vec<String>,
}

impl SpecArea {
    pub fn new(id: &str, code: &str) -> Self {
        SpecArea {
            id: id.to_string(),
            activation_code: code.to_string(),
            points_set: vec![],
            roadbook: vec![]
        }
    }

    pub fn add_point(&mut self, point: &Point) {
        self.points_set.push(point.clone());
    }

    pub fn add_roadbook_slide_url(&mut self, url: &str) {
        self.roadbook.push(url.to_string());
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Race {
    pub name: String,
    pub serial: String,
    pub expire_date: String,
    pub areas: HashMap<ActivationCode, SpecArea>,
}

impl Race {
    pub fn new(name: &str, serial: &str, exp_date: &str) -> Self {
        Race {
            name: name.to_string(),
            serial: serial.to_string(),
            expire_date: exp_date.to_string(),
            areas: HashMap::new()
        }
    }

    pub fn add_area(&mut self, area: &SpecArea) {
        self.areas.insert(area.activation_code.clone(), area.clone());
    }
}