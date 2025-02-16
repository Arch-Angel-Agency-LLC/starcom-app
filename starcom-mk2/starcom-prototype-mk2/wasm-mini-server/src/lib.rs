//! ✅ `lib.rs` - Entry point for the WASM CORS Proxy Mini-Server

// Modules
pub mod api;   // ✅ Make `api` module public
pub mod storage;
pub mod utils;

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};
use storage::{store_response, get_cached_response, clear_cached_response, cleanup_expired_cache};
use utils::{log, parse_json, validate_response};

/// ✅ Fetch data via WASM with built-in caching and CORS proxy functionality.
///
/// - Checks local cache before making a network request.
/// - If cache exists, returns it. Otherwise, fetches from API and stores it.
/// - Uses a CORS-enabled request to bypass restrictions.
///
/// Parameters:
/// - `url: String` → API endpoint to fetch data from.
///
/// Returns:
/// - `Result<JsValue, JsValue>` → The fetched JSON data or an error message.
#[wasm_bindgen]
pub async fn get_api_data(url: String) -> Result<JsValue, JsValue> {
    log(&format!("🔍 Checking cache for: {}", url));

    // ✅ First, check if the cache contains valid data.
    if let Some(cached) = get_cached_response(&url).await? {
        log(&format!("✅ Returning cached data for: {}", url));
        return Ok(cached);
    }

    // ✅ Fetch fresh data via CORS proxy
    log(&format!("🌐 Fetching data from: {}", url));
    let response = api::fetch_data(&url).await?;

    // ✅ Parse and validate before storing
    let parsed = parse_json(&response.as_string().unwrap_or_default())?;
    if validate_response(&parsed) {
        log(&format!("💾 Storing response in cache for: {}", url));
        store_response(&url, &response).await?;
    }

    Ok(response)
}

/// ✅ Manually clear cache for a specific API endpoint.
///
/// Parameters:
/// - `url: String` → The API URL whose cache should be cleared.
#[wasm_bindgen]
pub async fn clear_cache(url: String) -> Result<(), JsValue> {
    log(&format!("🗑 Clearing cache for: {}", url));
    clear_cached_response(&url).await
}

/// ✅ Clean up all expired cache entries.
#[wasm_bindgen]
pub async fn cleanup_cache() -> Result<(), JsValue> {
    log("🧹 Running cache cleanup...");
    cleanup_expired_cache().await
}

/// ✅ WASM Module Initialization
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    log("🚀 WASM Mini-Server Initialized as CORS Proxy");
    Ok(())
}