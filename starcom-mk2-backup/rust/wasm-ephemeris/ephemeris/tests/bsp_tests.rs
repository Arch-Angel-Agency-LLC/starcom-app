// In bsp_tests.rs - Enhanced tests
use ephemeris::bsp::BspData;
use std::fs;

#[test]
fn test_bsp_parsing() {
    let bytes = fs::read("de421.bsp").expect("File missing: Download from NASA's SPICE server");
    let bsp = BspData::from_bytes(&bytes).unwrap_or_else(|e| panic!("Parsing failed: {}", e));
    
    assert!(bsp.has_segments(), "No segments found");
    assert!(!bsp.segments.is_empty(), "Segment vector empty");
    
    // Verify Earth segment exists
    let earth_segment = bsp.segments.iter()
        .find(|s| s.target_id == 399)
        .expect("No Earth segment found");
    
    println!("Earth segment covers {} to {} JED", 
        earth_segment.start_time, earth_segment.end_time);
}

// In bsp_tests.rs - Fixed syntax errors
#[test]
fn test_j2000_position() {
    let bytes = fs::read("de421.bsp").expect("Missing BSP file");
    let bsp = BspData::from_bytes(&bytes).unwrap();
    
    let (x, y, z) = bsp.get_position(399, 2451545.0);
    println!("Earth at J2000: x={:.6}, y={:.6}, z={:.6}", x, y, z);
    
    // Corrected assertions with proper parenthesis
    assert!((x - (-0.177_317)).abs() < 0.01, "X off: {:.6}", x);
    assert!((y - 0.935_203).abs() < 0.01, "Y off: {:.6}", y);  // Fixed extra )
    assert!(z.abs() < 0.000_1, "Z should be near 0: {:.6}", z);
}

#[test]
fn test_time_boundaries() {
    let bytes = fs::read("de421.bsp").unwrap();
    let bsp = BspData::from_bytes(&bytes).unwrap();
    
    // Test start of DE421 coverage (1990)
    let pos_1990 = bsp.get_position(399, 2447893.0);
    assert_ne!(pos_1990, (0.0, 0.0, 0.0), "1990 position failed");
    
    // Test end of DE421 coverage (2050)
    let pos_2050 = bsp.get_position(399, 2471184.0);
    assert_ne!(pos_2050, (0.0, 0.0, 0.0), "2050 position failed");
}

#[test]
fn test_invalid_planet() {
    let bytes = fs::read("de421.bsp").unwrap();
    let bsp = BspData::from_bytes(&bytes).unwrap();
    
    // Test non-existent ID
    let pos = bsp.get_position(999, 2451545.0);
    assert_eq!(pos, (0.0, 0.0, 0.0), "Invalid ID should return zeros");
}