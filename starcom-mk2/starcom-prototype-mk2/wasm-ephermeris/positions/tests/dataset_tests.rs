use super::{PositionDataset, PlanetPositions};
use ephemeris::Ephemeris;
use ephemeris::bsp::BspData;

#[test]
fn test_get_all_positions() {
    let mut eph = Ephemeris::new();
    let bsp_data = BspData::from_bytes(&[]);
    eph.set_bsp_data("earth", bsp_data.clone());
    eph.set_bsp_data("mars", bsp_data);
    let dataset = PositionDataset::new(eph);
    let planets = vec!["earth", "mars"];
    let positions = dataset.get_all_positions(0.0, &planets);
    assert_eq!(positions.heliocentric[0], (1.0, 0.0, 0.0)); // Earth
    assert_eq!(positions.heliocentric[1], (1.0, 0.0, 0.0)); // Mars
    assert_eq!(positions.geocentric[0], (0.0, 0.0, 0.0));   // Earth relative to itself
    assert_eq!(positions.geocentric[1], (0.0, 0.0, 0.0));   // Mars relative to Earth
}