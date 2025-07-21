/**
 * CyberThreats Visualization Component
 * Week 3 Day 2: Threat data processing and geographic mapping
 * 
 * Displays threat intelligence data on the 3D globe with:
 * - Threat density heat maps
 * - Geographic threat distribution
 * - C2 server locations
 * - Threat actor attribution
 * - Malware family visualization
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { Group, Vector3, Color, BufferGeometry, Float32BufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';
import { ThreatIntelligenceService } from '../../../services/CyberThreats/ThreatIntelligenceService';
import { useCyberCommandSettings } from '../../../hooks/useCyberCommandSettings';
import type {
  CyberThreatData,
  ThreatQueryOptions,
  ThreatHeatMapPoint,
  ThreatCategory,
  ConfidenceLevel,
  ThreatStatus
} from '../../../types/CyberThreats';

// =============================================================================
// INTERFACES
// =============================================================================

interface CyberThreatsVisualizationProps {
  globeRef: React.RefObject<Group>;
  isActive: boolean;
  debugMode?: boolean;
}

interface ThreatVisualizationState {
  threats: CyberThreatData[];
  heatMapPoints: ThreatHeatMapPoint[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date;
}

interface ThreatPoint {
  position: Vector3;
  threat: CyberThreatData;
  intensity: number;
  color: Color;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const THREAT_COLORS = {
  Malware: '#ff3333',      // Red
  Phishing: '#ff8800',     // Orange
  Ransomware: '#cc0000',   // Dark Red
  APT: '#8800ff',          // Purple
  Botnet: '#ff0088',       // Pink
  C2: '#0088ff',           // Blue
  Vulnerability: '#ffaa00', // Yellow-Orange
  DataBreach: '#ff4444',   // Light Red
  Unknown: '#666666'       // Gray
} as const;

const CONFIDENCE_ALPHA = {
  Low: 0.3,
  Medium: 0.6,
  High: 0.8,
  Confirmed: 1.0
} as const;

const STATUS_PULSE_SPEEDS = {
  Emerging: 2.0,    // Fast pulse for new threats
  Active: 1.5,      // Medium pulse
  Contained: 0.8,   // Slow pulse
  Neutralized: 0.0, // No pulse
  Dormant: 0.5,     // Very slow pulse
  Unknown: 1.0      // Default pulse
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert lat/lng to 3D position on globe
 */
function latLngToVector3(lat: number, lng: number, radius: number = 1.02): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Get threat color based on category and confidence
 */
function getThreatColor(category: ThreatCategory, confidence: ConfidenceLevel): Color {
  const baseColor = THREAT_COLORS[category] || THREAT_COLORS.Unknown;
  const alpha = CONFIDENCE_ALPHA[confidence] || CONFIDENCE_ALPHA.Medium;
  
  const color = new Color(baseColor);
  color.multiplyScalar(alpha);
  
  return color;
}

/**
 * Calculate threat intensity based on severity and confidence
 */
function calculateThreatIntensity(threat: CyberThreatData): number {
  const severityWeight = threat.severity / 10; // Normalize 0-1
  const confidenceWeight = CONFIDENCE_ALPHA[threat.confidence];
  
  return (severityWeight * 0.7 + confidenceWeight * 0.3);
}

// =============================================================================
// THREAT POINT COMPONENT
// =============================================================================

interface ThreatPointProps {
  threatPoint: ThreatPoint;
  time: number;
}

