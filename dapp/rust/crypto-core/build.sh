#!/bin/bash

# Build script for SOCOM-compliant PQCryptoCore WASM module
echo "Building SOCOM-compliant PQCryptoCore..."

# Ensure wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module for web target
echo "Compiling Rust to WASM..."
cd "$(dirname "$0")" || exit 1
wasm-pack build --target web --out-dir pkg --release

# Copy generated files to src/wasm directory
echo "Copying WASM files to TypeScript project..."
mkdir -p ../../src/wasm/crypto-core
cp -r pkg/* ../../src/wasm/crypto-core/

echo "✅ PQCryptoCore WASM module built successfully!"
echo "📁 Files available in: src/wasm/crypto-core/"
echo "🔒 Ready for SOCOM-compliant cryptographic operations"
