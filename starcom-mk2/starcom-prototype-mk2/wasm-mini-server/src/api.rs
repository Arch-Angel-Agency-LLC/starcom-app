//! ✅ `api.rs` - Handles API requests via CORS-enabled fetch.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};

/// ✅ Fetch data with a CORS-enabled request.
///
/// This function acts as a **CORS proxy** inside the WASM mini-server, allowing
/// **cross-origin API requests** without relying on external proxies.
///
/// Parameters:
/// - `url: &str` → API endpoint to fetch data from.
///
/// Returns:
/// - `Result<JsValue, JsValue>` → The fetched JSON data or an error message.
#[wasm_bindgen]
pub async fn fetch_data(url: &str) -> Result<JsValue, JsValue> {
    let opts = RequestInit::new();
    opts.set_method("GET"); // ✅ Updated deprecated `.method()`
    opts.set_mode(RequestMode::Cors); // ✅ Updated deprecated `.mode()`

    let request = Request::new_with_str_and_init(url, &opts)?;
    request.headers().set("Access-Control-Allow-Origin", "*")?;

    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;

    let resp: Response = resp_value.dyn_into().unwrap();
    let json = JsFuture::from(resp.json()?).await?;
    Ok(json)
}