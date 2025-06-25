// src/components/Globe/Features/IntelReport3DMarker/IntelReport3DMarker.tsx
// 3D Intel Report visualization component for Globe
// Renders GLB models at lat/lng coordinates with hovering animation and rotation

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IntelReportOverlayMarker } from '../../../../interfaces/IntelReportOverlay';

// Use relative path to public assets - works in both dev and production
const INTEL_REPORT_MODEL_URL = '/models/intel_report-01d.glb';

interface IntelReport3DMarkerProps {
  reports: IntelReportOverlayMarker[];
  globeRadius?: number;
  hoverAltitude?: number;
  rotationSpeed?: number;
  scale?: number;
  onMarkerClick?: (report: IntelReportOverlayMarker) => void;
  onMarkerHover?: (report: IntelReportOverlayMarker | null) => void;
}

interface ModelInstance {
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  animationMixer?: THREE.AnimationMixer;
  hoverOffset: number;
}

const IntelReport3DMarker: React.FC<IntelReport3DMarkerProps> = ({
  reports,
  globeRadius = 100,
  hoverAltitude = 5,
  rotationSpeed = 0.01,
  scale = 1,
  onMarkerClick
  // onMarkerHover // TODO: Implement hover functionality
}) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const [models, setModels] = useState<ModelInstance[]>([]);
  const [gltfModel, setGltfModel] = useState<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number>();    // Load the GLB model once
    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        INTEL_REPORT_MODEL_URL,
      (gltf) => {
        const model = gltf.scene.clone();
        
        // Scale the model to appropriate size
        model.scale.setScalar(scale);
        
        // Ensure the model is facing the correct direction
        model.rotation.set(0, 0, 0);
        
        setGltfModel(model);
        console.log('Intel Report 3D model loaded successfully');
      },
      (progress) => {
        console.log('Loading Intel Report model:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading Intel Report 3D model:', error);
        
        // Fallback: Create a simple geometric marker if GLB fails to load
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

  // Create model instances for each Intel Report
  useEffect(() => {
    if (!gltfModel || !reports.length) {
      setModels([]);
      return;
    }

    const group = groupRef.current;

    const newModels: ModelInstance[] = reports.map((report) => {
      // Clone the loaded model
      const mesh = gltfModel.clone();
      
      // Calculate position on globe surface
      const basePosition = latLngToVector3(
        report.latitude, 
        report.longitude, 
        globeRadius + hoverAltitude
      );
      
      // Position the model
      mesh.position.copy(basePosition);
      
      // Make model face outward from globe center
      mesh.lookAt(new THREE.Vector3(0, 0, 0));
      mesh.rotateX(Math.PI); // Flip to face outward correctly
      
      // Add to group
      group.add(mesh);
      
      return {
        mesh,
        report,
        basePosition: basePosition.clone(),
        hoverOffset: Math.random() * Math.PI * 2 // Random phase for hover animation
      };
    });

    setModels(newModels);

    // Cleanup function
    return () => {
      newModels.forEach(model => {
        group.remove(model.mesh);
      });
    };
  }, [gltfModel, reports, globeRadius, hoverAltitude]);

  // Animation loop
  useEffect(() => {
    if (!models.length) return;

    const animate = () => {
      const time = Date.now() * 0.001;

      models.forEach((model) => {
        // Rotate the model while maintaining relative orientation to camera horizon
        model.mesh.rotateY(rotationSpeed);
        
        // Add subtle hovering animation
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

  // Handle click events (if needed for future interactivity)
  useEffect(() => {
    if (!onMarkerClick) return;

    // This would need to be integrated with the Globe's click handling system
    // For now, we'll set up the foundation
  }, [onMarkerClick]);

  // Return the group - this will be added to the Globe's scene
  return null; // This component manages Three.js objects directly
};

export default IntelReport3DMarker;
