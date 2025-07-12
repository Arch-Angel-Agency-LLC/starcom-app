# Starcom App Deployment Debugging Guide

This guide provides information on how to debug deployment-related issues with the Starcom App, especially for assets and 3D models.

## Debugging Tools Available

The Starcom App includes robust debugging utilities specifically designed for production environments like Vercel. These tools provide detailed insights into asset loading, path resolution, and more.

### Accessing Debug Information

#### In the Browser Console

1. Open the browser console (F12 or Right-click → Inspect → Console)
2. Look for console logs prefixed with environment tags like `[PROD]` or `[VERCEL]`
3. All asset loading events, errors, and diagnostic information will be visible here

#### Available Global Debug Objects

The following global objects are available in the browser console:

1. `window.__STARCOM_DEBUG` - Main debugging utility
   ```javascript
   // Run comprehensive diagnostics
   window.__STARCOM_DEBUG.runDiagnostics();
   
   // Get summary of all asset loading attempts
   window.__STARCOM_DEBUG.getAssetLoadingSummary();
   
   // Test if a specific asset URL is accessible
   window.__STARCOM_DEBUG.testFetchAsset('/models/intel_report-01d.glb');
   ```

2. `window.__STARCOM_ASSET_LOADER` - Asset loader utilities
   ```javascript
   // Run asset loader diagnostics
   window.__STARCOM_ASSET_LOADER.runDiagnostics();
   
   // Clear the asset cache
   window.__STARCOM_ASSET_LOADER.clearCache();
   
   // Try to load a model directly
   window.__STARCOM_ASSET_LOADER.loadModel('/models/intel_report-01d.glb')
     .then(model => console.log('Model loaded successfully:', model))
     .catch(err => console.error('Failed to load model:', err));
   ```

## Common Issues and Solutions

### 3D Models Not Loading (404 Errors)

If 3D models are failing to load with 404 errors:

1. **Check model paths**: Models should be in the `/public/models/` directory and referenced with paths like `/models/modelname.glb`

2. **Verify `.vercelignore`**: Make sure your `.vercelignore` file is not excluding model files. It should explicitly not ignore `/public/models/**`

3. **Check browser console**: Look for detailed asset loading errors in the console, which will show:
   - The exact path being requested
   - Network response status
   - Fetch test results
   - Suggested troubleshooting steps

4. **Run diagnostics**: Use `window.__STARCOM_DEBUG.runDiagnostics()` in the browser console to run comprehensive tests that will check multiple possible model paths

### Debugging Asset Paths

If assets are loading correctly in development but not in production:

1. The console will show path resolution logs that display:
   - Original path (what your code requested)
   - Resolved path (actual URL used for fetch)
   - Fetch test results

2. Common path issues:
   - Using relative paths (`./assets/model.glb`) instead of absolute paths (`/assets/model.glb`)
   - Referencing assets in `/src` that aren't properly handled by the build process
   - Using paths that work in development but not in production

### Network and CORS Issues

If you see CORS errors or network issues:

1. The debugging utilities will test URL accessibility and show detailed network responses
2. Look for logs with the 🌐 NETWORK category in the console

## How to Debug Asset Loading in Production

1. Deploy the app to Vercel
2. Open the deployed app in your browser
3. Open the browser console
4. Look for automatic diagnostics that run on page load
5. Use `window.__STARCOM_DEBUG.runDiagnostics()` for additional tests
6. Check the console for any red error messages
7. For 3D model issues, focus on logs with the 📦 3D MODEL LOADING prefix

## Reporting Issues

When reporting deployment issues, please include:

1. Screenshots of any console errors
2. Output of `window.__STARCOM_DEBUG.runDiagnostics()`
3. Output of `window.__STARCOM_DEBUG.getAssetLoadingSummary()`
4. URL of the deployed application
5. Browser and device information

This information will help us quickly diagnose and fix deployment-related issues.
