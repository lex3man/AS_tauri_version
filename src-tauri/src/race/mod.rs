pub mod types;

#[cfg(test)]
mod tests {
    use std::{
        collections::{BTreeMap, HashMap},
        fs::{self, File},
        io::Write,
        path::Path,
    };

    use serde_json::json;

    use crate::race::types::{
        Coords, Defaults, Flags, PointBuilder, PointTypes, RaceBuilder, SpecArea,
    };

    #[test]
    fn test_structs() {
        let mut point_types = PointTypes {
            map: BTreeMap::new(),
        };

        point_types.add(
            "WPV",
            &Defaults {
                capture_radius: 200,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: true,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "WPM",
            &Defaults {
                capture_radius: 200,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "WPS",
            &Defaults {
                capture_radius: 50,
                visible_radius: 1000,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "WPE",
            &Defaults {
                capture_radius: 200,
                visible_radius: 5000,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "DSS",
            &Defaults {
                capture_radius: 100,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: true,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "FZ",
            &Defaults {
                capture_radius: 100,
                visible_radius: 800,
                speed_limit: 0,
                countdown: 0,
                flags: Flags {
                    is_open: true,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "DZ",
            &Defaults {
                capture_radius: 200,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "NZ",
            &Defaults {
                capture_radius: 200,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 15,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "WPC",
            &Defaults {
                capture_radius: 200,
                visible_radius: 800,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: true,
                    is_ghost: true,
                    in_game: true,
                },
            },
        );
        point_types.add(
            "ASS",
            &Defaults {
                capture_radius: 200,
                visible_radius: 1000,
                speed_limit: 170,
                countdown: 0,
                flags: Flags {
                    is_open: false,
                    is_ghost: false,
                    in_game: true,
                },
            },
        );

        println!("{}", json!(point_types));

        let mut race = RaceBuilder {
            name: "Example".to_string(),
            serial: "AA 01012026".to_string(),
            expire_date: "31.12.2026".to_string(),
            areas: HashMap::new(),
        };

        race = race.add_area(&SpecArea {
            id: "example-1".to_string(),
            activation_code: "111111".to_string(),
            points_set: vec![
                PointBuilder::new(1, "Bivuac 1", "WPV")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPV").unwrap())
                    .build(),
                PointBuilder::new(2, "Start", "DSS")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DSS").unwrap())
                    .build(),
                PointBuilder::new(3, "TSC 1", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(1000)
                    .build(),
                PointBuilder::new(4, "TSC 2", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(1500)
                    .build(),
                PointBuilder::new(5, "TSC 3", "DZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DZ").unwrap())
                    .with_odo(2000)
                    .build(),
                PointBuilder::new(6, "TSC 4", "FZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("FZ").unwrap())
                    .with_odo(2500)
                    .set_speed_limit(50)
                    .build(),
                PointBuilder::new(7, "TSC 5", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(3000)
                    .build(),
                PointBuilder::new(8, "TSC 6", "NZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("NZ").unwrap())
                    .with_odo(3500)
                    .with_countdown(10)
                    .build(),
                PointBuilder::new(9, "TSC 7", "DZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DZ").unwrap())
                    .with_odo(4000)
                    .build(),
                PointBuilder::new(10, "TSC 8", "FZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("FZ").unwrap())
                    .with_odo(4500)
                    .set_speed_limit(60)
                    .build(),
                PointBuilder::new(11, "Finish", "ASS")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("ASS").unwrap())
                    .with_odo(5000)
                    .build(),
                PointBuilder::new(12, "Bivuac 2", "WPV")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPV").unwrap())
                    .with_odo(5500)
                    .build(),
            ],
            roadbook: vec![
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb001.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb002.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb003.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb004.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb005.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb006.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb007.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb008.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb009.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb010.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb011.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb012.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb013.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb014.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb015.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb016.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb017.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/18/rb018.png".to_string(),
            ],
        });

        race = race.add_area(&SpecArea {
            id: "example-2".to_string(),
            activation_code: "222222".to_string(),
            points_set: vec![
                PointBuilder::new(1, "Bivuac 1", "WPV")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPV").unwrap())
                    .build(),
                PointBuilder::new(2, "Start", "DSS")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DSS").unwrap())
                    .build(),
                PointBuilder::new(3, "TSC 1", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(1000)
                    .build(),
                PointBuilder::new(4, "TSC 2", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(1700)
                    .build(),
                PointBuilder::new(5, "TSC 3", "DZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DZ").unwrap())
                    .with_odo(2500)
                    .build(),
                PointBuilder::new(6, "TSC 4", "FZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("FZ").unwrap())
                    .with_odo(3200)
                    .set_speed_limit(50)
                    .build(),
                PointBuilder::new(7, "TSC 5", "WPM")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPM").unwrap())
                    .with_odo(4000)
                    .build(),
                PointBuilder::new(8, "TSC 6", "NZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("NZ").unwrap())
                    .with_odo(5000)
                    .with_countdown(10)
                    .build(),
                PointBuilder::new(9, "TSC 7", "DZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("DZ").unwrap())
                    .with_odo(5500)
                    .build(),
                PointBuilder::new(10, "TSC 8", "FZ")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("FZ").unwrap())
                    .with_odo(6200)
                    .set_speed_limit(60)
                    .build(),
                PointBuilder::new(11, "Finish", "ASS")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("ASS").unwrap())
                    .with_odo(6900)
                    .build(),
                PointBuilder::new(12, "Bivuac 2", "WPV")
                    .with_coords(Coords {
                        lat: 45.544534,
                        lon: 52.235225,
                    })
                    .update_defaults(point_types.map.get("WPV").unwrap())
                    .with_odo(7200)
                    .build(),
            ],
            roadbook: vec![
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb002.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb003.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb001.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb005.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb006.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb004.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb007.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb008.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb009.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb010.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb011.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb012.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb013.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb014.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb015.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb016.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb017.png".to_string(),
                "https://map.rostexcabinet.ru/upload/roadbooks/19/rb018.png".to_string(),
            ],
        });

        let race = race.build();

        println!("{}", json!(race));

        if Path::new("output").exists() {
            fs::remove_dir_all("output").unwrap();
        }
        fs::create_dir("output").unwrap();
        let mut file = File::create(Path::new("output").join("full_race.json")).unwrap();
        file.write_all(format!("{}", json!(race)).as_bytes())
            .unwrap();
        let mut file = File::create(Path::new("output").join("point_types.json")).unwrap();
        file.write_all(format!("{}", json!(point_types)).as_bytes())
            .unwrap();
    }
}
