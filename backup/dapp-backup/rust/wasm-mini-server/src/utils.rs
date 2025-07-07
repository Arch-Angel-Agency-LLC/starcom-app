//! ✅ `utils.rs` - Utility functions for WASM Mini-Server

use wasm_bindgen::prelude::*;
use web_sys::console;
use serde_json::Value;

/// ✅ Log messages to the browser's console for debugging.
///
/// Parameters:
/// - `message: &str` → The log message.
#[wasm_bindgen]
pub fn log(message: &str) {
    console::log_1(&message.into());
}

/// ✅ Parse a JSON string into a `serde_json::Value`.
///
/// Parameters:
/// - `json_str: &str` → The JSON string.
///
/// Returns:
/// - `Result<Value, JsValue>` → Parsed JSON object or an error.
pub fn parse_json(json_str: &str) -> Result<Value, JsValue> {
    serde_json::from_str(json_str)
        .map_err(|e| JsValue::from_str(&format!("❌ JSON Parse Error: {}", e)))
}

/// ✅ Validate a JSON response for correctness.
///
/// Parameters:
/// - `response: &Value` → The JSON response object.
///
/// Returns:
/// - `bool` → `true` if valid, `false` if invalid.
pub fn validate_response(response: &Value) -> bool {
    if response.get("error").is_some() {
        log("⚠️ API returned an error response.");
        return false;
    }
    true
}