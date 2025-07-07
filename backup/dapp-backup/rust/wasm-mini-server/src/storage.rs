use wasm_bindgen::JsCast; // ✅ Required for `.dyn_into()`
use wasm_bindgen::JsValue;
use web_sys::window;
use serde_json::{json, Value};
use std::time::{SystemTime, UNIX_EPOCH};
use js_sys::Object; // ✅ Use Object for key iteration

const CACHE_EXPIRATION_SECONDS: u64 = 3600;

/// ✅ Get the current timestamp in seconds
fn current_timestamp() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

/// ✅ Store an API response in LocalStorage
pub async fn store_response(url: &str, response: &JsValue) -> Result<(), JsValue> {
    let window = window().ok_or_else(|| JsValue::from_str("No global `window` found"))?;
    let storage = window.local_storage()?.ok_or_else(|| JsValue::from_str("LocalStorage unavailable"))?;

    let json_data = json!({
        "data": response.as_string().unwrap_or_default(),
        "timestamp": current_timestamp()
    });

    let json_str = serde_json::to_string(&json_data).map_err(|e| JsValue::from_str(&e.to_string()))?;
    storage.set_item(url, &json_str).map_err(|_| JsValue::from_str("Failed to store response"))?;

    Ok(())
}

/// ✅ Retrieve cached response with expiration handling
pub async fn get_cached_response(url: &str) -> Result<Option<JsValue>, JsValue> {
    let window = window().ok_or_else(|| JsValue::from_str("No global `window` found"))?;
    let storage = window.local_storage()?.ok_or_else(|| JsValue::from_str("LocalStorage unavailable"))?;

    if let Some(data) = storage.get_item(url)? {
        let parsed: Value = serde_json::from_str(&data).map_err(|e| JsValue::from_str(&e.to_string()))?;

        if let Some(timestamp) = parsed.get("timestamp").and_then(Value::as_u64) {
            if current_timestamp() - timestamp > CACHE_EXPIRATION_SECONDS {
                storage.remove_item(url).map_err(|_| JsValue::from_str("Failed to clear expired cache"))?;
                return Ok(None);
            }
        }

        if let Some(data) = parsed.get("data").and_then(Value::as_str) {
            return Ok(Some(JsValue::from_str(data)));
        }
    }

    Ok(None)
}

/// ✅ Clear a specific cached response
pub async fn clear_cached_response(url: &str) -> Result<(), JsValue> {
    let window = window().ok_or_else(|| JsValue::from_str("No global `window` found"))?;
    let storage = window.local_storage()?.ok_or_else(|| JsValue::from_str("LocalStorage unavailable"))?;

    storage.remove_item(url).map_err(|_| JsValue::from_str("Failed to clear cache"))?;
    Ok(())
}

/// ✅ Cleanup expired cache entries
pub async fn cleanup_expired_cache() -> Result<(), JsValue> {
    let window = window().ok_or_else(|| JsValue::from_str("No global `window` found"))?;
    let storage = window.local_storage()?.ok_or_else(|| JsValue::from_str("LocalStorage unavailable"))?;

    let keys = Object::keys(&storage);

    for i in 0..keys.length() {
        if let Some(js_key) = keys.get(i).dyn_into::<js_sys::JsString>().ok() {
            let key = js_key.as_string().unwrap_or_default(); // ✅ Convert to Rust String

            if let Some(data) = storage.get_item(&key)? {
                let parsed: Value = serde_json::from_str(&data).map_err(|e| JsValue::from_str(&e.to_string()))?;

                if let Some(timestamp) = parsed.get("timestamp").and_then(Value::as_u64) {
                    if current_timestamp() - timestamp > CACHE_EXPIRATION_SECONDS {
                        storage.remove_item(&key).map_err(|_| JsValue::from_str("Failed to clear expired cache"))?;
                    }
                }
            }
        }
    }

    Ok(())
}