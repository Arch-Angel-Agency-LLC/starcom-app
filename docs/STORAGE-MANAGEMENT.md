# Storage Management Guide

## Overview

This guide covers storage management and cleanup procedures for the Starcom dApp to prevent data bloat and maintain optimal performance.

## Storage Monitoring

### Quick Check
```bash
npm run storage-check
```

This command monitors key directories and provides warnings when storage limits are exceeded.

### Monitored Directories
- **NOAA Data**: `technical_reference_code_samples/NOAA_directory_scan/noaa_data/` (Warning: >20MB)
- **Build Cache**: `cache/` (Warning: >100MB)
- **Distribution**: `dist/` (Warning: >50MB)
- **Rust Target**: `target/` (Warning: >100MB, Auto-warning for GB range)
- **Node Modules**: `node_modules/` (Warning: >500MB)

## Cleanup Commands

### Individual Cleanup
```bash
# Clean NOAA data files (JSON accumulation)
npm run cleanup

# Clean Rust build cache (can be several GB)
npm run cleanup:rust

# Clean all (comprehensive cleanup)
npm run cleanup:all
```

### Manual Cleanup
```bash
# Remove specific file types
rm -f technical_reference_code_samples/NOAA_directory_scan/noaa_data/*.json

# Force clean Rust cache
cargo clean

# Reset node_modules if corrupted
rm -rf node_modules && npm install
```

## Common Storage Issues

### Rust Build Cache Bloat
**Symptoms**: 
- `target/` directory >1GB
- Slow build times
- Disk space warnings

**Solution**:
```bash
npm run cleanup:rust
```

**Prevention**: Run cleanup monthly or when switching between major features.

### NOAA Data Accumulation
**Symptoms**:
- Many `.json` files in NOAA directory
- Storage warnings for NOAA path

**Solution**:
```bash
npm run cleanup
```

**Prevention**: Automated cleanup runs with `cleanup:all`.

### Browser Storage
**Management**: Automatically managed by `browserStorageManager.ts`
- 2MB limit enforced
- Auto-cleanup of old data
- No manual intervention needed

## Monitoring Integration

### Development Workflow
1. Run `npm run storage-check` weekly
2. Use `npm run cleanup:all` monthly
3. Monitor warnings during builds

### CI/CD Integration (Optional)
Add to workflow:
```yaml
- name: Storage Check
  run: npm run storage-check
  
- name: Cleanup if needed
  run: npm run cleanup:all
```

## Advanced Management

### Custom Thresholds
Edit `scripts/storage-monitor.mjs` to adjust warning thresholds:
```javascript
getDirectoryStats(NOAA_DATA_DIR, 20),    // 20MB warning
getDirectoryStats(CACHE_DIR, 100),       // 100MB warning
getDirectoryStats(DIST_DIR, 50),         // 50MB warning
getDirectoryStats(TARGET_DIR, 100),      // 100MB warning (GB auto-warning)
```

### Storage Hooks
The `useStorageMonitoring` hook provides real-time browser storage monitoring in the application.

## Troubleshooting

### "Storage full" warnings
1. Run `npm run storage-check` to identify the source
2. Follow specific cleanup recommendations
3. Run `npm run cleanup:all` for comprehensive cleanup

### Build performance issues
1. Check if `target/` directory exists and is large
2. Run `npm run cleanup:rust`
3. Restart development server

### Deployment size issues
1. Ensure `npm run cleanup:all` was run before build
2. Check `dist/` directory size
3. Verify tree-shaking is working properly

## Best Practices

1. **Regular Monitoring**: Use `npm run storage-check` in your weekly routine
2. **Proactive Cleanup**: Don't wait for warnings - cleanup monthly
3. **Build Hygiene**: Clean before major deployments
4. **Documentation**: Keep this guide updated with new storage patterns

## Storage Architecture

### Persistent Storage Types
- **Browser Storage**: Session/Local storage (auto-managed, 2MB limit)
- **IPFS Cache**: Distributed storage cache (minimal local footprint)
- **Build Artifacts**: Temporary build files (cleaned regularly)
- **Development Cache**: Hot reload and build optimization cache

### Non-Persistent Storage
- **Memory Cache**: Runtime caches (auto-cleaned on restart)
- **Network Cache**: HTTP/API response caching (browser-managed)
- **Temporary Files**: Build-time temporary files (auto-cleaned)

---

*Last Updated: July 2025*  
*Part of Earth Alliance operational security protocols*
