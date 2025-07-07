/**
 * IntelReport3DPreview - Miniature 3D model preview for tooltips and popups
 * 
 * Renders a small animated 3D model of the Intel Report for UI integration
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

interface IntelReport3DPreviewProps {
  report: IntelReportOverlayMarker;
  size?: number;
  animated?: boolean;
  className?: string;
}

export const IntelReport3DPreview: React.FC<IntelReport3DPreviewProps> = ({
  report,
  size = 120,
  animated = true,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Store mount element reference for cleanup
    const mountElement = mountRef.current;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false 
    });

    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    scene.add(directionalLight);

    // Create Intel Report model based on priority
    const geometry = createIntelGeometry(report);
    const material = createIntelMaterial(report);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    // Position camera
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    meshRef.current = mesh;

    // Mount renderer
    mountElement.appendChild(renderer.domElement);

    // Start animation
    const startTime = Date.now();
    const animate = () => {
      if (!meshRef.current || !rendererRef.current || !sceneRef.current) return;

      const elapsed = (Date.now() - startTime) * 0.001;

      if (animated) {
        // Rotate the model
        meshRef.current.rotation.y = elapsed * 0.5;
        meshRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

        // Gentle floating animation
        meshRef.current.position.y = Math.sin(elapsed * 0.8) * 0.1;

        // Pulse effect based on priority
        const pulseFactor = 1 + Math.sin(elapsed * getPulseSpeed(report)) * 0.05;
        meshRef.current.scale.setScalar(pulseFactor);
      }

      rendererRef.current.render(sceneRef.current, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Small delay to show loading state
    setTimeout(() => {
      setIsLoading(false);
      animate();
    }, 300);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountElement) {
        mountElement.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, [report, size, animated]);

  return (
    <div 
      className={`intel-3d-preview ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(100, 116, 139, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
            zIndex: 10
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(100, 116, 139, 0.3)',
              borderTop: '2px solid #60a5fa',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}
      
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Priority indicator */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getPriorityColor(report),
          boxShadow: `0 0 8px ${getPriorityColor(report)}`
        }}
      />
    </div>
  );
};

// Helper functions
function createIntelGeometry(report: IntelReportOverlayMarker): THREE.BufferGeometry {
  const priority = extractPriority(report);
  
  switch (priority) {
    case 'critical':
      // Sharp crystalline structure for critical reports
      return new THREE.OctahedronGeometry(0.8, 1);
    case 'high':
      // Angular pyramid for high priority
      return new THREE.ConeGeometry(0.7, 1.2, 6);
    case 'medium':
      // Rounded cylinder for medium priority
      return new THREE.CylinderGeometry(0.6, 0.6, 1.0, 8);
    case 'low':
    default:
      // Simple sphere for low priority
      return new THREE.SphereGeometry(0.6, 16, 12);
  }
}

function createIntelMaterial(report: IntelReportOverlayMarker): THREE.Material {
  const baseColor = getPriorityColor(report);
  
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0.7,
    roughness: 0.3,
    emissive: baseColor,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.9
  });
}

function extractPriority(report: IntelReportOverlayMarker): string {
  // Extract priority from tags or content
  const tags = report.tags || [];
  const content = report.content?.toLowerCase() || '';
  
  if (tags.some(tag => tag.toLowerCase().includes('critical')) || content.includes('critical')) {
    return 'critical';
  }
  if (tags.some(tag => tag.toLowerCase().includes('high')) || content.includes('high')) {
    return 'high';
  }
  if (tags.some(tag => tag.toLowerCase().includes('medium')) || content.includes('medium')) {
    return 'medium';
  }
  return 'low';
}

function getPriorityColor(report: IntelReportOverlayMarker): string {
  const priority = extractPriority(report);
  
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    case 'low': default: return '#22c55e';
  }
}

function getPulseSpeed(report: IntelReportOverlayMarker): number {
  const priority = extractPriority(report);
  
  switch (priority) {
    case 'critical': return 3;
    case 'high': return 2;
    case 'medium': return 1.5;
    case 'low': default: return 1;
  }
}

export default IntelReport3DPreview;
