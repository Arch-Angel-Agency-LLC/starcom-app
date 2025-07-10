# 3D Asset Deployment Guide for Starcom App

## Best Practices for 3D Model Loading

After extensive troubleshooting, we've established these critical best practices for 3D model loading in Vite/React applications:

1. **Use Vite's Asset Imports with `?url` Suffix**: Always import 3D models using Vite's asset URL system:
   ```typescript
   // CORRECT WAY:
   import modelUrl from '../assets/models/your-model.glb?url';
   ```

2. **Avoid Direct Path Strings**: Never use direct string paths to reference models:
   ```typescript
   // INCORRECT WAY:
   const modelUrl = '/models/your-model.glb'; // AVOID THIS
   ```

3. **Consistent Import Pattern**: Use the same import method across your entire codebase.

4. **Place Models in `/src/assets/models/`**: This directory works best with Vite's asset handling system.

## Resolving 3D Model Loading Issues

If you encounter 404 errors or other loading issues with 3D models:

1. **Check Import Method**: Ensure all component files use the `?url` suffix import method.
2. **Verify File Location**: Confirm the model exists in `/src/assets/models/`.
3. **Update References**: Make sure all references to the model use the same import pattern.
4. **Rebuild and Test**: Always rebuild the application after changing asset import methods.

## Vercel Deployment Considerations

When deploying to Vercel:

1. **Verify .vercelignore**: Ensure your `.vercelignore` file does not exclude 3D assets.
2. **MIME Type Configuration**: Add a `vercel.json` file to ensure proper MIME types:
   ```json
   {
     "headers": [
       {
         "source": "/(.*).glb",
         "headers": [
           { "key": "Content-Type", "value": "model/gltf-binary" }
         ]
       },
       {
         "source": "/(.*).gltf",
         "headers": [
           { "key": "Content-Type", "value": "model/gltf+json" }
         ]
       }
     ]
   }
   ```

## Detailed Implementation Guide

### 1. File Organization

```
src/
└── assets/
    └── models/
        └── your-model.glb
```

### 2. Import and Use Models in Components

```typescript
// In your component file
import React, { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Import using Vite's asset URL system
import modelUrl from '../../../assets/models/your-model.glb?url';

function Your3DComponent() {
  useEffect(() => {
    const loader = new GLTFLoader();
    
    // Use the imported URL directly
    loader.load(modelUrl, (gltf) => {
      // Model loaded successfully
      console.log('Model loaded:', gltf);
      // Add to scene, etc.
    });
  }, []);
  
  return <div id="model-container"></div>;
}
```

### 3. Using Asset Loader Utility

If using our custom `assetLoader` utility:

```typescript
import { assetLoader } from '../utils/assetLoader';
import modelUrl from '../assets/models/your-model.glb?url';

// Later in your code:
const model = await assetLoader.loadModel(modelUrl, {
  scale: 1.0,
  fallbackColor: 0xff6b35,
  fallbackGeometry: 'cone',
  retryCount: 3,
  timeout: 15000
});
```

## Debugging and Troubleshooting

For detailed troubleshooting and debugging, see the [3D Asset Debugging Guide](./3D-ASSET-DEBUGGING-GUIDE.md).

### Common Issues and Solutions

1. **404 Not Found Errors**
   - Check that the model file exists in the correct location
   - Verify that the import path is correct
   - Ensure the model is not excluded by `.vercelignore`

2. **MIME Type Errors**
   - Add MIME type configuration to `vercel.json`
   - Check Content-Type headers in network responses

3. **Mixed Import Methods**
   - Standardize on the `?url` suffix import method
   - Update all components that reference the model

4. **Corrupt or Invalid GLB Files**
   - Re-export the model from your 3D software
   - Check the file for corruption (look for header validation errors)
   - Ensure textures are properly embedded

## Model Optimization Guidelines

For optimal performance:

1. **Reduce Polygon Count**: Keep models under 50,000 polygons where possible
2. **Optimize Textures**: Use compressed texture formats and appropriate sizes
3. **Minimize Draw Calls**: Combine meshes where appropriate
4. **Use Draco Compression**: Consider using Draco compression for larger models
5. **Properly Size Models**: Keep file sizes under 5MB for faster loading

## Testing Protocol

Before deploying:

1. Test model loading in development environment
2. Perform a production build and test locally
3. Deploy to a staging environment
4. Check browser console for any warnings or errors
5. Verify models appear correctly on different devices and browsers

---

This guide reflects best practices established after extensive debugging and testing of 3D model loading issues in the Starcom App. Following these guidelines will ensure consistent asset loading across development and production environments.
