use super::{Gravimetrics, PositionDataset};
use ephemeris::Ephemeris;
use ephemeris::bsp::BspData;

#[test]
fn test_compute_tensor() {
    let mut eph = Ephemeris::new();
    let bsp_data = BspData::from_bytes(&[]);
    eph.set_bsp_data("earth", bsp_data.clone());
    eph.set_bsp_data("mars", bsp_data);
    let pos = PositionDataset::new(eph);
    let grav = Gravimetrics::new(pos);
    let planets = vec!["earth", "mars"];
    let tensor = grav.compute_tensor(0.0, true, &planets);
    assert_eq!(tensor.len(), 9);
    // With mock data, expect zeros due to same positions
    assert_eq!(tensor, vec![0.0; 9]);
}