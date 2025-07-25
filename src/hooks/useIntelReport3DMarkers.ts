// src/hooks/useIntelReport3DMarkers.ts
// Hook for managing Intel Report 3D markers in the Globe

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import { assetLoader } from '../utils/assetLoader';
import DeploymentDebugger from '../utils/deploymentDebugger';

// Import GLB asset using Vite's asset handling for static deployment compatibility
import intelReportModelUrl from '../assets/models/intel_report-01d.glb?url';

// Log the GLB URL resolution for debugging
DeploymentDebugger.pathResolution(
  intelReportModelUrl,
  intelReportModelUrl, // With Vite imports, this is already the resolved URL
  'Intel Report 3D Model'
);

// Run comprehensive diagnostics in production (Vercel)
if (import.meta.env.PROD) {
  // Wait for DOM to be ready
  window.addEventListener('DOMContentLoaded', () => {
    DeploymentDebugger.runComprehensiveDiagnostics(intelReportModelUrl);
  });
}

// Default scale constant for Intel Report models
const DEFAULT_INTEL_REPORT_SCALE = 4.0; // Make models visible and interactive

interface UseIntelReport3DMarkersOptions {
  globeRadius?: number;
  hoverAltitude?: number;
  rotationSpeed?: number;
  scale?: number;
}

interface ModelInstance {
  positionContainer: THREE.Group;   // Positioned on globe surface
  orientationContainer: THREE.Group; // Handles world/camera orientation
  rotationContainer: THREE.Group;   // Handles local rotation animation
  mesh: THREE.Object3D;             // The actual model
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  hoverOffset: number;
  localRotationY: number;
}

