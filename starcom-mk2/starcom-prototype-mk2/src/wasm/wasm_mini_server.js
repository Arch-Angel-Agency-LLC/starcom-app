import init, { fetch_with_cors } from './wasm_mini_server_bg.wasm';

async function initWasm() {
  await init();
}

async function get_api_data(url) {
  try {
    const data = await fetch_with_cors(url);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export { initWasm, get_api_data };
