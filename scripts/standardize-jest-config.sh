#!/bin/bash

# Script to standardize Jest configuration
# Created based on OSINT-TEST-IMPLEMENTATION-ISSUES.md recommendations

echo "Standardizing Jest configuration..."

# Check if jest.config.js exists
if [ -f "jest.config.js" ]; then
  echo "Removing duplicate jest.config.js file..."
  rm jest.config.js
  echo "Done. Standardized on jest.config.ts"
else
  echo "No duplicate jest.config.js found, already using jest.config.ts"
fi

# Check if identity-obj-proxy is installed
if ! grep -q "identity-obj-proxy" package.json; then
  echo "Installing identity-obj-proxy for CSS module handling in tests..."
  npm install --save-dev identity-obj-proxy
  echo "Done installing identity-obj-proxy"
else
  echo "identity-obj-proxy already installed"
fi

echo "Jest configuration standardization complete."
echo "Run tests with: npm test -- --config=jest.config.ts"
