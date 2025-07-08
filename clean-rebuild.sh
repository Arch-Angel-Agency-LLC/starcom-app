#!/bin/bash

# clean-rebuild.sh
# Script to clean Vite cache and rebuild the application

echo "Stopping any running Vite server..."
pkill -f "vite"

echo "Clearing Vite cache..."
rm -rf node_modules/.vite

echo "Cleaning build artifacts..."
rm -rf dist

echo "Starting build with force optimization..."
VITE_ENTRY=index.html npm run build

echo "Starting dev server with clean cache..."
VITE_ENTRY=index.html npm run dev
