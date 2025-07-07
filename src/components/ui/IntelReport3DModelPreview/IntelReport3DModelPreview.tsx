/**
 * IntelReport3DModelPreview - Mini 3D model component for tooltips and popups
 * 
 * This component renders a small, animated 3D model representing an Intel Report
 * that can be embedded in UI components like tooltips and popups.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

interface IntelReport3DModelPreviewProps {
  report: IntelReportOverlayMarker;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const IntelReport3DModelPreview: React.FC<IntelReport3DModelPreviewProps> = ({
  report,
  size = 'medium',
  animated = true,
  style,
  className
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Size configurations
  const sizeConfig = {
    small: { width: 60, height: 60, scale: 0.8 },
    medium: { width: 80, height: 80, scale: 1.0 },
    large: { width: 120, height: 120, scale: 1.2 }
  };

  const { width, height, scale } = sizeConfig[size];

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    scene.add(directionalLight);

    // Create Intel Report model based on priority/type
    const model = createIntelReportModel(report, scale);
    scene.add(model);
    modelRef.current = model;

    // Mount renderer
    const mountElement = mountRef.current;
    if (mountElement) {
      mountElement.appendChild(renderer.domElement);
    }

    // Animation loop
    const animate = () => {
      if (!scene || !renderer || !model) return;

      if (animated) {
        // Gentle rotation animation
        model.rotation.y += 0.01;
        
        // Subtle floating animation
        const time = Date.now() * 0.002;
        model.position.y = Math.sin(time) * 0.1;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mountElement && renderer.domElement && mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js resources
      renderer.dispose();
      scene.clear();
      
      // Dispose materials and geometries
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [report, width, height, scale, animated]);

  // Handle hover effects
  const handleMouseEnter = () => {
    if (modelRef.current && animated) {
      // Slight scale up on hover
      modelRef.current.scale.setScalar(scale * 1.1);
    }
  };

  const handleMouseLeave = () => {
    if (modelRef.current && animated) {
      // Return to normal scale
      modelRef.current.scale.setScalar(scale);
    }
  };

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`3D model preview for Intel Report: ${report.title}`}
    />
  );
};

/**
 * Create a 3D model based on Intel Report properties
 */
function createIntelReportModel(report: IntelReportOverlayMarker, scale: number): THREE.Object3D {
  const group = new THREE.Group();
  
  // Determine model type based on tags and priority
  const tags = report.tags || [];
  const isCritical = tags.includes('URGENT') || tags.includes('CRITICAL');
  const isHighPriority = tags.includes('HIGH');
  const isSignalIntel = tags.some(tag => ['SIGINT', 'IMAGERY', 'TECHNICAL'].includes(tag));
  const isCyberIntel = tags.includes('CYBER') || tags.includes('NETWORK');

  // Base geometry and materials
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;

  if (isCyberIntel) {
    // Cyber intel: Glowing cube with circuit patterns
    geometry = new THREE.BoxGeometry(1, 1, 1);
    material = new THREE.MeshStandardMaterial({
      color: isCritical ? 0xff3333 : isHighPriority ? 0xff8800 : 0x00ccff,
      emissive: 0x001122,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });
  } else if (isSignalIntel) {
    // Signal intel: Antenna/satellite dish shape
    geometry = new THREE.ConeGeometry(0.6, 1.2, 8);
    material = new THREE.MeshStandardMaterial({
      color: isCritical ? 0xff3333 : isHighPriority ? 0xff8800 : 0x44ff44,
      emissive: 0x002200,
      emissiveIntensity: 0.2,
      metalness: 0.6,
      roughness: 0.3
    });
  } else {
    // Default: Crystalline structure
    geometry = new THREE.OctahedronGeometry(0.8);
    material = new THREE.MeshStandardMaterial({
      color: isCritical ? 0xff3333 : isHighPriority ? 0xff8800 : 0x6666ff,
      emissive: 0x000022,
      emissiveIntensity: 0.2,
      metalness: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Add priority indicator ring for high/critical reports
  if (isCritical || isHighPriority) {
    const ringGeometry = new THREE.RingGeometry(1.2, 1.4, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: isCritical ? 0xff0000 : 0xffaa00,
      emissive: isCritical ? 0x330000 : 0x331100,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.scale.setScalar(scale);
    group.add(ring);
  }

  // Add floating particles for critical reports
  if (isCritical) {
    const particleCount = 8;
    const particleGeometry = new THREE.SphereGeometry(0.05);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });

    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.8 * scale;
      particle.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 2) * 0.3,
        Math.sin(angle) * radius
      );
      group.add(particle);
    }
  }

  return group;
}

export default IntelReport3DModelPreview;
