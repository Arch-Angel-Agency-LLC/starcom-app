// Import byteorder for reading binary data in big-endian or little-endian format
use byteorder::{BigEndian, LittleEndian, ReadBytesExt};
// Import Cursor for in-memory byte buffer navigation and Read for read_exact method
use std::io::{Cursor, Read};
// Import serde for serialization
use serde::Serialize;

// Represents the entire BSP file's data, containing multiple segments
#[derive(Clone, Serialize)]
pub struct BspData {
    pub segments: Vec<Segment>, // Collection of SPK segments (e.g., one per planet or orbit)
}

// Represents a single SPK segment, such as Earth's orbit relative to the Solar System Barycenter
#[derive(Clone, Serialize)]
#[allow(dead_code)] // Suppress dead_code warning for unused fields
pub struct Segment {
    pub target_id: i32,           // NAIF ID of the target body (e.g., 399 for Earth)
    pub center_id: i32,           // NAIF ID of the center body (e.g., 0 for SSB)
    pub start_time: f64,          // Start epoch in Julian Ephemeris Date (JED)
    pub end_time: f64,            // End epoch in JED
    pub intervals: Vec<Interval>, // Time intervals with Chebyshev coefficients
}

// Represents a single time interval within a segment, using Chebyshev polynomials
#[derive(Clone, Serialize)]
pub struct Interval {
    pub start_time: f64,   // Start of this interval in JED
    pub mid_time: f64,     // Midpoint of the interval for Chebyshev evaluation
    pub radius: f64,       // Half-length of the interval (time span / 2)
    pub coeffs: Vec<f64>,  // Chebyshev coefficients for x, y, z positions
    pub degree: usize,     // Degree of the Chebyshev polynomial (coeffs.len() / 3 - 1)
}

impl BspData {
    // Parses a BSP file from a byte slice into a BspData struct
    pub fn from_bytes(data: &[u8]) -> Result<Self, String> {
        let mut cursor = Cursor::new(data);
        let mut header = [0u8; 8];
        cursor.read_exact(&mut header).map_err(|e| e.to_string())?;
        
        // Correct endianness check: big-endian if first 4 bytes are "DAF/"
        let is_little_endian = {
            // Check bytes 0-3 for "DAF/" (big-endian) or bytes 4-7 (little-endian)
            let is_be = &header[0..4] == b"DAF/";
            let is_le = &header[4..8] == b"DAF/";
            if !is_be && !is_le {
                return Err("Invalid DAF header".into());
            }
            is_le
        };

        // Read ND, NI, LOCIDW from header
        cursor.set_position(8);
        let nd = read_i32(&mut cursor, is_little_endian)?;
        let ni = read_i32(&mut cursor, is_little_endian)?;
        cursor.set_position(16);
        let locidw = read_i32(&mut cursor, is_little_endian)?;

        // Validate SPK Type 2
        if nd != 3 || ni != 6 {
            return Err(format!("Unsupported SPK type: ND={}, NI={}", nd, ni));
        }

        // Jump to summary records using LOCIDW
        cursor.set_position(locidw as u64);

        let mut segments = Vec::new();
        while let Ok(fwd) = read_i32(&mut cursor, is_little_endian) {
            if fwd == 0 {
                break;
            }
            let _bck = read_i32(&mut cursor, is_little_endian)?;
            let n_summaries = read_i32(&mut cursor, is_little_endian)?;

            for _ in 0..n_summaries {
                let start_time = read_f64(&mut cursor, is_little_endian)?;
                let end_time = read_f64(&mut cursor, is_little_endian)?;
                let target_id = read_i32(&mut cursor, is_little_endian)?;
                let center_id = read_i32(&mut cursor, is_little_endian)?;
                let _frame = read_i32(&mut cursor, is_little_endian)?;
                let data_type = read_i32(&mut cursor, is_little_endian)?;
                let data_start = read_i32(&mut cursor, is_little_endian)?;
                let _data_end = read_i32(&mut cursor, is_little_endian)?;

                if data_type != 2 {
                    continue;
                }

                let pos = cursor.position();
                cursor.set_position(data_start as u64 - 1);

                let init_s = read_f64(&mut cursor, is_little_endian)?;
                let int_len_s = read_f64(&mut cursor, is_little_endian)?;
                let rsize = read_i32(&mut cursor, is_little_endian)?;
                let n = read_i32(&mut cursor, is_little_endian)?;
                let n_coeffs = (rsize - 2) / 3;
                let degree = n_coeffs as usize - 1;

                let mut intervals = Vec::new();
                for i in 0..n {
                    let start = init_s + (i as f64) * int_len_s;
                    let mut coeffs = Vec::with_capacity(n_coeffs as usize * 3);
                    for _ in 0..n_coeffs * 3 {
                        coeffs.push(read_f64(&mut cursor, is_little_endian)?);
                    }
                    intervals.push(Interval {
                        start_time: start,
                        mid_time: start + int_len_s / 2.0,
                        radius: int_len_s / 2.0,
                        coeffs,
                        degree,
                    });
                }
                cursor.set_position(pos);

                segments.push(Segment {
                    target_id,
                    center_id,
                    start_time,
                    end_time,
                    intervals,
                });
            }
        }

        Ok(BspData { segments })
    }

