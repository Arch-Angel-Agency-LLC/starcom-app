#!/bin/bash

# test-netrunner-tools.sh
# Test script for the NetRunner tools implementation

echo "============================================================"
echo "NetRunner Power Tools Test Script"
echo "============================================================"
echo

# Check if TypeScript files exist
echo "Checking TypeScript files..."
FILES=(
  "src/pages/NetRunner/tools/NetRunnerPowerTools.ts"
  "src/pages/NetRunner/tools/adapters/BaseAdapter.ts"
  "src/pages/NetRunner/tools/adapters/ShodanAdapter.ts"
  "src/pages/NetRunner/tools/adapters/AdapterRegistry.ts"
  "src/pages/NetRunner/hooks/useToolExecution.ts"
  "src/pages/NetRunner/components/ToolExecutionPanel.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file not found"
  fi
done

# TypeScript check
echo
echo "Running TypeScript check for specific files..."
npx tsc --noEmit --jsx react-jsx --esModuleInterop --skipLibCheck \
  src/pages/NetRunner/tools/NetRunnerPowerTools.ts \
  src/pages/NetRunner/tools/adapters/BaseAdapter.ts \
  src/pages/NetRunner/tools/adapters/ShodanAdapter.ts \
  src/pages/NetRunner/tools/adapters/AdapterRegistry.ts \
  src/pages/NetRunner/hooks/useToolExecution.ts \
  src/pages/NetRunner/components/ToolExecutionPanel.tsx

if [ $? -eq 0 ]; then
  echo "✅ TypeScript check passed"
else
  echo "❌ TypeScript check failed"
fi

echo
echo "============================================================"
echo "NetRunner Power Tools Test Complete"
echo "============================================================"
