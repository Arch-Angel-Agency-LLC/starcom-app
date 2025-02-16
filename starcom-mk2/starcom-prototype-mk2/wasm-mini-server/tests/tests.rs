use wasm_mini_server::{get_api_data, clear_cache, cleanup_cache};
use wasm_mini_server::api::fetch_data;  // ✅ Correct import for module
use wasm_bindgen_test::*;  // ✅ Ensure wasm_bindgen test framework is included

wasm_bindgen_test_configure!(run_in_browser);  // 🧪 Runs tests in a headless browser

#[wasm_bindgen_test]
async fn test_fetch_data() {
    let url = "https://jsonplaceholder.typicode.com/todos/1";
    let result = fetch_data(url).await;
    assert!(result.is_ok());  // ✅ Ensure response is valid
}

#[wasm_bindgen_test]
async fn test_clear_cache() {
    let result = clear_cache("https://jsonplaceholder.typicode.com/todos/1".to_string()).await;
    assert!(result.is_ok());
}

#[wasm_bindgen_test]
async fn test_cleanup_cache() {
    let result = cleanup_cache().await;
    assert!(result.is_ok());
}

fn main() {}  // ✅ Required for integration tests