    // Get the position of a planet at a specific time
    pub fn get_position(&self, planet_id: i32, time: f64) -> (f64, f64, f64) {
        // Search for a segment matching the planet and time
        for segment in &self.segments {
            if segment.target_id == planet_id && time >= segment.start_time && time <= segment.end_time {
                return segment.get_position(time);
            }
        }
        // Return (0, 0, 0) if no matching segment found
        (0.0, 0.0, 0.0)
    }

    // Check if the BSP data contains any segments
    pub fn has_segments(&self) -> bool {
        !self.segments.is_empty()
    }
}

// Helper functions for endian-aware reading
fn read_i32(cursor: &mut Cursor<&[u8]>, little_endian: bool) -> Result<i32, String> {
    if little_endian {
        cursor.read_i32::<LittleEndian>()
    } else {
        cursor.read_i32::<BigEndian>()
    }.map_err(|e| e.to_string())
}

fn read_f64(cursor: &mut Cursor<&[u8]>, little_endian: bool) -> Result<f64, String> {
    if little_endian {
        cursor.read_f64::<LittleEndian>()
    } else {
        cursor.read_f64::<BigEndian>()
    }.map_err(|e| e.to_string())
}

impl Segment {
    // Calculate position within this segment at a given time
    fn get_position(&self, time: f64) -> (f64, f64, f64) {
        // Find the interval containing the time
        for interval in &self.intervals {
            if time >= interval.start_time && time < interval.start_time + 2.0 * interval.radius {
                // Normalize time to [-1, 1] for Chebyshev evaluation
                let t = (time - interval.mid_time) / interval.radius;
                // Evaluate Chebyshev polynomials for x, y, z
                let (x, y, z) = chebyshev_eval(&interval.coeffs, t, interval.degree);
                return (x, y, z);
            }
        }
        // Return (0, 0, 0) if time is outside all intervals
        (0.0, 0.0, 0.0)
    }
}

// Evaluates Chebyshev polynomials for x, y, z coordinates
fn chebyshev_eval(coeffs: &[f64], t: f64, degree: usize) -> (f64, f64, f64) {
    // Arrays to store the last three terms of the recurrence for x, y, z
    let mut tx = [0.0; 3];
    let mut ty = [0.0; 3];
    let mut tz = [0.0; 3];

    // Iterate over coefficients from highest degree to lowest
    for i in (0..=degree).rev() {
        // Shift terms for x recurrence
        tx[2] = tx[1];
        tx[1] = tx[0];
        // Compute next term: T_n(t) = 2t * T_(n-1) - T_(n-2) + coeff
        tx[0] = 2.0 * t * tx[1] - tx[2] + coeffs[i * 3];
        
        // Shift terms for y recurrence
        ty[2] = ty[1];
        ty[1] = ty[0];
        ty[0] = 2.0 * t * ty[1] - ty[2] + coeffs[i * 3 + 1];
        
        // Shift terms for z recurrence
        tz[2] = tz[1];
        tz[1] = tz[0];
        tz[0] = 2.0 * t * tz[1] - tz[2] + coeffs[i * 3 + 2];
    }

    // Final position: adjust with lower-order terms for accuracy
    (tx[0] - t * tx[1] + tx[2], ty[0] - t * ty[1] + ty[2], tz[0] - t * tz[1] + tz[2])
}