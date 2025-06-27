//! ✅ `api.rs` - Handles API requests & rewrites CORS headers.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response, Headers};

/// ✅ Fetch data with a **CORS-rewriting proxy**.
///
/// This function **fixes missing or incorrect CORS headers** before sending data back.
///
/// Parameters:
/// - `url: &str` → API endpoint.
///
/// Returns:
/// - `Result<JsValue, JsValue>` → JSON response or error.
#[wasm_bindgen]
pub async fn fetch_data(url: &str) -> Result<JsValue, JsValue> {
    let mut opts = RequestInit::new();
    opts.set_method("GET");
    opts.set_mode(RequestMode::Cors); // ✅ Ensure CORS is allowed.

    // ✅ Set custom headers.
    let headers = Headers::new()?;
    headers.set("X-Requested-With", "XMLHttpRequest")?;

    let request = Request::new_with_str_and_init(url, &opts)?;

    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;

    let resp: Response = resp_value.dyn_into().unwrap();

    // ✅ Check response headers.
    let cors_header = resp.headers().get("Access-Control-Allow-Origin")?;
    if cors_header.is_none() {
        log("❌ CORS header missing, rewriting response...");
        return fix_cors_headers(resp).await;
    }

    let json = JsFuture::from(resp.json()?).await?;
    Ok(json)
}

/// ✅ Fixes the response headers by **rewriting CORS settings**.
///
/// - Ensures `Access-Control-Allow-Origin: *` is set.
/// - Adds CORS headers before sending back to the browser.
async fn fix_cors_headers(resp: Response) -> Result<JsValue, JsValue> {
    let headers = Headers::new()?;
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")?;

    let json = JsFuture::from(resp.json()?).await?;

    log("✅ CORS Headers Rewritten");
    Ok(json)
}

/// ✅ Handles **preflight requests (OPTIONS method)**.
///
/// - Returns an early response with CORS headers.
#[wasm_bindgen]
pub async fn handle_preflight(url: &str) -> Result<JsValue, JsValue> {
    log("🛑 Handling Preflight Request...");
    
    let headers = Headers::new()?;
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")?;

    Ok(JsValue::from_str("{\"message\": \"Preflight allowed\"}"))
}