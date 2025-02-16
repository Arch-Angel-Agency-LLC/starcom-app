/* tslint:disable */
/* eslint-disable */
/**
 * ✅ Fetch data with built-in caching
 *
 * - First checks cache before making a network request.
 * - If cache exists, returns it. Otherwise, fetches from API and stores it.
 *
 * Parameters:
 * - `url: String` → API endpoint to fetch data from.
 *
 * Returns:
 * - `Result<JsValue, JsValue>` → The fetched data or an error message.
 */
export function get_api_data(url: string): Promise<any>;
/**
 * ✅ Manually clear cache for a specific API endpoint.
 *
 * Parameters:
 * - `url: String` → The API URL whose cache should be cleared.
 */
export function clear_cache(url: string): Promise<void>;
/**
 * ✅ Clean up all expired cache entries.
 */
export function cleanup_cache(): Promise<void>;
/**
 * ✅ Log messages to the browser's console for debugging.
 *
 * Parameters:
 * - `message: &str` → The log message.
 */
export function log(message: string): void;

export function fetch_with_cors(url: string): Promise<any>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly get_api_data: (a: number, b: number) => any;
  readonly clear_cache: (a: number, b: number) => any;
  readonly cleanup_cache: () => any;
  readonly log: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_5: WebAssembly.Table;
  readonly closure50_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure63_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
