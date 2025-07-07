#!/bin/bash

# OSINT Test Implementation Issues Fixer
# This script helps resolve the issues documented in OSINT-TEST-IMPLEMENTATION-ISSUES.md

echo "===== OSINT Test Implementation Issues Fixer ====="
echo "Running from: $(pwd)"

# Ensure we're in the dapp directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Please run this script from the dapp directory."
  exit 1
fi

echo ""
echo "===== Step 1: Fix Jest Configuration ====="

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

echo ""
echo "===== Step 2: Verify CSS Module Type Declarations ====="

# Ensure the types directory exists
mkdir -p src/types

# Check if global.d.ts exists
if [ ! -f "src/types/global.d.ts" ]; then
  echo "Creating src/types/global.d.ts with CSS module declarations..."
  cat > src/types/global.d.ts << 'EOL'
/**
 * Type declarations for CSS modules and other non-standard imports
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

/**
 * Additional declarations for testing and environment variables
 */

// Vite environment variables
interface ImportMeta {
  env: {
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
    SSR: boolean;
    VITE_API_URL?: string;
    VITE_MOCK_DATA?: string;
    VITE_OSINT_PROVIDERS?: string;
    [key: string]: any;
  };
}
EOL
  echo "Created src/types/global.d.ts"
else
  echo "src/types/global.d.ts already exists"
fi

echo ""
echo "===== Step 3: Check for React Hooks Testing Library ====="

if grep -q "@testing-library/react-hooks" package.json; then
  echo "Warning: @testing-library/react-hooks is not compatible with React 18+"
  echo "  Consider removing it and updating tests to use standard React Testing Library:"
  echo "  npm uninstall @testing-library/react-hooks"
else
  echo "@testing-library/react-hooks not found in package.json, good!"
fi

echo ""
echo "===== Step 4: Find ResultsPanel Tests ====="

echo "Searching for ResultsPanel test files..."
RESULTS_PANEL_TESTS=$(find src -name "*ResultsPanel*.test.tsx")

if [ -z "$RESULTS_PANEL_TESTS" ]; then
  echo "No ResultsPanel test files found"
else
  echo "Found ResultsPanel test files:"
  echo "$RESULTS_PANEL_TESTS"
  echo ""
  echo "Please verify that all tests include the panelId prop:"
  echo "  <ResultsPanel data={{ query: 'test query' }} panelId=\"results-panel-1\" />"
fi

echo ""
echo "===== Step 5: Find 'person' type in tests ====="

echo "Searching for 'person' type in test files that should be 'entity'..."
grep -r "type: 'person'" --include="*.test.tsx" src

if [ $? -eq 0 ]; then
  echo "Found 'person' type in tests. These should be updated to 'entity'"
else
  echo "No 'person' type found in tests, good!"
fi

echo ""
echo "===== Completion Summary ====="
echo "1. Jest configuration: Standardized on jest.config.ts"
echo "2. CSS Module declarations: Verified/created in src/types/global.d.ts"
echo "3. React Hooks Testing: Provided information about compatibility"
echo "4. ResultsPanel Tests: Listed files to check for panelId prop"
echo "5. Type Issues: Checked for 'person' type that should be 'entity'"
echo ""
echo "Next steps:"
echo "1. Run tests with: npm test -- --config=jest.config.ts"
echo "2. Update any remaining useOSINTSearch.test.tsx to use React 18 approach"
echo "3. Fix any 'person' type occurrences to use 'entity' instead"
echo "4. Ensure all ResultsPanel tests include the panelId prop"
echo ""
echo "See dapp/docs/project-planning/osint/OSINT-TEST-IMPLEMENTATION-ISSUES.md for details"
