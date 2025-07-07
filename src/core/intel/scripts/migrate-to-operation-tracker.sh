#!/bin/bash
# Migration script to replace performanceOptimizationManager with operationTracker
# in the StorageOrchestrator.ts file

# Set path to the file
FILE="/Users/jono/Documents/GitHub/starcom-app/src/core/intel/storage/storageOrchestrator.ts"

# Check if the file exists
if [ ! -f "$FILE" ]; then
  echo "Error: File $FILE not found"
  exit 1
fi

# Create a backup
cp "$FILE" "${FILE}.bak"
echo "Created backup at ${FILE}.bak"

# Update imports
sed -i '' 's/import { performanceOptimizationManager, QueryOptimizationSuggestion } from '\''\.\/performanceOptimizationManager'\'';/import { operationTracker, QueryOptimizationSuggestion } from '\''\.\.\/performance\/operationTracker'\'';/' "$FILE"

# Replace all method calls
sed -i '' 's/performanceOptimizationManager\.startOperation/operationTracker.startOperation/g' "$FILE"
sed -i '' 's/performanceOptimizationManager\.trackEntityAccess/operationTracker.trackEntityAccess/g' "$FILE"
sed -i '' 's/performanceOptimizationManager\.endOperation/operationTracker.endOperation/g' "$FILE"
sed -i '' 's/performanceOptimizationManager\.optimizeQuery/operationTracker.optimizeQuery/g' "$FILE"

echo "Migration completed successfully"
echo "Please review the changes and run your tests to ensure everything works correctly"
