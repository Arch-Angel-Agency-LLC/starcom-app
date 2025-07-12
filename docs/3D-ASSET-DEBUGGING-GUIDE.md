# 3D Asset Debugging and Troubleshooting Guide

This guide explains how to use the enhanced debugging utilities to diagnose and fix issues with 3D models and other assets, particularly in production Vercel deployments.

## Comprehensive Debugging Features

The Starcom app now includes super-charged debugging that gives maximum visibility into every aspect of asset loading, including 3D models.

### Automatic Diagnostics in Production

When the app is deployed to Vercel, comprehensive diagnostics will automatically run and log detailed information to the console about:

- All asset loading attempts
- Network status for each asset
- Detailed error information for any failed assets
- Suggestions for fixing 404 and other common errors
- Alternative paths that have been tested
- MIME type and content information
- Vercel-specific configuration suggestions

### Console Debugging Utilities

The app exposes a global object in the browser console that provides direct access to all debugging utilities:

```javascript
// Run comprehensive diagnostics
window.__STARCOM_DEBUG_UTILS.runComprehensiveDiagnostics();

// Test a specific model URL
window.__STARCOM_DEBUG_UTILS.runModelChecks('/models/intel_report-01d.glb');

// Get a summary of all asset load attempts
console.table(window.__STARCOM_DEBUG_UTILS.getAssetLoadAttempts());

// Test if a URL is accessible
window.__STARCOM_DEBUG_UTILS.testUrlAccessibility('/path/to/asset.glb', 'Description');
```

## Troubleshooting 404 Errors for 3D Models

If you're seeing 404 errors for 3D models in production, the enhanced debugging will:

1. Log a prominent error message in the console
2. Test alternative paths automatically
3. Provide specific troubleshooting suggestions for Vercel deployments
4. Show expected MIME types and other configuration details

### Key Information to Look For

When troubleshooting 3D model loading issues, look for console messages with these categories:

- `📦 3D MODEL LOADING` - Details about model loading attempts
- `🔍 FILE RESOLUTION` - Information about file paths and alternatives
- `🌐 NETWORK` - Network request results
- `📄 MIME TYPES` - MIME type configuration information
- `❌ ERRORS` - Detailed error information

### Common Fixes for 404 Errors

Based on diagnostic information, common fixes include:

1. **Path Issues**:
   - Ensure models are in `/public/models/` directory
   - Reference them with absolute paths like `/models/modelname.glb`
   - Check for case sensitivity in filenames

2. **Vercel Configuration**:
   - Check `.vercelignore` file to ensure models aren't excluded
   - Add a `vercel.json` file with proper MIME type configuration
   - Ensure model files are committed to the repository

3. **Build Process**:
   - Verify models are included in the build process
   - Check build logs for any warnings about assets

## Detailed Diagnostic Information

The enhanced debugging now tracks detailed information for each asset:

- Registration time and context
- All loading attempts with timing
- Retry count and success/failure status
- Alternative paths that were checked
- HTTP response codes and headers
- Content-Type and size information
- Stack traces showing where loading was initiated

## Example: Debugging a 404 Error

When a 3D model fails with a 404 error, you'll see console output like:

```
[PROD][VERCEL] [v3d-assets-debugging-1.0] 🚨 CRITICAL: FILE NOT FOUND (404) - /models/intel_report-01d.glb

Suggested alternative paths:
- /public/models/intel_report-01d.glb
- /assets/models/intel_report-01d.glb
- /src/assets/models/intel_report-01d.glb
- /assets/3d/intel_report-01d.glb
- /public/assets/models/intel_report-01d.glb

Troubleshooting suggestions:
- Check if the file exists at the specified path
- Verify the URL is correct and accessible
- Ensure 3D models are in the /public/models/ directory
- Check that the model file is not excluded by .vercelignore
- Try referencing the model with an absolute path from root
- Verify the model file permissions
- Check for case sensitivity issues in the filename
- Inspect .vercelignore file to ensure assets are not excluded
- Check Vercel build logs to see if files were deployed
- Verify the path is correct for Vercel's directory structure
```

This detailed information helps quickly identify and fix the issue without guesswork.

## Vercel Deployment Best Practices

For reliable 3D model loading in Vercel deployments:

1. Place 3D models in `/public/models/` directory
2. Reference them with absolute paths: `/models/modelname.glb`
3. Add a `vercel.json` file with proper MIME type configuration:
   ```json
   {
     "headers": [
       {
         "source": "/(.*).glb",
         "headers": [
           { "key": "Content-Type", "value": "model/gltf-binary" }
         ]
       }
     ]
   }
   ```
4. Update `.vercelignore` to ensure models aren't excluded:
   ```
   # Exclude everything by default
   *
   
   # But include these specific directories
   !public/
   !public/models/
   !public/assets/
   ```

## Manual Testing in Console

To manually test a model that's failing to load:

```javascript
// Test a specific model
window.__STARCOM_DEBUG_UTILS.runModelChecks('/models/intel_report-01d.glb');

// Test URL accessibility directly
window.__STARCOM_DEBUG_UTILS.testUrlAccessibility('/models/intel_report-01d.glb', 'Intel Report Model');

// Get suggestions for alternative paths
console.log(window.__STARCOM_DEBUG_UTILS.getSuggestedAlternativePaths('/models/intel_report-01d.glb'));

// Get detailed troubleshooting suggestions
console.log(window.__STARCOM_DEBUG_UTILS.getTroubleshootingSuggestions('/models/intel_report-01d.glb'));
```

This allows for interactive debugging directly in the browser console.

## Environment Information

The diagnostics also log detailed environment information to help identify deployment-specific issues:

- Vercel deployment URL and hostname
- Browser and device information
- Memory usage and performance metrics
- Screen dimensions and device pixel ratio
- Build version and timestamp

This comprehensive information makes it easier to diagnose issues that only appear in specific environments.
