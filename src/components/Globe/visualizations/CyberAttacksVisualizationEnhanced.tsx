/**
 * Enhanced CyberAttacksVisualization with optimized animation system
 * Replaces the original with performance improvements and better user interaction
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, BufferGeometry, Line, LineBasicMaterial } from 'three';
import { Text } from '@react-three/drei';

import { RealTimeAttackService } from '../../../services/CyberAttacks/RealTimeAttackService';
import { useCyberCommandSettings } from '../../../hooks/useCyberCommandSettings';
import { CyberAttackData } from '../../../types/CyberAttacks';
import { AttackAnimationManager, AnimationFrame } from './optimizations/AttackAnimationManager';

interface CyberAttacksVisualizationProps {
  enabled?: boolean;
  globeRadius?: number;
}

interface AttackTrajectoryProps {
  attackId: string;
  frame: AnimationFrame;
  attack: CyberAttackData;
  settings: any;
}

interface AttackMarkerProps {
  position: Vector3;
  attack: CyberAttackData;
  opacity: number;
}

interface PerformanceMonitorProps {
  animationManager: AttackAnimationManager;
}

/**
 * Optimized trajectory component using pre-calculated frames
 */
const AttackTrajectory: React.FC<AttackTrajectoryProps> = React.memo(({ 
  attackId, 
  frame, 
  attack, 
  settings 
}) => {
  const lineRef = useRef<Line>(null);
  const materialRef = useRef<LineBasicMaterial>(null);

  // Update position and opacity each frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.opacity = frame.opacity * (settings.overlayOpacity / 100);
    }
  });

  // Memoize geometry to prevent recreations
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array([
      frame.position.x, frame.position.y, frame.position.z,
      frame.position.x, frame.position.y, frame.position.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [frame.position]);

  // Severity-based color mapping
  const color = useMemo(() => {
    switch (attack.severity) {
      case 5: return '#ff0000'; // Critical - Red
      case 4: return '#ff4500'; // High - Orange Red
      case 3: return '#ffa500'; // Medium - Orange
      case 2: return '#ffff00'; // Low - Yellow
      case 1: return '#00ff00'; // Info - Green
      default: return '#ffffff';
    }
  }, [attack.severity]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={frame.opacity * (settings.overlayOpacity / 100)}
        linewidth={2}
      />
    </line>
  );
});

/**
 * Attack marker component for source/target visualization
 */
const AttackMarker: React.FC<AttackMarkerProps> = React.memo(({ 
  position, 
  attack, 
  opacity 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Subtle pulse animation
      const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const markerSize = useMemo(() => {
    return attack.severity * 0.5 + 0.5; // Size based on severity
  }, [attack.severity]);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[markerSize, 8, 8]} />
      <meshBasicMaterial
        color={attack.severity >= 4 ? '#ff0000' : '#ffa500'}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
});

/**
 * Performance monitoring component
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ animationManager }) => {
  const [metrics, setMetrics] = React.useState({
    activeAnimations: 0,
    frameRate: 0,
    memoryUsage: 0
  });

  useFrame((state, delta) => {
    // Update metrics every second
    if (Date.now() % 1000 < 16) {
      const perfMetrics = animationManager.getPerformanceMetrics();
      setMetrics({
        activeAnimations: perfMetrics.activeAnimations,
        frameRate: Math.round(1 / delta),
        memoryUsage: perfMetrics.memoryUsage
      });
    }
  });

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <Text
      position={[0, 10, 0]}
      fontSize={0.5}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      {`FPS: ${metrics.frameRate} | Animations: ${metrics.activeAnimations} | Memory: ${Math.round(metrics.memoryUsage / 1024)}KB`}
    </Text>
  );
};

/**
 * Main visualization component
 */