export const useIntelReport3DMarkers = (
  reports: IntelReportOverlayMarker[],
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  globeObject: THREE.Object3D | null,
  options: UseIntelReport3DMarkersOptions = {},
  hoveredReportId?: string | null // Add hover state parameter
) => {
  const {
    globeRadius = 100,
    hoverAltitude = 5,
    rotationSpeed = 0.01,
    scale = DEFAULT_INTEL_REPORT_SCALE // Use our constant as default
  } = options;

  const [models, setModels] = useState<ModelInstance[]>([]);
  const [gltfModel, setGltfModel] = useState<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number>();
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  // Load the GLB model once using robust asset loader with proper memoization
  useEffect(() => {
    // Prevent loading if model is already loaded or loading in progress
    if (gltfModel) {
      return;
    }

    let cancelled = false;
    
    const loadModel = async () => {
      // Log the model loading attempt with the debugging utility
      if (!gltfModel) {
        console.log('🔄 Loading Intel Report 3D model (once)...');
        DeploymentDebugger.assetLoading(
          intelReportModelUrl,
          '3D GLB Model',
          'loading',
          undefined,
          { scale, useCase: 'Intel Report Markers', loadAttempt: Date.now() }
        );
      }
      
      try {
        // Explicitly log the absolute URL
        const absoluteUrl = new URL(intelReportModelUrl, window.location.origin).href;
        DeploymentDebugger.log(
          `Attempting to load 3D model from: ${intelReportModelUrl} (resolved as ${absoluteUrl})`,
          { modelUrl: intelReportModelUrl, absoluteUrl },
          { category: DeploymentDebugger.categories.MODEL_LOADING }
        );
        
        // Try to fetch the model URL directly to verify it exists
        try {
          await DeploymentDebugger.testUrlAccessibility(intelReportModelUrl, 'Intel Report 3D Model');
        } catch (fetchError) {
          DeploymentDebugger.log(
            'Direct fetch test failed for model URL. Will still attempt to load through Three.js',
            { fetchError },
            { category: DeploymentDebugger.categories.ERRORS, level: 'warn' }
          );
        }
        
        if (cancelled) return;
        
        const model = await assetLoader.loadModel(intelReportModelUrl, {
          scale,
          fallbackColor: 0xff6b35,
          fallbackGeometry: 'cone',
          retryCount: 2, // Reduced from 3 to 2
          timeout: 10000 // Reduced from 15000 to 10000
        });
        
        if (cancelled) return;
        
        setGltfModel(model);
        
        // Log success
        DeploymentDebugger.assetLoading(
          intelReportModelUrl,
          '3D GLB Model',
          'success',
          undefined,
          { scale, modelDetails: { uuid: model?.uuid } }
        );
        
        DeploymentDebugger.log(
          'Intel Report 3D model loaded successfully',
          { model },
          { category: DeploymentDebugger.categories.MODEL_LOADING }
        );
        
        console.log('Intel Report 3D model loaded successfully');
      } catch (error) {
        // Log detailed error information
        DeploymentDebugger.assetLoading(
          intelReportModelUrl,
          '3D GLB Model',
          'error',
          error,
          { scale, failureDetails: { attempt: 'primary' } }
        );
        
        DeploymentDebugger.log(
          'Error loading Intel Report 3D model',
          { error, modelUrl: intelReportModelUrl },
          { category: DeploymentDebugger.categories.ERRORS, level: 'error' }
        );
        
        console.error('Error loading Intel Report 3D model:', error);
        
        // Provide fallback suggestions in the console
        DeploymentDebugger.log(
          '🔍 GLB Model Loading Troubleshooting Guide',
          {
            suggestions: [
              '1. Verify the model file exists in the public/models directory',
              '2. Check that the file name and extension are correct (case sensitive)',
              '3. Make sure the path in vercelignore is not excluding this file',
              '4. Try moving the GLB file to /public at the root level',
              '5. Check network tab for 404 errors on the GLB file',
              '6. Verify MIME types configuration in Vercel for .glb files',
            ],
            possiblePaths: [
              '/models/intel_report-01d.glb',
              '/public/models/intel_report-01d.glb',
              '/assets/models/intel_report-01d.glb',
              '/src/assets/models/intel_report-01d.glb',
            ]
          },
          { 
            category: DeploymentDebugger.categories.ERRORS, 
            level: 'error',
            expanded: true
          }
        );
      }
    };

    loadModel();
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - load model only once per component lifecycle

  // Convert lat/lng to 3D position on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  };

  // Add group to scene
  useEffect(() => {
    if (!scene) return;
    
    const group = groupRef.current;
    scene.add(group);
    
    return () => {
      scene.remove(group);
    };
  }, [scene]);

  // Create model instances for each Intel Report
  useEffect(() => {
    // Clear existing models first
    setModels(prevModels => {
      prevModels.forEach(model => {
        groupRef.current.remove(model.positionContainer);
      });
      return [];
    });

    if (!gltfModel || !reports.length) {
      return;
    }

    const newModels: ModelInstance[] = reports.map((report) => {
      const mesh = gltfModel.clone();
      
      // Create nested container hierarchy for proper 3D math
      const positionContainer = new THREE.Group();      // Level 1: Position on globe
      const orientationContainer = new THREE.Group();   // Level 2: World/camera orientation
      const rotationContainer = new THREE.Group();      // Level 3: Local rotation animation
      
      const basePosition = latLngToVector3(
        report.latitude, 
        report.longitude, 
        globeRadius + hoverAltitude
      );
      
      // Set up hierarchy: position → orientation → rotation → mesh
      positionContainer.position.copy(basePosition);
      positionContainer.add(orientationContainer);
      
      orientationContainer.add(rotationContainer);
      
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      rotationContainer.add(mesh);
      
      groupRef.current.add(positionContainer);
      
      return {
        positionContainer,
        orientationContainer,
        rotationContainer,
        mesh,
        report,
        basePosition: basePosition.clone(),
        hoverOffset: Math.random() * Math.PI * 2,
        localRotationY: 0
      };
    });

    setModels(newModels);
  }, [gltfModel, reports, globeRadius, hoverAltitude]);

  // Animation loop
  useEffect(() => {
    if (!models.length || !camera || !scene) return;

    const animate = () => {
      const time = Date.now() * 0.001;

      // Find the globe mesh to track its rotation
      let globeMesh: THREE.Object3D | null = null;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && 
            child.geometry instanceof THREE.SphereGeometry) {
          globeMesh = child;
          return false; // Stop traversing once found
        }
      });

      models.forEach((model) => {
        // Level 1: Position animation - hovering on globe surface
        // The position should follow the globe's rotation (stay attached to surface)
        const hoverAmount = Math.sin(time * 2 + model.hoverOffset) * 0.2;
        
        // Calculate the base position for this lat/lng
        const currentPosition = latLngToVector3(
          model.report.latitude,
          model.report.longitude,
          globeRadius + hoverAltitude + hoverAmount
        );
        
        // If we found the globe mesh, apply its current rotation to the position
        if (globeMesh) {
          globeMesh.updateMatrixWorld(true);
          currentPosition.applyMatrix4(globeMesh.matrixWorld);
        }
        
        model.positionContainer.position.copy(currentPosition);
        
        // Level 2: Screen-Aligned Billboard - Common UI pattern for 3D markers
        // This makes models always appear upright relative to the screen/camera view
        
        if (camera) {
          // Method 1: Screen-Aligned Billboard (most common for UI elements)
          // This aligns the model with the camera's coordinate system
          model.orientationContainer.rotation.copy(camera.rotation);
          
          // Alternative Method 2: Y-Axis Billboard (uncomment to try)
          // const cameraPosition = new THREE.Vector3();
          // camera.getWorldPosition(cameraPosition);
          // const modelPosition = new THREE.Vector3();
          // model.positionContainer.getWorldPosition(modelPosition);
          // const direction = new THREE.Vector3().subVectors(cameraPosition, modelPosition);
          // direction.y = 0; // Keep upright
          // direction.normalize();
          // const angle = Math.atan2(direction.x, direction.z);
          // model.orientationContainer.rotation.set(0, angle, 0);
          
        } else {
          // Fallback: no rotation
          model.orientationContainer.rotation.set(0, 0, 0);
        }
        
        // Level 3: Local rotation animation - smooth Y-axis spin
        model.localRotationY += rotationSpeed;
        model.rotationContainer.rotation.y = model.localRotationY;
        
        // Level 4: Hover animation - scale and glow effects
        const isHovered = hoveredReportId === model.report.pubkey;
        const baseScale = scale; // Use the base scale from options
        const targetScale = isHovered ? baseScale * 1.05 : baseScale; // 5% larger when hovered
        const currentScale = model.mesh.scale.x;
        const scaleLerpSpeed = 0.1;
        
        // Smooth scaling animation
        const newScale = currentScale + (targetScale - currentScale) * scaleLerpSpeed;
        model.mesh.scale.setScalar(newScale);
        
        // Apply glow effect to mesh materials
        model.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material as THREE.MeshStandardMaterial;
            if (material.emissive) {
              if (isHovered) {
                material.emissive.setHex(0x00ffff); // Cyan glow
                material.emissiveIntensity = 0.2;
              } else {
                material.emissive.setHex(0x000000);
                material.emissiveIntensity = 0;
              }
            }
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [models, camera, scene, rotationSpeed, globeRadius, hoverAltitude, hoveredReportId, scale]);

  return {
    group: groupRef.current,
    models,
    isLoaded: !!gltfModel
  };
};
