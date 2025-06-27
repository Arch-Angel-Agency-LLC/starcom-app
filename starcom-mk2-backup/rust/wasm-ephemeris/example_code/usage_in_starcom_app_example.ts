// import init, { WasmEphemeris } from './wasm/wasm_ephemeris_api';

// // Pre-packaged BSP (optional)
// const prepackagedBsp = fetch('/path/to/local.bsp').then(res => res.array_buffer()).then(buf => new Uint8Array(buf));

// async function initWasm() {
//   await init();
//   const wasm = new WasmEphemeris();
//   const url = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440.bsp";
//   await wasm.load_bsp("earth", url, prepackagedBsp ? Array.from(prepackagedBsp) : null);
//   console.log(wasm.get_positions(0.0, ["earth", "mars"]));
// }
// initWasm();