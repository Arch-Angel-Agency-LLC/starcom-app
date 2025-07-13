# Vite Configuration Fixes

## Issue
After restructuring the Starcom app, the development server was showing a white screen after the initial preloader spinner. Vite logs were showing errors related to missing optimized dependency chunks and backup files being scanned.

## Root Causes
1. Vite was scanning HTML files in backup directories, causing optimization conflicts
2. Some dependency chunks were missing or incompatible with the optimizer
3. Wildcard patterns in dependency exclusions were causing errors

## Fixes Applied

### 1. Custom Plugin to Exclude Backup Directories
Added a custom Vite plugin that skips backup directories during the server middleware phase:

```javascript
{
  name: 'exclude-backup-files',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (EXCLUDED_DIRS.some(dir => url.includes(`/${dir}/`))) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        next();
      });
    };
  },
}
```

### 2. Improved Dependency Optimization
- Added more dependencies to the `optimizeDeps.include` array for better compatibility
- Fixed the `exclude` patterns to properly handle problematic modules
- Added specific problem shims to the exclusion list

### 3. Server Configuration
- Set explicit timeouts for HMR (Hot Module Replacement)
- Configured filesystem access to allow only specific directories
- Enabled strict mode for file serving to prevent scanning unwanted directories

### 4. Build Configuration
- Explicitly set the entry point to main index.html to avoid scanning backup HTML files
- Improved asset handling settings

### 5. New Development Scripts
Added a clean development script that:
- Clears the Vite cache
- Forces re-optimization of dependencies
- Uses only the main entry point

## Usage
To run the development server with these fixes:

```bash
npm run dev:clean
```

This script will:
1. Remove the Vite cache directory
2. Start Vite with the `--force` flag to reoptimize dependencies
3. Use only the main index.html as the entry point

## Additional Recommendations
1. Periodically clean the Vite cache if you encounter similar issues
2. Consider moving backup files to a location outside the project directory
3. Maintain the structure described in this document for optimal performance
