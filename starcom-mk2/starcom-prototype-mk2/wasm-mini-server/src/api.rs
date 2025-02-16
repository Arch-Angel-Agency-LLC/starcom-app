//! ✅ `api.rs` - Handles API requests

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};
use crate::utils::log;

/// ✅ Fetch data from an API endpoint.
///
/// - Uses CORS mode to bypass cross-origin restrictions.
/// - Converts the response into a JSON object.
///
/// Parameters:
/// - `url: String` → The API URL.
///
/// Returns:
/// - `Result<JsValue, JsValue>` → The JSON response or an error.
pub async fn fetch_data(url: String) -> Result<JsValue, JsValue> {
    log(&format!("🌍 Making API request to: {}", url));

    // ✅ Configure request options
    let opts = RequestInit::new();
    opts.set_method("GET");
    opts.set_mode(RequestMode::Cors); // ✅ Bypass CORS

    let request = Request::new_with_str_and_init(&url, &opts)?;
    let window = web_sys::window().expect("No global `window` exists");

    // ✅ Execute fetch request
    let response = JsFuture::from(window.fetch_with_request(&request)).await?;
    let response: Response = response.dyn_into().unwrap();

    // ✅ Convert response to JSON
    let json = JsFuture::from(response.json()?).await?;
    log(&format!("✅ API request successful: {}", url));

    Ok(json)
}