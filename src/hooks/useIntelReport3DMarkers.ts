// src/hooks/useIntelReport3DMarkers.ts
// Hook for managing Intel Report 3D markers in the Globe

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import { assetLoader } from '../utils/assetLoader';

// Import GLB asset using Vite's asset handling for static deployment compatibility
import intelReportModelUrl from '../assets/models/intel_report-01d.glb?url';

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

  // Load the GLB model once using robust asset loader
  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = await assetLoader.loadModel(intelReportModelUrl, {
          scale,
          fallbackColor: 0xff6b35,
          fallbackGeometry: 'cone',
          retryCount: 3,
          timeout: 15000
        });
        
        setGltfModel(model);
        console.log('Intel Report 3D model loaded successfully');
      } catch (error) {
        console.error('Error loading Intel Report 3D model:', error);
      }
    };

    loadModel();
  }, [scale]);

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
