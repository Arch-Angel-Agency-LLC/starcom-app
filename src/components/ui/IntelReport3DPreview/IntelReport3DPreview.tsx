/**
 * IntelReport3DPreview - Miniature 3D model preview for tooltips and popups
 * 
 * Renders a small animated 3D model of the Intel Report for UI integration
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { assetLoader } from '../../../utils/assetLoader';
import intelReportModelUrl from '../../../assets/models/intel_report-01d.glb?url';

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
  const meshRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const baseScaleRef = useRef<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Store mount element reference for cleanup
    const mountElement = mountRef.current;
    let isCancelled = false;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false 
    });

    renderer.setSize(size, size);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
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

    const container = new THREE.Group();
    scene.add(container);

    // Position camera
    camera.position.set(0, 0.4, 2.8);
    camera.lookAt(0, 0, 0);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    meshRef.current = container;

    // Mount renderer
    mountElement.appendChild(renderer.domElement);

    const startTime = Date.now();

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = (Date.now() - startTime) * 0.001;
      const mesh = meshRef.current;

      if (mesh && animated) {
        mesh.rotation.y = elapsed * 0.5;
        mesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
        mesh.position.y = Math.sin(elapsed * 0.8) * 0.08;

        const pulseFactor = 1 + Math.sin(elapsed * getPulseSpeed(report)) * 0.05;
        mesh.scale.setScalar(baseScaleRef.current * pulseFactor);
      }

      rendererRef.current.render(sceneRef.current, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    const loadModel = async () => {
      setIsLoading(true);
      try {
        const baseModel = await assetLoader.loadModel(intelReportModelUrl, {
          scale: 1,
          fallbackColor: 0xff6b35,
          fallbackGeometry: 'sphere',
          retryCount: 1,
          timeout: 8000
        });

        if (isCancelled) {
          return;
        }

        const modelInstance = baseModel.clone(true);

        const containerGroup = meshRef.current;
        containerGroup?.clear();

        const boundingBox = new THREE.Box3().setFromObject(modelInstance);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const sizeVector = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) || 1;

        modelInstance.position.sub(center);

        const desiredSize = 1.6;
        const scaleFactor = desiredSize / maxDimension;
        containerGroup?.add(modelInstance);
        baseScaleRef.current = scaleFactor;
        containerGroup?.scale.setScalar(scaleFactor);

        containerGroup?.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      } catch (error) {
        console.error('Failed to load Intel Report preview model', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadModel();
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      isCancelled = true;
      if (rendererRef.current && mountElement) {
        mountElement.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
        sceneRef.current = null;
      }
      meshRef.current = null;
      baseScaleRef.current = 1;
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