const CyberAttacksScene: React.FC<{ 
  globeRadius: number;
  settings: any;
}> = ({ globeRadius, settings }) => {
  const { camera } = useThree();
  const animationManagerRef = useRef<AttackAnimationManager | null>(null);
  const serviceRef = useRef<RealTimeAttackService | null>(null);
  const [activeFrames, setActiveFrames] = React.useState<Map<string, AnimationFrame>>(new Map());
  const [attackData, setAttackData] = React.useState<Map<string, CyberAttackData>>(new Map());

  // Initialize animation manager
  useEffect(() => {
    animationManagerRef.current = new AttackAnimationManager(
      globeRadius,
      settings.trajectorySpeed || 1.0
    );

    return () => {
      animationManagerRef.current?.dispose();
    };
  }, [globeRadius]);

  // Initialize real-time service
  useEffect(() => {
    serviceRef.current = new RealTimeAttackService();

    const handleAttackUpdate = (attacks: CyberAttackData[]) => {
      const manager = animationManagerRef.current;
      if (!manager) return;

      const newAttackData = new Map(attackData);

      attacks.forEach(attack => {
        // Apply filtering based on settings
        if (!shouldShowAttack(attack, settings)) {
          return;
        }

        newAttackData.set(attack.id, attack);

        // Create animation if not exists
        if (!activeFrames.has(attack.id)) {
          manager.createAttackAnimation(attack);
        }
      });

      setAttackData(newAttackData);
    };

    serviceRef.current.subscribeToAttacks(handleAttackUpdate);

    return () => {
      serviceRef.current?.dispose();
    };
  }, [settings]);

  // Animation loop
  useFrame(() => {
    const manager = animationManagerRef.current;
    if (!manager) return;

    const currentFrames = manager.updateAnimations(Date.now());
    setActiveFrames(currentFrames);
  });

  // Update animation speed when settings change
  useEffect(() => {
    const manager = animationManagerRef.current;
    if (manager && settings.trajectorySpeed) {
      manager.setAnimationSpeed(settings.trajectorySpeed);
    }
  }, [settings.trajectorySpeed]);

  // Position camera
  useEffect(() => {
    camera.position.set(0, 0, globeRadius * 3);
    camera.lookAt(0, 0, 0);
  }, [camera, globeRadius]);

  return (
    <>
      {/* Performance monitoring */}
      {animationManagerRef.current && (
        <PerformanceMonitor animationManager={animationManagerRef.current} />
      )}

      {/* Render active attack trajectories */}
      {Array.from(activeFrames.entries()).map(([attackId, frame]) => {
        const attack = attackData.get(attackId);
        if (!attack) return null;

        return (
          <React.Fragment key={attackId}>
            {/* Trajectory animation */}
            {settings.showTrajectories && (
              <AttackTrajectory
                attackId={attackId}
                frame={frame}
                attack={attack}
                settings={settings}
              />
            )}

            {/* Source marker */}
            <AttackMarker
              position={new Vector3().copy(frame.position)}
              attack={attack}
              opacity={frame.opacity}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * Filter function to determine if attack should be shown
 */
function shouldShowAttack(attack: CyberAttackData, settings: any): boolean {
  // Attack type filtering
  const typeKey = attack.attack_type.toLowerCase().replace('_', '');
  const showTypeKey = `show${attack.attack_type}` as keyof typeof settings.attackFiltering;
  
  if (settings.attackFiltering?.[showTypeKey] === false) {
    return false;
  }

  // Severity filtering
  if (attack.severity < (settings.minSeverity || 1)) {
    return false;
  }

  // Additional filtering can be added here
  return true;
}

/**
 * Main exported component
 */
export const CyberAttacksVisualization: React.FC<CyberAttacksVisualizationProps> = ({
  enabled = true,
  globeRadius = 100
}) => {
  const { config } = useCyberCommandSettings();
  const settings = config.cyberAttacks;

  if (!enabled) return null;

  return (
    <Canvas>
      <CyberAttacksScene 
        globeRadius={globeRadius} 
        settings={settings}
      />
    </Canvas>
  );
};

export default CyberAttacksVisualization;
