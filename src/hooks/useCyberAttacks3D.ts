// src/hooks/useCyberAttacks3D.ts
// Hook for managing CyberAttacks 3D visualization in the Globe
// Follows the proven pattern from useIntelReport3DMarkers.ts

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { RealTimeAttackService } from '../services/CyberAttacks/RealTimeAttackService';
import { useCyberCommandSettings } from './useCyberCommandSettings';
import type {
  CyberAttackData,
  CyberAttackQueryOptions
} from '../types/CyberAttacks';

// Hook options interface following the proven pattern
interface UseCyberAttacks3DOptions {
  globeRadius?: number;
  updateInterval?: number;
  maxActiveAttacks?: number;
  enableTrajectories?: boolean;
  trajectorySpeed?: number;
  debugMode?: boolean;
}

// Attack visualization instance
interface AttackInstance {
  id: string;
  meshes: THREE.Object3D[];
  attack: CyberAttackData;
  trajectory?: THREE.Line;
  progress: number;
  duration: number;
  startTime: number;
}

// Hook state interface
interface CyberAttacks3DState {
  attacks: CyberAttackData[];
  attacksGroup: THREE.Group;
  attackInstances: AttackInstance[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date;
}

export const useCyberAttacks3D = (
  isActive: boolean,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  options: UseCyberAttacks3DOptions = {}
) => {
  const {
    globeRadius = 100,
    updateInterval = 2000,
    maxActiveAttacks = 150,
    enableTrajectories = true,
    trajectorySpeed = 1.0,
    debugMode = false
  } = options;

  // State management following the proven pattern
  const [state, setState] = useState<CyberAttacks3DState>({
    attacks: [],
    attacksGroup: new THREE.Group(),
    attackInstances: [],
    isLoading: false,
    error: null,
    lastUpdate: new Date()
  });

  // Service reference
  const serviceRef = useRef<RealTimeAttackService | null>(null);
  const animationFrameRef = useRef<number>();
  const updateTimerRef = useRef<NodeJS.Timeout>();

  // Settings integration
  const { config } = useCyberCommandSettings();
  const cyberAttacksSettings = config.cyberAttacks;

  // Constants for attack visualization (extracted from disconnected component)
  const ATTACK_TYPE_COLORS = useMemo(() => ({
    DDoS: 0xff3333,         // Red
    Malware: 0xff8800,      // Orange
    Phishing: 0xffff00,     // Yellow
    Ransomware: 0x8800ff,   // Purple
    DataBreach: 0x0088ff,   // Blue
    Unknown: 0x666666       // Gray
  }), []);

  const SEVERITY_COLORS = useMemo(() => ({
    Low: 0x00ff00,         // Green
    Medium: 0xffff00,      // Yellow
    High: 0xff8800,        // Orange
    Critical: 0xff0000     // Red
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

  // Create attack trajectory visualization
  const createAttackTrajectory = useCallback((attack: CyberAttackData): THREE.Line | null => {
    if (!attack.trajectory?.source || !attack.trajectory?.target) {
      return null;
    }

    const source3D = latLngToVector3(
      attack.trajectory.source.latitude,
      attack.trajectory.source.longitude,
      globeRadius * 1.02
    );

    const target3D = latLngToVector3(
      attack.trajectory.target.latitude,
      attack.trajectory.target.longitude,
      globeRadius * 1.02
    );

    // Create curved trajectory using QuadraticBezierCurve3 (extracted from working components)
    const distance = source3D.distanceTo(target3D);
    const midPoint = new THREE.Vector3()
      .addVectors(source3D, target3D)
      .multiplyScalar(0.5);
    
    // Raise the midpoint for arc effect
    const heightFactor = Math.min(distance / (globeRadius * 0.5), 1.0);
    midPoint.multiplyScalar(1 + heightFactor * 0.3);

    const curve = new THREE.QuadraticBezierCurve3(source3D, midPoint, target3D);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on attack type and severity
    const typeColor = ATTACK_TYPE_COLORS[attack.type] || ATTACK_TYPE_COLORS.Unknown;
    const severityColor = SEVERITY_COLORS[attack.severity] || SEVERITY_COLORS.Low;
    
    // Blend type and severity colors
    const color = new THREE.Color(typeColor).lerp(new THREE.Color(severityColor), 0.3);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      linewidth: 2
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { attack, type: 'attackTrajectory' };

    return line;
  }, [latLngToVector3, globeRadius, ATTACK_TYPE_COLORS, SEVERITY_COLORS]);

  // Create attack source/target markers
  const createAttackMarkers = useCallback((attack: CyberAttackData): THREE.Object3D[] => {
    const markers: THREE.Object3D[] = [];

    if (!attack.trajectory?.source || !attack.trajectory?.target) {
      return markers;
    }

    // Source marker
    const sourcePos = latLngToVector3(
      attack.trajectory.source.latitude,
      attack.trajectory.source.longitude,
      globeRadius * 1.03
    );

    const sourceGeometry = new THREE.SphereGeometry(0.02, 8, 6);
    const sourceColor = ATTACK_TYPE_COLORS[attack.type] || ATTACK_TYPE_COLORS.Unknown;
    const sourceMaterial = new THREE.MeshBasicMaterial({
      color: sourceColor,
      transparent: true,
      opacity: 0.8
    });

    const sourceMarker = new THREE.Mesh(sourceGeometry, sourceMaterial);
    sourceMarker.position.copy(sourcePos);
    sourceMarker.userData = { attack, type: 'attackSource' };
    markers.push(sourceMarker);

    // Target marker
    const targetPos = latLngToVector3(
      attack.trajectory.target.latitude,
      attack.trajectory.target.longitude,
      globeRadius * 1.03
    );

    const targetGeometry = new THREE.ConeGeometry(0.015, 0.04, 6);
    const targetColor = SEVERITY_COLORS[attack.severity] || SEVERITY_COLORS.Low;
    const targetMaterial = new THREE.MeshBasicMaterial({
      color: targetColor,
      transparent: true,
      opacity: 0.8
    });

    const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
    targetMarker.position.copy(targetPos);
    targetMarker.userData = { attack, type: 'attackTarget' };
    markers.push(targetMarker);

    return markers;
  }, [latLngToVector3, globeRadius, ATTACK_TYPE_COLORS, SEVERITY_COLORS]);

  // Initialize service
  useEffect(() => {
    if (!isActive) return;

    if (!serviceRef.current) {
      serviceRef.current = new RealTimeAttackService();

      if (debugMode) {
        console.log('⚡ CyberAttacks3D: Service initialized');
      }
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
        if (debugMode) {
          console.log('⚡ CyberAttacks3D: Service disposed');
        }
      }
    };
  }, [isActive, debugMode]);

  // Add attacks group to scene
  useEffect(() => {
    if (!scene || !isActive) return;

    const attacksGroup = state.attacksGroup;
    scene.add(attacksGroup);

    return () => {
      scene.remove(attacksGroup);
    };
  }, [scene, isActive, state.attacksGroup]);

  // Load attack data
  const loadAttackData = useCallback(async () => {
    if (!serviceRef.current || !isActive) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Build query options from settings
      const queryOptions: CyberAttackQueryOptions = {
        limit: maxActiveAttacks,
        time_window: {
          start: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
          end: new Date()
        },
        attack_statuses: ['detected', 'in_progress', 'escalated'],
        severity_min: 3, // Medium severity and above
        real_time: true
      };

      const attacks = await serviceRef.current.getData(queryOptions);

      if (debugMode) {
        console.log(`⚡ CyberAttacks3D: Loaded ${attacks.length} attacks`);
      }

      setState(prev => ({
        ...prev,
        attacks,
        isLoading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      console.error('Error loading cyber attacks data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [serviceRef, isActive, maxActiveAttacks, debugMode]);

  // Update visualization when attacks change
  useEffect(() => {
    if (!isActive || state.attacks.length === 0) return;

    // Clear existing visualization
    state.attacksGroup.clear();

    // Create attack instances
    const attackInstances: AttackInstance[] = [];
    const currentTime = Date.now();

    state.attacks.forEach((attack) => {
      const meshes = createAttackMarkers(attack);
      const trajectory = enableTrajectories ? createAttackTrajectory(attack) : undefined;
      
      const instance: AttackInstance = {
        id: attack.id,
        meshes,
        attack,
        trajectory: trajectory || undefined,
        progress: 0,
        duration: (2 + Math.random() * 3) / trajectorySpeed, // 2-5 seconds
        startTime: currentTime + Math.random() * 1000 // Stagger start times
      };

      attackInstances.push(instance);
      
      // Add meshes to group
      meshes.forEach(mesh => state.attacksGroup.add(mesh));
      if (trajectory) {
        state.attacksGroup.add(trajectory);
      }
    });

    setState(prev => ({ ...prev, attackInstances }));

    if (debugMode) {
      console.log(`⚡ CyberAttacks3D: Created ${attackInstances.length} attack visualizations`);
    }

  }, [isActive, state.attacks, createAttackMarkers, createAttackTrajectory, enableTrajectories, trajectorySpeed, debugMode, state.attacksGroup]);

  // Animation loop for trajectory progression
  useEffect(() => {
    if (!isActive || state.attackInstances.length === 0) return;

    const animate = () => {
      const currentTime = Date.now();

      state.attackInstances.forEach(instance => {
        const { trajectory, startTime, duration } = instance;
        
        if (trajectory && currentTime >= startTime) {
          const elapsed = (currentTime - startTime) / 1000;
          const progress = Math.min(elapsed / duration, 1.0);
          
          // Update trajectory visibility based on progress
          if (progress < 1.0) {
            // Animate trajectory by adjusting material opacity
            const material = trajectory.material as THREE.LineBasicMaterial;
            material.opacity = 0.7 * (1 - progress * 0.5);
            
            // Pulse effect for active attacks
            const pulseOpacity = 0.3 + Math.sin(currentTime * 0.01) * 0.4;
            material.opacity = Math.max(material.opacity * pulseOpacity, 0.1);
          }
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
  }, [isActive, state.attackInstances]);

  // Auto-refresh data
  useEffect(() => {
    if (!isActive) return;

    // Initial load
    loadAttackData();

    // Set up refresh timer
    updateTimerRef.current = setInterval(loadAttackData, updateInterval);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [isActive, loadAttackData, updateInterval]);

  // Return hook interface following the proven pattern
  return {
    attacks: state.attacks,
    attacksGroup: state.attacksGroup,
    attackInstances: state.attackInstances,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refresh: loadAttackData
  };
};
