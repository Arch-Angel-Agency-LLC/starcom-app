use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Window};
use js_sys::Uint8Array;

// Assuming ephemeris crate defines BspData
use ephemeris::bsp::BspData;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = "window")]
    fn get_window() -> Window;
}

#[wasm_bindgen]
pub async fn load_bsp(url: String) -> Result<JsValue, JsValue> {
    let opts = RequestInit::new();
    opts.set_method("GET");
    let request = Request::new_with_str_and_init(&url, &opts)?;
    let window = get_window();
    let promise = window.fetch_with_request(&request);
    let response = JsFuture::from(promise).await?;
    let buffer = JsFuture::from(response.array_buffer()?).await?;
    let bytes = Uint8Array::new(&buffer).to_vec();
    let bsp = BspData::from_bytes(&bytes).map_err(|e| JsValue::from_str(&e))?;
    Ok(JsValue::from_serde(&bsp).unwrap()) // Serialize to JS; adjust if needed
}