mod tensor;
use positions::PositionDataset;

pub struct Gravimetrics {
    positions: PositionDataset,
}

impl Gravimetrics {
    pub fn new(positions: PositionDataset) -> Self {
        Gravimetrics { positions }
    }

    pub fn compute_tensor(&self, time: f64, heliocentric: bool, planets: &[&str]) -> Vec<f64> {
        let pos = self.positions.get_all_positions(time, planets);
        tensor::compute_grav_tensor(&pos, heliocentric)
    }
}