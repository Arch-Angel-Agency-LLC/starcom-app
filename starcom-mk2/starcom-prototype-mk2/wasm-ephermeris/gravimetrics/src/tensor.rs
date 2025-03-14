use positions::PlanetPositions;

pub fn compute_grav_tensor(positions: &PlanetPositions, heliocentric: bool) -> Vec<f64> {
    let pos = if heliocentric { &positions.heliocentric } else { &positions.geocentric };
    // Placeholder: Simple pairwise gravitational force tensor (3x3)
    let mut tensor = vec![0.0; 9];
    if pos.len() >= 2 {
        let (x1, y1, z1) = pos[0];
        let (x2, y2, z2) = pos[1];
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dz = z2 - z1;
        let r = (dx * dx + dy * dy + dz * dz).sqrt();
        if r > 0.0 {
            let g = 1.0 / (r * r); // Simplified G*M1*M2/r^2 (masses = 1)
            tensor[0] = g * dx / r; // xx component
            tensor[4] = g * dy / r; // yy component
            tensor[8] = g * dz / r; // zz component
        }
    }
    tensor
}