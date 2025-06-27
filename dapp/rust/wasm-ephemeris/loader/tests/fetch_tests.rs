use wasm_bindgen_test::*;
use super::load_bsp;

#[wasm_bindgen_test]
async fn test_load_bsp() {
    // Requires a mock server or real BSP URL in a browser/Node.js test env
    // For now, a placeholder test
    let result = load_bsp("http://example.com/mock.bsp", "earth").await;
    assert!(result.is_ok());
}