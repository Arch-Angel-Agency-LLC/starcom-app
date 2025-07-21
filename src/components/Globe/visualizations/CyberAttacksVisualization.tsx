/**
 * CyberAttacks 3D Visualization Component
 * Displays real-time cyber attacks with trajectory animations on the globe
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RealTimeAttackService } from '../../../services/CyberAttacks/RealTimeAttackService';
import { useCyberCommandSettings } from '../../../hooks/useCyberCommandSettings';
import type { 
  CyberAttackData, 
  AttackStreamEvent, 
  AttackType,
  SeverityLevel,
  ATTACK_TYPE_COLORS,
  SEVERITY_COLORS
} from '../../../types/CyberAttacks';
import type { GlobeVisualizationProps } from '../../../types/CyberCommandVisualization';

// =============================================================================
// TRAJECTORY ANIMATION SYSTEM
// =============================================================================

interface AttackTrajectoryProps {
  attack: CyberAttackData;
  globeRadius: number;
  animationSpeed: number;
  onComplete: (attackId: string) => void;
}

const AttackTrajectory: React.FC<AttackTrajectoryProps> = ({
  attack,
  globeRadius,
  animationSpeed,
  onComplete
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Convert lat/long to 3D coordinates
  const source3D = useMemo(() => {
    const { latitude, longitude } = attack.trajectory.source;
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const radius = globeRadius * 1.02; // Slightly above surface
    
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, [attack.trajectory.source, globeRadius]);

  const target3D = useMemo(() => {
    const { latitude, longitude } = attack.trajectory.target;
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const radius = globeRadius * 1.02;
    
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, [attack.trajectory.target, globeRadius]);

  // Create trajectory curve
  const trajectoryCurve = useMemo(() => {
    const distance = source3D.distanceTo(target3D);
    const arcHeight = Math.min(distance * 0.3, globeRadius * 0.5);
    
    // Calculate midpoint above the sphere
    const midpoint = new THREE.Vector3()
      .addVectors(source3D, target3D)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(globeRadius + arcHeight);
    
    return new THREE.QuadraticBezierCurve3(source3D, midpoint, target3D);
  }, [source3D, target3D, globeRadius]);

  // Get attack colors
  const attackColor = useMemo(() => {
    const typeColors: Record<AttackType, string> = {
      'DDoS': '#ff4444',
      'Malware': '#ff8800',
      'Phishing': '#ffaa00',
      'DataBreach': '#aa0088',
      'Ransomware': '#cc0000',
      'APT': '#880044',
      'Botnet': '#666600',
      'WebAttack': '#008888',
      'NetworkIntrusion': '#4444ff',
      'Unknown': '#808080'
    };
    return typeColors[attack.attack_type] || '#ffffff';
  }, [attack.attack_type]);

  const severityIntensity = useMemo(() => {
    return attack.severity / 5; // Scale 1-5 to 0.2-1.0
  }, [attack.severity]);

  // Animation loop
  useFrame((state, delta) => {
    if (completed || !meshRef.current) return;

    const newProgress = Math.min(progress + (delta * animationSpeed), 1);
    setProgress(newProgress);

    if (newProgress >= 1 && !completed) {
      setCompleted(true);
      onComplete(attack.id);
      return;
    }

    // Update projectile position
    const position = trajectoryCurve.getPoint(newProgress);
    meshRef.current.position.copy(position);

    // Update projectile rotation (point toward target)
    if (newProgress < 1) {
      const nextPosition = trajectoryCurve.getPoint(Math.min(newProgress + 0.01, 1));
      meshRef.current.lookAt(nextPosition);
    }

    // Update trail effect opacity based on progress
    const trailOpacity = Math.max(0, 1 - newProgress * 2);
    if (meshRef.current.children[1]) {
      (meshRef.current.children[1] as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: attackColor,
        transparent: true,
        opacity: trailOpacity * severityIntensity
      });
    }
  });

  // Create trajectory line geometry
  const trajectoryPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 50; i++) {
      points.push(trajectoryCurve.getPoint(i / 50));
    }
    return points;
  }, [trajectoryCurve]);

  return (
    <group ref={meshRef}>
      {/* Attack projectile */}
      <mesh>
        <sphereGeometry args={[0.8 * severityIntensity, 8, 8]} />
        <meshBasicMaterial 
          color={attackColor} 
          emissive={attackColor}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Trajectory trail */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={trajectoryPoints.length}
            array={new Float32Array(trajectoryPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={attackColor}
          transparent={true}
          opacity={0.3 * severityIntensity}
        />
      </line>
    </group>
  );
};

// =============================================================================
// ATTACK MARKERS (SOURCE/TARGET INDICATORS)
// =============================================================================

