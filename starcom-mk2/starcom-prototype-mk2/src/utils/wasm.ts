import init, { get_api_data, clear_cache, cleanup_cache } from "/src/wasm/wasm_mini_server.js";

let wasmReady = false;

/**
 * Initialize the WASM Mini-Server.
 * Ensures that the WASM module is loaded only once.
 */
export async function initMiniServer() {
  if (!wasmReady) {
    await init();
    console.log("✅ WASM Mini-Server Initialized");
    wasmReady = true;
  } else {
    console.log("WASM Mini-Server is still initialized");
  }
}

/**
 * Fetch data via WASM Mini-Server.
 * @param url - The API endpoint
 * @returns The fetched data
 */
export async function fetchFromMiniServer(url: string): Promise<any> {
  await initMiniServer();
  console.log(`🚀 Fetching data from WASM: ${url}`);
  return await get_api_data(url);
}

/**
 * Manually clear the cache for a specific URL.
 * @param url - The API endpoint to clear cache for
 */
export async function clearMiniServerCache(url: string): Promise<void> {
  await initMiniServer();
  await clear_cache(url);
  console.log(`🗑️ Cache cleared for ${url}`);
}

/**
 * Cleanup all expired cache entries.
 */
export async function cleanupMiniServerCache(): Promise<void> {
  await initMiniServer();
  await cleanup_cache();
  console.log("♻️ Cleanup expired cache");
}