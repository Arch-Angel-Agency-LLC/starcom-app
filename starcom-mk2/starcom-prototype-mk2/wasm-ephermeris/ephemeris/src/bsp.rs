// Import byteorder for reading binary data in big-endian or little-endian format
use byteorder::{BigEndian, LittleEndian, ReadBytesExt};
// Import Cursor for in-memory byte buffer navigation and Read for read_exact method
use std::io::{Cursor, Read};

// Represents the entire BSP file's data, containing multiple segments
#[derive(Clone)]
pub struct BspData {
    segments: Vec<Segment>, // Collection of SPK segments (e.g., one per planet or orbit)
}

// Represents a single SPK segment, such as Earth's orbit relative to the Solar System Barycenter
#[derive(Clone)]
#[allow(dead_code)] // Suppress dead_code warning for unused fields
struct Segment {
    target_id: i32,           // NAIF ID of the target body (e.g., 399 for Earth)
    center_id: i32,           // NAIF ID of the center body (e.g., 0 for SSB)
    start_time: f64,          // Start epoch in Julian Ephemeris Date (JED)
    end_time: f64,            // End epoch in JED
    intervals: Vec<Interval>, // Time intervals with Chebyshev coefficients
}

// Represents a single time interval within a segment, using Chebyshev polynomials
#[derive(Clone)]
struct Interval {
    start_time: f64,   // Start of this interval in JED
    mid_time: f64,     // Midpoint of the interval for Chebyshev evaluation
    radius: f64,       // Half-length of the interval (time span / 2)
    coeffs: Vec<f64>,  // Chebyshev coefficients for x, y, z positions
    degree: usize,     // Degree of the Chebyshev polynomial (coeffs.len() / 3 - 1)
}

impl BspData {
    // Parses a BSP file from a byte slice into a BspData struct
    pub fn from_bytes(data: &[u8]) -> Result<Self, String> {
        // Create a cursor to navigate the byte buffer in memory
        let mut cursor = Cursor::new(data);
        
        // Read the first 8 bytes of the DAF (Direct Access File) header
        let mut header = [0u8; 8];
        // read_exact fills the header array with exactly 8 bytes or errors if not enough data
        cursor.read_exact(&mut header).map_err(|e| e.to_string())?;
        // Check endianness: "DAF/" in bytes 4-7 means big-endian, otherwise little-endian
        let is_little_endian = &header[4..8] == b"DAF/";

        // Move to position 8 to read ND and NI (after LOCIDW field in header)
        cursor.set_position(8);
        // ND: number of double-precision values per summary (should be 3 for x, y, z)
        let nd = if is_little_endian {
            cursor.read_i32::<LittleEndian>() // Read 4-byte int in little-endian
        } else {
            cursor.read_i32::<BigEndian>()    // Read 4-byte int in big-endian
        }.map_err(|e| e.to_string())?;
        // NI: number of integer values per summary (should be 6 for SPK Type 2)
        let ni = if is_little_endian {
            cursor.read_i32::<LittleEndian>()
        } else {
            cursor.read_i32::<BigEndian>()
        }.map_err(|e| e.to_string())?;
        // Validate SPK type: ND=3 (x, y, z), NI=6 (target, center, frame, type, start, end)
        if nd != 3 || ni != 6 {
            return Err("Unsupported SPK type".to_string());
        }

        // Skip the comment area (typically ends at 1024 bytes in standard BSP files)
        // TODO: Parse comment length from header for accuracy
        cursor.set_position(1024);

        // Vector to store all segments parsed from the file
        let mut segments = Vec::new();
        // Loop through summary records until we hit a forward pointer of 0
        while let Ok(fwd) = if is_little_endian {
            cursor.read_i32::<LittleEndian>() // FWD: pointer to next summary record
        } else {
            cursor.read_i32::<BigEndian>()
        } {
            if fwd == 0 { break; } // End of summary records reached
            // BCK: backward pointer (not used here, but part of DAF structure)
            let _bck = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
            // Number of summary records in this block
            let n_summaries = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;

            // Process each summary in this block
            for _ in 0..n_summaries {
                // Start time of the segment (JED)
                let start_time = cursor.read_f64::<BigEndian>().map_err(|e| e.to_string())?;
                // End time of the segment (JED)
                let end_time = cursor.read_f64::<BigEndian>().map_err(|e| e.to_string())?;
                // Target body ID (e.g., 399 for Earth)
                let target_id = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // Center body ID (e.g., 0 for SSB)
                let center_id = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // Reference frame (e.g., 1 for J2000)
                let _frame = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?; // Unused, prefixed with _
                // Data type (2 for Chebyshev polynomials)
                let data_type = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // Start index of segment data (1-based)
                let data_start = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // End index of segment data (1-based)
                let _data_end = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?; // Unused, prefixed with _

                // Only process SPK Type 2 (Chebyshev) for now
                if data_type != 2 {
                    continue;
                }

                // Save current position to return after reading segment data
                let pos = cursor.position();
                // Move to segment data (1-based index, so subtract 1 for 0-based offset)
                cursor.set_position(data_start as u64 - 1);
                // Initial time of first interval (seconds past J2000)
                let init_s = cursor.read_f64::<BigEndian>().map_err(|e| e.to_string())?;
                // Length of each interval in seconds
                let int_len_s = cursor.read_f64::<BigEndian>().map_err(|e| e.to_string())?;
                // Record size (number of doubles per interval)
                let rsize = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // Number of intervals in this segment
                let n = cursor.read_i32::<BigEndian>().map_err(|e| e.to_string())?;
                // Number of coefficients per dimension (x, y, z)
                let n_coeffs = (rsize - 2) / 3; // Subtract 2 for init_s and int_len_s
                // Polynomial degree is one less than number of coefficients
                let degree = n_coeffs - 1;

                // Vector to store intervals for this segment
                let mut intervals = Vec::new();
                // Loop through each interval
                for i in 0..n {
                    // Calculate start time of this interval
                    let start = init_s + (i as f64) * int_len_s;
                    // Pre-allocate space for coefficients (x, y, z interleaved)
                    let mut coeffs = Vec::with_capacity(n_coeffs as usize * 3);
                    // Read coefficients for x, y, z (n_coeffs sets per dimension)
                    for _ in 0..n_coeffs * 3 {
                        coeffs.push(cursor.read_f64::<BigEndian>().map_err(|e| e.to_string())?);
                    }
                    // Add interval to the list
                    intervals.push(Interval {
                        start_time: start,
                        mid_time: start + int_len_s / 2.0, // Midpoint for Chebyshev eval
                        radius: int_len_s / 2.0,           // Half-length for normalization
                        coeffs,
                        degree: degree as usize,
                    });
                }
                // Restore cursor position to continue reading summaries
                cursor.set_position(pos);

                // Add the parsed segment to our collection
                segments.push(Segment {
                    target_id,
                    center_id,
                    start_time,
                    end_time,
                    intervals,
                });
            }
        }

        // Return the parsed BSP data
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