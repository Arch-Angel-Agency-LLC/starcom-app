use wasm_bindgen::prelude::*;
use ephemeris::Ephemeris;
use positions::{PositionDataset, PlanetPositions};
use gravimetrics::Gravimetrics;
use harmonics::{Harmonics, HarmonicsTensor};
use loader::Loader;

#[wasm_bindgen]
pub struct WasmEphemeris {
    ephemeris: Ephemeris,
    positions: PositionDataset,
    gravimetrics: Gravimetrics,
    harmonics: Harmonics,
    loader: Loader,
}

#[wasm_bindgen]
impl WasmEphemeris {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmEphemeris, JsValue> {
        let ephemeris = Ephemeris::new();
        let positions = PositionDataset::new(ephemeris.clone());
        let gravimetrics = Gravimetrics::new(positions.clone());
        let harmonics = Harmonics::new(positions.clone());
        let loader = Loader::new()?;
        Ok(WasmEphemeris { ephemeris, positions, gravimetrics, harmonics, loader })
    }

    pub async fn load_bsp(&mut self, planet: &str, url: &str, prepackaged: Option<Vec<u8>>) -> Result<(), JsValue> {
        let bsp = self.loader.load_bsp(planet, url, prepackaged).await?;
        self.ephemeris.set_bsp_data(planet.to_string(), bsp);
        Ok(())
    }

    pub fn get_positions(&self, time: f64, planets: Vec<String>) -> JsValue {
        let planets: Vec<&str> = planets.iter().map(|s| s.as_str()).collect();
        let pos = self.positions.get_all_positions(time, &planets);
        serde_wasm_bindgen::to_value(&pos).unwrap()
    }

    pub fn get_grav_tensor(&self, time: f64, heliocentric: bool, planets: Vec<String>) -> Vec<f64> {
        let planets: Vec<&str> = planets.iter().map(|s| s.as_str()).collect();
        self.gravimetrics.compute_tensor(time, heliocentric, &planets)
    }

    pub fn get_harm_tensor(&self, time: f64, planets: Vec<String>) -> JsValue {
        let planets: Vec<&str> = planets.iter().map(|s| s.as_str()).collect();
        let tensor = self.harmonics.compute_tensor(time, &planets);
        serde_wasm_bindgen::to_value(&tensor).unwrap()
    }
}