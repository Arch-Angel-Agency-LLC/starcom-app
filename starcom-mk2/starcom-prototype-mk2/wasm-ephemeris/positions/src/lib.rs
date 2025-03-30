use ephemeris::Ephemeris;
use serde::Serialize;

pub struct PositionDataset {
    ephemeris: Ephemeris,
}

#[derive(Clone, Serialize)]  // Add Serialize
pub struct PlanetPositions {
    pub heliocentric: Vec<(f64, f64, f64)>,
    pub geocentric: Vec<(f64, f64, f64)>,
}

impl PositionDataset {
    pub fn new(ephemeris: Ephemeris) -> Self {
        PositionDataset { ephemeris }
    }

    pub fn get_all_positions(&self, time: f64, planets: &[&str]) -> PlanetPositions {
        let heliocentric: Vec<_> = planets
            .iter()
            .map(|&p| self.ephemeris.get_position(p, time))
            .collect();
        let earth_pos = self.ephemeris.get_position("earth", time);
        let geocentric: Vec<_> = heliocentric
            .iter()
            .map(|&(x, y, z)| (x - earth_pos.0, y - earth_pos.1, z - earth_pos.2))
            .collect();
        PlanetPositions { heliocentric, geocentric }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_positions() {
        let eph = Ephemeris::new();
        let dataset = PositionDataset::new(eph);
        let planets = vec!["earth", "mars"];
        let positions = dataset.get_all_positions(0.0, &planets);
        assert_eq!(positions.heliocentric.len(), 2);
        assert_eq!(positions.geocentric.len(), 2);
        assert_eq!(positions.heliocentric[0], (0.0, 0.0, 0.0)); // Placeholder
    }
}