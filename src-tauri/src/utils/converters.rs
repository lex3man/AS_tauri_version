use crate::race::types::{Coords, Kilometers};

fn degrees_to_radians(deg: f64) -> f64 {
    deg * (std::f64::consts::PI / 180.0)
}

pub fn distance(position_1: Coords, position_2: Coords) -> Kilometers {
    let lat1 = degrees_to_radians(position_1.lat);
    let lat2 = degrees_to_radians(position_2.lat);
    let delta_lat = degrees_to_radians(position_2.lat - position_1.lat);
    let delta_lon = degrees_to_radians(position_2.lon - position_1.lon);

    let a =
        (delta_lat / 2.0).sin().powi(2) + (delta_lon / 2.0).sin().powi(2) * lat1.cos() * lat2.cos();
    let c = 2.0 * (a.sqrt().atan2((1.0 - a).sqrt()));

    Kilometers::from(6371000.0 * c)
}

pub fn course_in_degrees(point_a: Coords, point_b: Coords) -> u32 {
    let delta_lat = degrees_to_radians(point_b.lat - point_a.lat);
    let delta_lon = degrees_to_radians(point_b.lon - point_a.lon);

    let mut catet_a = distance(
        Coords {
            lat: point_b.lat,
            lon: point_b.lon,
        },
        Coords {
            lat: point_a.lat,
            lon: point_b.lon,
        },
    ) * 1000.0;
    let mut catet_b = distance(
        Coords {
            lat: point_a.lat,
            lon: point_a.lon,
        },
        Coords {
            lat: point_a.lat,
            lon: point_b.lon,
        },
    ) * 1000.0;

    if catet_a == 0.0 {
        catet_a = 1.0;
    }
    if catet_b == 0.0 {
        catet_b = 1.0;
    }

    let direction = if delta_lat >= 0.0 {
        if delta_lon > 0.0 {
            (catet_b / catet_a).atan() * (180.0 / std::f64::consts::PI)
        } else {
            (catet_a / catet_b).atan() * (180.0 / std::f64::consts::PI) + 270.0
        }
    } else {
        if delta_lon > 0.0 {
            (catet_a / catet_b).atan() * (180.0 / std::f64::consts::PI) + 90.0
        } else {
            (catet_b / catet_a).atan() * (180.0 / std::f64::consts::PI) + 180.0
        }
    };

    direction.round() as u32
}
