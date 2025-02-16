//! ✅ `lib.rs` - Entry point for the WASM Mini-Server

// Modules
mod api;
mod storage;
mod utils;

use wasm_bindgen::prelude::*;
use api::fetch_data;
use storage::{store_response, get_cached_response, clear_cached_response, cleanup_expired_cache};
use utils::{log, parse_json, validate_response};

/// ✅ Fetch data with built-in caching
///
/// - First checks cache before making a network request.
/// - If cache exists, returns it. Otherwise, fetches from API and stores it.
///
/// Parameters:
/// - `url: String` → API endpoint to fetch data from.
///
/// Returns:
/// - `Result<JsValue, JsValue>` → The fetched data or an error message.
#[wasm_bindgen]
pub async fn get_api_data(url: String) -> Result<JsValue, JsValue> {
    log(&format!("🔍 Checking cache for: {}", url));

    // ✅ First, check if the cache contains valid data.
    if let Some(cached) = get_cached_response(&url).await? {
        log(&format!("✅ Returning cached data for: {}", url));
        return Ok(cached);
    }

    // ✅ Fetch fresh data from the API
    log(&format!("🌐 Fetching data from: {}", url));
    let response = fetch_data(url.clone()).await?;

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