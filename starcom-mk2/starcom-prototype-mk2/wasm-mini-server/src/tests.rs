#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    use wasm_bindgen::JsValue;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    async fn test_store_and_retrieve_data() {
        let test_url = "https://example.com/api";
        let test_data = JsValue::from_str("{\"message\": \"Hello, WASM!\"}");

        store_response(test_url, &test_data).await.unwrap();
        let cached_response = get_cached_response(test_url).await.unwrap();

        assert!(cached_response.is_some());
        assert_eq!(cached_response.unwrap().as_string().unwrap(), "{\"message\": \"Hello, WASM!\"}");
    }

    #[wasm_bindgen_test]
    async fn test_cache_expiration() {
        let test_url = "https://example.com/api/expire";
        let test_data = JsValue::from_str("{\"message\": \"Temporary data\"}");

        store_response(test_url, &test_data).await.unwrap();
        std::thread::sleep(std::time::Duration::from_secs(2)); // Simulate time passing

        let expired_response = get_cached_response(test_url).await.unwrap();
        assert!(expired_response.is_none()); // Cache should have expired
    }

    #[wasm_bindgen_test]
    async fn test_clear_cache() {
        let test_url = "https://example.com/api/clear";
        let test_data = JsValue::from_str("{\"message\": \"Should be removed\"}");

        store_response(test_url, &test_data).await.unwrap();
        clear_cached_response(test_url).await.unwrap();

        let cleared_response = get_cached_response(test_url).await.unwrap();
        assert!(cleared_response.is_none()); // Should be empty
    }
}