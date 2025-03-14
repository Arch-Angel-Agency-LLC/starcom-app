use super::bsp::BspData;
use std::fs::File;
use std::io::Read;

#[test]
fn test_bsp_parsing() {
    let mut file = File::open("de421.bsp").expect("Download de421.bsp first");
    let mut data = Vec::new();
    file.read_to_end(&mut data).expect("Failed to read BSP file");
    
    let bsp = BspData::from_bytes(&data).expect("Failed to parse BSP");
    assert!(!bsp.segments.is_empty(), "No segments parsed");

    // Test Earth position at J2000 (2451545.0)
    let pos = bsp.get_position(399, 2451545.0);
    assert_ne!(pos, (0.0, 0.0, 0.0), "Position should not be zero");
    println!("Earth at J2000: {:?}", pos);
}