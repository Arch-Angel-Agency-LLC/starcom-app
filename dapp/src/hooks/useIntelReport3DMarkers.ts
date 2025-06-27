// src/hooks/useIntelReport3DMarkers.ts
// Hook for managing Intel Report 3D markers in the Globe

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

// Use relative path to public assets - works in both dev and production
const INTEL_REPORT_MODEL_URL = '/models/intel_report-01d.glb';

interface UseIntelReport3DMarkersOptions {
  globeRadius?: number;
  hoverAltitude?: number;
  rotationSpeed?: number;
  scale?: number;
}

interface ModelInstance {
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  hoverOffset: number;
}

export const useIntelReport3DMarkers = (
  reports: IntelReportOverlayMarker[],
  scene: THREE.Scene | null,
  options: UseIntelReport3DMarkersOptions = {}
) => {
  const {
    globeRadius = 100,
    hoverAltitude = 5,
    rotationSpeed = 0.01,
    scale = 1
  } = options;

  const [models, setModels] = useState<ModelInstance[]>([]);
  const [gltfModel, setGltfModel] = useState<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number>();
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  // Load the GLB model once
  useEffect(() => {
    const loader = new GLTFLoader();
    
    loader.load(
      INTEL_REPORT_MODEL_URL,
      (gltf) => {
        const model = gltf.scene.clone();
        model.scale.setScalar(scale);
        model.rotation.set(0, 0, 0);
        setGltfModel(model);
        console.log('Intel Report 3D model loaded successfully');
      },
      undefined,
      (error) => {
        console.error('Error loading Intel Report 3D model:', error);
        
        // Fallback: Create a simple geometric marker
        const fallbackGeometry = new THREE.ConeGeometry(1, 3, 8);
        const fallbackMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xff6b35,
          transparent: true,
          opacity: 0.8
        });
        const fallbackModel = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        fallbackModel.scale.setScalar(scale);
        setGltfModel(fallbackModel);
      }
    );
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
        groupRef.current.remove(model.mesh);
      });
      return [];
    });

    if (!gltfModel || !reports.length) {
      return;
    }

    const newModels: ModelInstance[] = reports.map((report) => {
      const mesh = gltfModel.clone();
      
      const basePosition = latLngToVector3(
        report.latitude, 
        report.longitude, 
        globeRadius + hoverAltitude
      );
      
      mesh.position.copy(basePosition);
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      mesh.rotateX(Math.PI);
      
      groupRef.current.add(mesh);
      
      return {
        mesh,
        report,
        basePosition: basePosition.clone(),
        hoverOffset: Math.random() * Math.PI * 2
      };
    });

    setModels(newModels);
  }, [gltfModel, reports, globeRadius, hoverAltitude]);

  // Animation loop
  useEffect(() => {
    if (!models.length) return;

    const animate = () => {
      const time = Date.now() * 0.001;

      models.forEach((model) => {
        // Rotate while maintaining relative orientation
        model.mesh.rotateY(rotationSpeed);
        
        // Hovering animation
        const hoverAmount = Math.sin(time * 2 + model.hoverOffset) * 0.2;
        const direction = model.basePosition.clone().normalize();
        model.mesh.position.copy(
          model.basePosition.clone().add(direction.multiplyScalar(hoverAmount))
        );
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [models, rotationSpeed]);

  return {
    group: groupRef.current,
    models,
    isLoaded: !!gltfModel
  };
};
