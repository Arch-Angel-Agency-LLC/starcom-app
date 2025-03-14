use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Window};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = "window")]
    fn get_window() -> Window;
}

#[wasm_bindgen]
pub async fn test_fetch() -> Result<(), JsValue> {
    let opts = RequestInit::new();
    opts.set_method("GET");
    let request = Request::new_with_str_and_init("https://example.com", &opts)?;
    let window = get_window();
    let promise = window.fetch_with_request(&request);
    let _response = JsFuture::from(promise).await?;
    Ok(())
}