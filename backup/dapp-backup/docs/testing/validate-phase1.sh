#!/bin/bash

# 🔍 PHASE 1 VALIDATION SCRIPT
# Validates the new modular architecture

echo "🎯 PHASE 1 ARCHITECTURE VALIDATION"
echo "=================================="

# Check Security Module Structure
echo "🛡️ Security Module:"
echo "  ├── Types: $(ls -1 security/types/*.ts 2>/dev/null | wc -l) files"
echo "  ├── Core: $(ls -1 security/core/*.ts 2>/dev/null | wc -l) files"
echo "  ├── Storage: $(ls -1 security/storage/*.ts 2>/dev/null | wc -l) files"
echo "  ├── Logging: $(ls -1 security/logging/*.ts 2>/dev/null | wc -l) files"
echo "  └── Context: $(ls -1 security/context/*.ts* 2>/dev/null | wc -l) files"

# Check Communication Module Structure
echo ""
echo "🗣️ Communication Module:"
echo "  ├── Types: $(ls -1 communication/types/*.ts 2>/dev/null | wc -l) files"
echo "  ├── Services: $(ls -1 communication/services/*.ts 2>/dev/null | wc -l) files"
echo "  └── Context: $(ls -1 communication/context/*.ts* 2>/dev/null | wc -l) files"

# Check Legacy Cleanup
echo ""
echo "🧹 Legacy Cleanup Status:"
echo "  ├── Old utils/secure* files: $(ls -1 utils/secure* 2>/dev/null | wc -l) remaining"
echo "  ├── Old context/Auth* files: $(ls -1 context/Auth* 2>/dev/null | wc -l) remaining"
echo "  └── Backup files created: $(ls -1 backup/legacy-utils/ 2>/dev/null | wc -l) files"

# Check Module Exports
echo ""
echo "📦 Module Exports:"
echo "  ├── Security index.ts: $(grep -c "export" security/index.ts 2>/dev/null || echo "0") exports"
echo "  ├── Communication index.ts: $(grep -c "export" communication/index.ts 2>/dev/null || echo "0") exports"
echo "  └── Shared index.ts: $(test -f shared/index.ts && echo "✅ Created" || echo "❌ Missing")"

echo ""
echo "✅ PHASE 1 VALIDATION COMPLETE!"
echo "Ready for Phase 2 implementation 🚀"
