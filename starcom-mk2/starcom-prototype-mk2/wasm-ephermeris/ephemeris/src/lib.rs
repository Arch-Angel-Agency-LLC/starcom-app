mod bsp;
use bsp::BspData;
use std::collections::HashMap;

pub struct Ephemeris {
    bsp_data: HashMap<String, BspData>,
}

impl Ephemeris {
    pub fn new() -> Self {
        Ephemeris {
            bsp_data: HashMap::new(),
        }
    }

    pub fn set_bsp_data(&mut self, planet: String, data: BspData) {
        self.bsp_data.insert(planet, data);
    }

    pub fn get_position(&self, planet: &str, time: f64) -> (f64, f64, f64) {
        let planet_id = match planet.to_lowercase().as_str() {
            "earth" => 399,
            "mars" => 499,
            // Add more mappings as needed
            _ => return (0.0, 0.0, 0.0),
        };
        self.bsp_data
            .get(planet)
            .map_or((0.0, 0.0, 0.0), |data| data.get_position(planet_id, time))
    }
}