use super::Ephemeris;
use super::bsp::BspData;
use std::fs::File;
use std::io::Read;

#[test]
fn test_get_position() {
    let mut eph = Ephemeris::new();
    let mut file = File::open("de421.bsp").expect("Download de421.bsp first");
    let mut data = Vec::new();
    file.read_to_end(&mut data).expect("Failed to read BSP file");
    
    let bsp = BspData::from_bytes(&data).expect("Failed to parse BSP");
    eph.set_bsp_data("earth".to_string(), bsp);
    
    let pos = eph.get_position("earth", 2451545.0); // J2000
    assert_ne!(pos, (0.0, 0.0, 0.0), "Earth position should not be zero");
    println!("Earth at J2000: {:?}", pos);
}