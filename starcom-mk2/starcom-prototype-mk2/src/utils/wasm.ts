import init, { get_api_data } from "../wasm/wasm_mini_server";

let wasmReady = false;
export async function initWASM() {
  if (!wasmReady) {
    await init();
    wasmReady = true;
  }
}

export async function fetchFromMiniServer(url: string): Promise<any> {
  await initWASM();
  console.log(`Fetching from WASM: ${url}`);
  return await get_api_data(url);
}