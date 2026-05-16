use std::collections::{BTreeMap, HashMap};

use serde::{Deserialize, Serialize};

pub type Kilometers = f64;
pub type Meters = u32;
pub type Minutes = u8;
pub type SpecAreaID = String;
pub type ActivationCode = String;
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Coords {
    pub lat: f64,
    pub lon: f64,
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
                in_game: true,
            },
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct _PointTypes {
    pub map: BTreeMap<String, Defaults>,
}

impl _PointTypes {
    pub fn _add(&mut self, name: &str, def: &Defaults) {
        self.map.insert(name.to_string(), def.clone());
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Point {
    pub num: u32,
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub odo: Meters,
    pub point_type: String,
    pub capture_radius: Meters,
    pub visible_radius: Meters,
    pub countdown: Minutes,
    pub speed_limit: u8,
    pub flags: Flags,
}

impl Point {
    pub fn get_id(&self) -> String {
        format!("{}-{}", self.num, self.name)
    }
}

pub struct PointBuilder {
    pub num: u32,
    pub name: String,
    pub lat: f64,
    pub lon: f64,
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
            lat: 0f64,
            lon: 0f64,
            odo: 0,
            point_type: p_type.to_string(),
            capture_radius: defaults.capture_radius,
            visible_radius: defaults.visible_radius,
            countdown: defaults.countdown,
            speed_limit: defaults.speed_limit,
            flags: defaults.flags.clone(),
        }
    }

    pub fn _update_defaults(mut self, def: &Defaults) -> Self {
        self.capture_radius = def.capture_radius;
        self.flags = def.flags.clone();
        self.countdown = def.countdown;
        self.visible_radius = def.visible_radius;
        self.speed_limit = def.speed_limit;
        self
    }

    pub fn _with_coords(mut self, coords: Coords) -> Self {
        self.lat = coords.lat;
        self.lon = coords.lon;
        self
    }

    pub fn _with_odo(mut self, odo: u32) -> Self {
        self.odo = odo;
        self
    }

    pub fn _with_countdown(mut self, val: Minutes) -> Self {
        self.countdown = val;
        self
    }

    pub fn _set_capture_radius(mut self, value: u32) -> Self {
        self.capture_radius = value;
        self
    }
    pub fn _set_visible_radius(mut self, value: u32) -> Self {
        self.visible_radius = value;
        self
    }
    pub fn _set_speed_limit(mut self, value: u8) -> Self {
        self.speed_limit = value;
        self
    }
    pub fn _set_is_open(mut self, status: bool) -> Self {
        self.flags.is_open = status;
        self
    }
    pub fn _set_is_ghost(mut self, status: bool) -> Self {
        self.flags.is_ghost = status;
        self
    }
    pub fn _set_is_ingame(mut self, status: bool) -> Self {
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
            flags: self.flags,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RBSlide {
    pub url: String,
    pub odo: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpecArea {
    pub id: SpecAreaID,
    pub activation_code: ActivationCode,
    pub points_set: Vec<Point>,
    pub roadbook: Vec<RBSlide>,
}

impl SpecArea {
    pub fn get_point_by_id(&self, id: &str) -> Option<&Point> {
        self.points_set.iter().find(|p| p.get_id() == id)
    }
}

pub struct _SpecAreaBuilder {
    pub id: SpecAreaID,
    pub activation_code: ActivationCode,
    pub points_set: Vec<Point>,
    pub roadbook: Vec<RBSlide>,
}

impl _SpecAreaBuilder {
    pub fn _new(id: &str, code: &str) -> _SpecAreaBuilder {
        _SpecAreaBuilder {
            id: id.to_string(),
            activation_code: code.to_string(),
            points_set: vec![],
            roadbook: vec![],
        }
    }

    pub fn _add_point(mut self, point: &Point) -> Self {
        self.points_set.push(point.clone());
        self
    }

    pub fn _add_roadbook_slide_url(mut self, url: &str) -> Self {
        let slide = RBSlide {
            url: String::from(url),
            odo: 0,
        };
        self.roadbook.push(slide);
        self
    }

    pub fn _build(self) -> SpecArea {
        SpecArea {
            id: self.id,
            activation_code: self.activation_code,
            points_set: self.points_set,
            roadbook: self.roadbook,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Race {
    pub name: String,
    pub serial: String,
    pub expire_date: String,
    pub areas: HashMap<ActivationCode, SpecArea>,
}

pub struct _RaceBuilder {
    pub name: String,
    pub serial: String,
    pub expire_date: String,
    pub areas: HashMap<ActivationCode, SpecArea>,
}

impl _RaceBuilder {
    pub fn _new(name: &str, serial: &str, exp_date: &str) -> _RaceBuilder {
        _RaceBuilder {
            name: name.to_string(),
            serial: serial.to_string(),
            expire_date: exp_date.to_string(),
            areas: HashMap::new(),
        }
    }

    pub fn _add_area(mut self, area: &SpecArea) -> Self {
        self.areas
            .insert(area.activation_code.clone(), area.clone());
        self
    }

    pub fn _build(self) -> Race {
        Race {
            name: self.name,
            serial: self.serial,
            expire_date: self.expire_date,
            areas: self.areas,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CheckPoint {
    pub num: u32,
    pub name: String,
    pub ptype: String,
    pub checked: bool,
    pub next: bool,
}