const ThreatPoint: React.FC<ThreatPointProps> = ({ threatPoint, time }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { threat, position, intensity, color } = threatPoint;
  
  // Calculate pulse based on threat status
  const pulseSpeed = STATUS_PULSE_SPEEDS[threat.status];
  const pulseScale = 1 + Math.sin(time * pulseSpeed) * 0.3 * intensity;
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(pulseScale);
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.005 * (1 + intensity), 8, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

// =============================================================================
// HEAT MAP COMPONENT
// =============================================================================

interface HeatMapProps {
  heatMapPoints: ThreatHeatMapPoint[];
  time: number;
}

const ThreatHeatMap: React.FC<HeatMapProps> = ({ heatMapPoints, time }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const { geometry, material } = useMemo(() => {
    const geo = new BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    
    heatMapPoints.forEach(point => {
      const pos = latLngToVector3(point.latitude, point.longitude, 1.01);
      positions.push(pos.x, pos.y, pos.z);
      
      // Color based on threat density
      const intensity = Math.min(point.threat_count / 100, 1); // Normalize
      const heatColor = new Color().lerpColors(
        new Color('#ffff00'), // Yellow for low
        new Color('#ff0000'), // Red for high
        intensity
      );
      
      colors.push(heatColor.r, heatColor.g, heatColor.b);
      sizes.push(2 + intensity * 8); // Size based on intensity
    });
    
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    
    const mat = new THREE.PointsMaterial({
      size: 0.01,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: false
    });
    
    return { geometry: geo, material: mat };
  }, [heatMapPoints]);
  
  useFrame(() => {
    if (meshRef.current) {
      // Subtle pulsing animation
      const pulse = 1 + Math.sin(time * 0.5) * 0.1;
      meshRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  );
};

// =============================================================================
// THREAT CONNECTIONS COMPONENT
// =============================================================================

interface ThreatConnectionProps {
  threats: CyberThreatData[];
  time: number;
}

const ThreatConnections: React.FC<ThreatConnectionProps> = ({ threats, time }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    
    // Create connections between related threats (C2 networks, campaigns)
    threats.forEach(threat => {
      if (threat.category === 'C2' || threat.category === 'Botnet') {
        // Find related threats in the same campaign
        const relatedThreats = threats.filter(t => 
          t.campaign === threat.campaign && 
          t.id !== threat.id &&
          t.geolocation
        );
        
        relatedThreats.forEach(related => {
          if (threat.geolocation && related.geolocation) {
            const start = latLngToVector3(
              threat.geolocation.latitude,
              threat.geolocation.longitude,
              1.02
            );
            const end = latLngToVector3(
              related.geolocation.latitude,
              related.geolocation.longitude,
              1.02
            );
            
            positions.push(start.x, start.y, start.z);
            positions.push(end.x, end.y, end.z);
            
            // Color based on threat confidence
            const connectionColor = getThreatColor(threat.category, threat.confidence);
            colors.push(connectionColor.r, connectionColor.g, connectionColor.b);
            colors.push(connectionColor.r, connectionColor.g, connectionColor.b);
          }
        });
      }
    });
    
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    
    return geo;
  }, [threats]);
  
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4
    });
  }, []);
  
  useFrame(() => {
    if (linesRef.current) {
      // Animate opacity based on time
      const opacity = 0.2 + Math.sin(time * 1.5) * 0.2;
      linesRef.current.material.opacity = opacity;
    }
  });
  
  return (
    <lineSegments ref={linesRef} geometry={geometry} material={material} />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const CyberThreatsVisualization: React.FC<CyberThreatsVisualizationProps> = ({
  globeRef,
  isActive,
  debugMode = false
}) => {
  const groupRef = useRef<Group>(null);
  const threatServiceRef = useRef<ThreatIntelligenceService>();
  const [visualizationState, setVisualizationState] = useState<ThreatVisualizationState>({
    threats: [],
    heatMapPoints: [],
    isLoading: true,
    error: null,
    lastUpdate: new Date()
  });
  
  const { settings } = useCyberCommandSettings();
  const cyberThreatsSettings = settings.cyberThreats;
  
  // Initialize service
  useEffect(() => {
    if (!threatServiceRef.current) {
      threatServiceRef.current = new ThreatIntelligenceService({
        debugMode,
        updateInterval: 5000, // 5 second updates
        heatMapResolution: 20
      });
    }
    
    return () => {
      if (threatServiceRef.current) {
        // Cleanup subscriptions
        threatServiceRef.current.stopStreaming();
      }
    };
  }, [debugMode]);
  
  // Load initial threat data
  const loadThreatData = useCallback(async () => {
    if (!threatServiceRef.current || !isActive) return;
    
    try {
      setVisualizationState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Build query options from settings
      const queryOptions: ThreatQueryOptions = {
        categories: cyberThreatsSettings.showMalware ? ['Malware'] : [],
        confidence: cyberThreatsSettings.confidenceThreshold ? [cyberThreatsSettings.confidenceThreshold] : undefined,
        limit: 500 // Reasonable limit for performance
      };
      
      // Add more categories based on settings
      if (cyberThreatsSettings.showPhishing) queryOptions.categories?.push('Phishing');
      if (cyberThreatsSettings.showRansomware) queryOptions.categories?.push('Ransomware');
      if (cyberThreatsSettings.showAPT) queryOptions.categories?.push('APT');
      if (cyberThreatsSettings.showBotnets) queryOptions.categories?.push('Botnet');
      if (cyberThreatsSettings.showC2) queryOptions.categories?.push('C2');
      
      // Load threat data and heat map
      const [threats, heatMapPoints] = await Promise.all([
        threatServiceRef.current.getData(queryOptions),
        threatServiceRef.current.generateHeatMap(queryOptions)
      ]);
      
      setVisualizationState({
        threats: threats.filter(t => t.geolocation), // Only threats with location data
        heatMapPoints,
        isLoading: false,
        error: null,
        lastUpdate: new Date()
      });
      
      if (debugMode) {
        console.log('CyberThreats loaded:', {
          threatCount: threats.length,
          heatMapPoints: heatMapPoints.length,
          queryOptions
        });
      }
      
    } catch (error) {
      console.error('Failed to load threat data:', error);
      setVisualizationState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [isActive, cyberThreatsSettings, debugMode]);
  
  // Load data when component becomes active or settings change
  useEffect(() => {
    loadThreatData();
  }, [loadThreatData]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!threatServiceRef.current || !isActive) return;
    
    const queryOptions: ThreatQueryOptions = {
      categories: ['Malware', 'Phishing', 'Ransomware', 'APT', 'Botnet', 'C2'],
      limit: 100
    };
    
    const subscriptionId = threatServiceRef.current.subscribeToThreats(
      queryOptions,
      (newThreats) => {
        setVisualizationState(prev => ({
          ...prev,
          threats: [...prev.threats, ...newThreats.filter(t => t.geolocation)],
          lastUpdate: new Date()
        }));
      }
    );
    
    return () => {
      if (threatServiceRef.current) {
        threatServiceRef.current.unsubscribeFromThreats(subscriptionId);
      }
    };
  }, [isActive]);
  
  // Generate threat points for visualization
  const threatPoints = useMemo(() => {
    return visualizationState.threats.map(threat => {
      if (!threat.geolocation) return null;
      
      const position = latLngToVector3(
        threat.geolocation.latitude,
        threat.geolocation.longitude
      );
      
      const intensity = calculateThreatIntensity(threat);
      const color = getThreatColor(threat.category, threat.confidence);
      
      return {
        position,
        threat,
        intensity,
        color
      };
    }).filter(Boolean) as ThreatPoint[];
  }, [visualizationState.threats]);
  
  // Animation time
  const [time, setTime] = useState(0);
  useFrame((state) => {
    setTime(state.clock.elapsedTime);
  });
  
  // Show/hide based on active state
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.visible = isActive;
    }
  }, [isActive]);
  
  if (!isActive) {
    return null;
  }
  
  return (
    <group ref={groupRef}>
      {/* Threat Points */}
      {threatPoints.map((threatPoint, index) => (
        <ThreatPoint
          key={`threat-${threatPoint.threat.id}-${index}`}
          threatPoint={threatPoint}
          time={time}
        />
      ))}
      
      {/* Heat Map */}
      {cyberThreatsSettings.showHeatMap && visualizationState.heatMapPoints.length > 0 && (
        <ThreatHeatMap
          heatMapPoints={visualizationState.heatMapPoints}
          time={time}
        />
      )}
      
      {/* Threat Connections (C2 networks, campaigns) */}
      {cyberThreatsSettings.showConnections && (
        <ThreatConnections
          threats={visualizationState.threats}
          time={time}
        />
      )}
      
      {/* Debug Info */}
      {debugMode && (
        <mesh position={[0, 1.5, 0]}>
          <planeGeometry args={[0.5, 0.2]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
};

export default CyberThreatsVisualization;
