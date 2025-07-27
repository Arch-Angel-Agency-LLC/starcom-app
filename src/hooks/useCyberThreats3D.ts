// src/hooks/useCyberThreats3D.ts
// Hook for managing CyberThreats 3D visualization in the Globe
// Follows the proven pattern from useIntelReport3DMarkers.ts

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { ThreatIntelligenceService } from '../services/CyberThreats/ThreatIntelligenceService';
import { useCyberCommandSettings } from './useCyberCommandSettings';
import type {
  CyberThreatData,
  ThreatQueryOptions,
  ThreatHeatMapPoint,
  ThreatCategory,
  ConfidenceLevel
} from '../types/CyberThreats';

// Hook options interface following the proven pattern
interface UseCyberThreats3DOptions {
  globeRadius?: number;
  updateInterval?: number;
  maxActiveThreats?: number;
  enableHeatMap?: boolean;
  enableConnections?: boolean;
  debugMode?: boolean;
}

// Threat visualization instance
interface ThreatInstance {
  id: string;
  mesh: THREE.Object3D;
  threat: CyberThreatData;
  position: THREE.Vector3;
  intensity: number;
  pulseSpeed: number;
}

// Hook state interface
interface CyberThreats3DState {
  threats: CyberThreatData[];
  heatMapPoints: ThreatHeatMapPoint[];
  threatsGroup: THREE.Group;
  threatInstances: ThreatInstance[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date;
}

export const useCyberThreats3D = (
  isActive: boolean,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  options: UseCyberThreats3DOptions = {}
) => {
  const {
    globeRadius = 100,
    updateInterval = 5000,
    maxActiveThreats = 1000,
    enableHeatMap = true,
    enableConnections = true,
    debugMode = false
  } = options;

  // State management following the proven pattern
  const [state, setState] = useState<CyberThreats3DState>({
    threats: [],
    heatMapPoints: [],
    threatsGroup: new THREE.Group(),
    threatInstances: [],
    isLoading: false,
    error: null,
    lastUpdate: new Date()
  });

  // Service reference
  const serviceRef = useRef<ThreatIntelligenceService | null>(null);
  const animationFrameRef = useRef<number>();
  const updateTimerRef = useRef<NodeJS.Timeout>();

  // Settings integration
  const { config } = useCyberCommandSettings();
  const cyberThreatsSettings = config.cyberThreats;

  // Constants for threat visualization (extracted from disconnected component)
  const THREAT_COLORS = useMemo(() => ({
    Malware: 0xff3333,      // Red
    Phishing: 0xff8800,     // Orange
    Ransomware: 0xcc0000,   // Dark Red
    APT: 0x8800ff,          // Purple
    Botnet: 0xff0088,       // Pink
    Vulnerability: 0xffaa00, // Yellow-Orange
    DataBreach: 0xff4444,   // Light Red
    Infrastructure: 0x00ffaa, // Cyan
    SupplyChain: 0xaa00ff,   // Magenta
    Insider: 0xffaa44,      // Orange-Yellow
    Unknown: 0x666666       // Gray
  }), []);

  const STATUS_PULSE_SPEEDS = useMemo(() => ({
    Emerging: 2.0,    // Fast pulse for new threats
    Active: 1.5,      // Medium pulse
    Contained: 0.8,   // Slow pulse
    Neutralized: 0.0, // No pulse
    Dormant: 0.5,     // Very slow pulse
    Unknown: 1.0      // Default pulse
  }), []);

  // Utility function: Convert lat/lng to 3D position
  const latLngToVector3 = useCallback((lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  }, []);

  // Create threat visualization mesh
  const createThreatMesh = useCallback((threat: CyberThreatData): THREE.Object3D => {
    if (!threat.location) {
      console.warn('Threat missing location:', threat);
      return new THREE.Object3D();
    }

    const { category, severity, confidence } = threat;
    
    // Create geometry based on category (extracted from Globe.tsx working logic)
    let geometry: THREE.BufferGeometry;
    let color: number;
    
    switch (category) {
      case 'Malware':
        geometry = new THREE.IcosahedronGeometry(0.02 + severity * 0.005, 1);
        color = THREAT_COLORS.Malware;
        break;
      case 'APT':
        geometry = new THREE.ConeGeometry(0.015 + severity * 0.003, 0.04 + severity * 0.008, 6);
        color = THREAT_COLORS.APT;
        break;
      case 'Botnet':
        geometry = new THREE.SphereGeometry(0.018 + severity * 0.004, 8, 6);
        color = THREAT_COLORS.Botnet;
        break;
      case 'Phishing':
        geometry = new THREE.OctahedronGeometry(0.02 + severity * 0.005, 1);
        color = THREAT_COLORS.Phishing;
        break;
      default:
        geometry = new THREE.SphereGeometry(0.015 + severity * 0.003, 6, 4);
        color = THREAT_COLORS.Unknown;
    }

    // Create material with confidence-based opacity
    const confidenceOpacity = {
      Low: 0.4,
      Medium: 0.6,
      High: 0.8,
      Confirmed: 1.0
    }[confidence] || 0.6;

    const material = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: confidenceOpacity,
      emissive: color,
      emissiveIntensity: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Position on globe surface
    const position = latLngToVector3(
      threat.location.latitude,
      threat.location.longitude,
      1.05 + (severity / 20) // Height varies by severity
    );
    mesh.position.copy(position);
    
    // Store threat data for interaction
    mesh.userData = { threat, type: 'cyberThreat' };
    
    return mesh;
  }, [latLngToVector3, THREAT_COLORS]);

  // Initialize service
  useEffect(() => {
    if (!isActive) return;

    if (!serviceRef.current) {
      serviceRef.current = new ThreatIntelligenceService({
        debugMode,
        updateInterval,
        maxActiveThreatss: maxActiveThreats,
        enableGeographicCorrelation: true,
        enableTemporalCorrelation: true,
        heatMapResolution: enableHeatMap ? 20 : 0
      });

      if (debugMode) {
        console.log('🔒 CyberThreats3D: Service initialized');
      }
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
        if (debugMode) {
          console.log('🔒 CyberThreats3D: Service disposed');
        }
      }
    };
  }, [isActive, debugMode, updateInterval, maxActiveThreats, enableHeatMap]);