interface AttackMarkerProps {
  position: THREE.Vector3;
  type: 'source' | 'target';
  attackType: AttackType;
  severity: SeverityLevel;
  organization?: string;
  pulseIntensity?: number;
}

const AttackMarker: React.FC<AttackMarkerProps> = ({
  position,
  type,
  attackType,
  severity,
  organization,
  pulseIntensity = 1
}) => {
  const markerRef = useRef<THREE.Group>(null);
  const [pulseScale, setPulseScale] = useState(1);

  const markerColor = useMemo(() => {
    if (type === 'source') return '#ff4444';
    return severity >= 4 ? '#ff0000' : severity >= 3 ? '#ff8800' : '#ffaa00';
  }, [type, severity]);

  // Pulsing animation
  useFrame((state) => {
    if (!markerRef.current) return;
    
    const time = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(time * 3 * pulseIntensity) * 0.2;
    setPulseScale(pulse);
    markerRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={markerRef} position={position}>
      {/* Base marker */}
      <mesh>
        <cylinderGeometry args={[1, 1.5, 2, 8]} />
        <meshBasicMaterial 
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={0.2}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
      
      {/* Pulse effect ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 3, 16]} />
        <meshBasicMaterial 
          color={markerColor}
          transparent={true}
          opacity={0.3 / pulseScale}
        />
      </mesh>
      
      {/* Organization label for targets */}
      {type === 'target' && organization && (
        <Text
          position={[0, 3, 0]}
          fontSize={1.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {organization}
        </Text>
      )}
    </group>
  );
};

// =============================================================================
// ATTACK INFO PANEL
// =============================================================================

interface AttackInfoPanelProps {
  attack: CyberAttackData | null;
  position: [number, number];
}

const AttackInfoPanel: React.FC<AttackInfoPanelProps> = ({ attack, position }) => {
  if (!attack) return null;

  return (
    <div 
      className="absolute bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg border border-cyan-500 min-w-80"
      style={{ left: position[0], top: position[1] }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-cyan-400">
          {attack.attack_type} Attack
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          attack.severity >= 4 ? 'bg-red-600' : 
          attack.severity >= 3 ? 'bg-orange-600' : 'bg-yellow-600'
        }`}>
          Severity {attack.severity}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Status:</strong> 
          <span className={`ml-1 capitalize ${
            attack.attack_status === 'resolved' ? 'text-green-400' :
            attack.attack_status === 'contained' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {attack.attack_status.replace('_', ' ')}
          </span>
        </div>
        
        <div>
          <strong>Source:</strong> {attack.trajectory.source.countryCode}
        </div>
        
        <div>
          <strong>Target:</strong> {attack.trajectory.target.organization} 
          ({attack.trajectory.target.countryCode})
        </div>
        
        <div>
          <strong>Sector:</strong> {attack.trajectory.target.sector}
        </div>
        
        <div>
          <strong>Vector:</strong> {attack.attack_vector}
        </div>
        
        <div>
          <strong>Systems Affected:</strong> {attack.technical_data.systems_affected}
        </div>
        
        <div>
          <strong>First Detected:</strong> 
          {attack.timeline.firstDetected.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN CYBER ATTACKS VISUALIZATION COMPONENT
// =============================================================================

export const CyberAttacksVisualization: React.FC<GlobeVisualizationProps> = ({
  globeRadius = 50,
  enabled = true
}) => {
  const { camera } = useThree();
  const { settings } = useCyberCommandSettings();
  const cyberAttackSettings = settings.CyberAttacks;
  
  // Service and data management
  const [attackService] = useState(() => new RealTimeAttackService());
  const [activeAttacks, setActiveAttacks] = useState<Map<string, CyberAttackData>>(new Map());
  const [animatingAttacks, setAnimatingAttacks] = useState<Map<string, CyberAttackData>>(new Map());
  const [selectedAttack, setSelectedAttack] = useState<CyberAttackData | null>(null);
  const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);

  // Subscription management
  useEffect(() => {
    if (!enabled || !cyberAttackSettings.enabled) {
      return;
    }

    const subscriptionOptions = {
      attack_types: cyberAttackSettings.attackTypes.length > 0 
        ? cyberAttackSettings.attackTypes as AttackType[]
        : undefined,
      severity_min: cyberAttackSettings.severityFilter.min,
      severity_max: cyberAttackSettings.severityFilter.max,
      limit: 50
    };

    const subscription = attackService.subscribeToAttacks(
      subscriptionOptions,
      handleAttackEvent
    );

    // Load initial data
    loadInitialAttacks();

    return () => {
      attackService.unsubscribeFromAttacks(subscription);
    };
  }, [enabled, cyberAttackSettings, attackService]);

  const loadInitialAttacks = useCallback(async () => {
    try {
      const initialAttacks = await attackService.getData({ limit: 20 });
      const attackMap = new Map();
      initialAttacks.forEach(attack => {
        attackMap.set(attack.id, attack);
      });
      setActiveAttacks(attackMap);
    } catch (error) {
      console.error('Failed to load initial attacks:', error);
    }
  }, [attackService]);

  const handleAttackEvent = useCallback((event: AttackStreamEvent) => {
    switch (event.event_type) {
      case 'new_attack':
        setActiveAttacks(prev => {
          const newMap = new Map(prev);
          newMap.set(event.attack_data.id, event.attack_data);
          return newMap;
        });
        
        // Start animation for new attack
        setAnimatingAttacks(prev => {
          const newMap = new Map(prev);
          newMap.set(event.attack_data.id, event.attack_data);
          return newMap;
        });
        break;
        
      case 'attack_update':
        setActiveAttacks(prev => {
          const newMap = new Map(prev);
          newMap.set(event.attack_data.id, event.attack_data);
          return newMap;
        });
        break;
        
      case 'attack_resolved':
        setActiveAttacks(prev => {
          const newMap = new Map(prev);
          newMap.delete(event.attack_data.id);
          return newMap;
        });
        setAnimatingAttacks(prev => {
          const newMap = new Map(prev);
          newMap.delete(event.attack_data.id);
          return newMap;
        });
        break;
    }
  }, []);

  const handleTrajectoryComplete = useCallback((attackId: string) => {
    setAnimatingAttacks(prev => {
      const newMap = new Map(prev);
      newMap.delete(attackId);
      return newMap;
    });
  }, []);

  const handleAttackClick = useCallback((attack: CyberAttackData, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedAttack(attack);
    setMousePosition([event.clientX, event.clientY]);
  }, []);

  // Convert lat/lng to 3D position
  const getGlobePosition = useCallback((latitude: number, longitude: number, offset = 0) => {
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const radius = globeRadius + offset;
    
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, [globeRadius]);

  // Filter attacks based on settings
  const filteredAttacks = useMemo(() => {
    return Array.from(activeAttacks.values()).filter(attack => {
      // Attack type filter
      if (cyberAttackSettings.attackTypes.length > 0 && 
          !cyberAttackSettings.attackTypes.includes(attack.attack_type)) {
        return false;
      }
      
      // Severity filter
      if (attack.severity < cyberAttackSettings.severityFilter.min ||
          attack.severity > cyberAttackSettings.severityFilter.max) {
        return false;
      }
      
      // Time window filter
      if (cyberAttackSettings.timeWindow > 0) {
        const cutoff = new Date(Date.now() - cyberAttackSettings.timeWindow * 60 * 1000);
        if (attack.timeline.firstDetected < cutoff) {
          return false;
        }
      }
      
      return true;
    });
  }, [activeAttacks, cyberAttackSettings]);

  // Don't render if disabled
  if (!enabled || !cyberAttackSettings.enabled) {
    return null;
  }

  return (
    <group>
      {/* Attack trajectory animations */}
      {Array.from(animatingAttacks.values()).map(attack => (
        <AttackTrajectory
          key={`trajectory-${attack.id}`}
          attack={attack}
          globeRadius={globeRadius}
          animationSpeed={cyberAttackSettings.animationSpeed}
          onComplete={handleTrajectoryComplete}
        />
      ))}
      
      {/* Source markers */}
      {filteredAttacks.map(attack => {
        const sourcePos = getGlobePosition(
          attack.trajectory.source.latitude,
          attack.trajectory.source.longitude,
          2
        );
        
        return (
          <group key={`source-${attack.id}`}>
            <AttackMarker
              position={sourcePos}
              type="source"
              attackType={attack.attack_type}
              severity={attack.severity}
              pulseIntensity={attack.severity / 5}
            />
          </group>
        );
      })}
      
      {/* Target markers */}
      {filteredAttacks.map(attack => {
        const targetPos = getGlobePosition(
          attack.trajectory.target.latitude,
          attack.trajectory.target.longitude,
          2
        );
        
        return (
          <group 
            key={`target-${attack.id}`}
            onClick={(e) => handleAttackClick(attack, e as any)}
          >
            <AttackMarker
              position={targetPos}
              type="target"
              attackType={attack.attack_type}
              severity={attack.severity}
              organization={attack.trajectory.target.organization}
              pulseIntensity={attack.severity / 5}
            />
          </group>
        );
      })}
      
      {/* Attack info panel overlay */}
      {selectedAttack && (
        <AttackInfoPanel
          attack={selectedAttack}
          position={mousePosition}
        />
      )}
    </group>
  );
};

export default CyberAttacksVisualization;