  // Add threats group to scene
  useEffect(() => {
    if (!scene || !isActive) return;

    const threatsGroup = state.threatsGroup;
    scene.add(threatsGroup);

    return () => {
      scene.remove(threatsGroup);
    };
  }, [scene, isActive, state.threatsGroup]);

  // Load threat data
  const loadThreatData = useCallback(async () => {
    if (!serviceRef.current || !isActive) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Build query options from settings
      const queryOptions: ThreatQueryOptions = {
        limit: cyberThreatsSettings.maxThreats || 500,
        time_window: {
          start: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
          end: new Date()
        },
        severity_min: 3, // Default minimum severity
        confidence: ['Low'] as ConfidenceLevel[],
        categories: ['Malware', 'APT', 'Botnet', 'Phishing'] as ThreatCategory[]
      };

      const threats = await serviceRef.current.getData(queryOptions);
      
      let heatMapPoints: ThreatHeatMapPoint[] = [];
      if (enableHeatMap) {
        heatMapPoints = await serviceRef.current.generateHeatMap({
          time_window: queryOptions.time_window,
          categories: queryOptions.categories
        });
      }

      if (debugMode) {
        console.log(`🔒 CyberThreats3D: Loaded ${threats.length} threats, ${heatMapPoints.length} heat map points`);
      }

      setState(prev => ({
        ...prev,
        threats,
        heatMapPoints,
        isLoading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      console.error('Error loading cyber threats data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [serviceRef, isActive, cyberThreatsSettings, enableHeatMap, debugMode]);

  // Update visualization when threats change
  useEffect(() => {
    if (!isActive || state.threats.length === 0) return;

    // Clear existing visualization
    state.threatsGroup.clear();

    // Create threat instances
    const threatInstances: ThreatInstance[] = [];

    state.threats.forEach((threat) => {
      if (!threat.location) return;

      const mesh = createThreatMesh(threat);
      const intensity = (threat.severity / 10) + (threat.confidence === 'Confirmed' ? 0.2 : 0);
      const pulseSpeed = STATUS_PULSE_SPEEDS[threat.status] || 1.0;

      const instance: ThreatInstance = {
        id: threat.id,
        mesh,
        threat,
        position: mesh.position.clone(),
        intensity,
        pulseSpeed
      };

      threatInstances.push(instance);
      state.threatsGroup.add(mesh);
    });

    setState(prev => ({ ...prev, threatInstances }));

    if (debugMode) {
      console.log(`🔒 CyberThreats3D: Created ${threatInstances.length} threat visualizations`);
    }

  }, [isActive, state.threats, createThreatMesh, debugMode, STATUS_PULSE_SPEEDS, state.threatsGroup]);

  // Animation loop
  useEffect(() => {
    if (!isActive || state.threatInstances.length === 0) return;

    const animate = () => {
      const time = Date.now() * 0.001;

      state.threatInstances.forEach(instance => {
        const { mesh, intensity, pulseSpeed } = instance;
        
        // Pulse animation based on threat status
        const pulseScale = 1 + Math.sin(time * pulseSpeed) * 0.3 * intensity;
        mesh.scale.setScalar(pulseScale);
        
        // Make threats face the camera for better visibility
        if (camera) {
          mesh.lookAt(camera.position);
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, state.threatInstances, camera]);

  // Auto-refresh data
  useEffect(() => {
    if (!isActive) return;

    // Initial load
    loadThreatData();

    // Set up refresh timer
    updateTimerRef.current = setInterval(loadThreatData, updateInterval);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [isActive, loadThreatData, updateInterval]);

  // Return hook interface following the proven pattern
  return {
    threats: state.threats,
    heatMapPoints: state.heatMapPoints,
    threatsGroup: state.threatsGroup,
    threatInstances: state.threatInstances,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refresh: loadThreatData
  };
};
