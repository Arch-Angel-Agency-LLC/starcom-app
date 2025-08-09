// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { useGlobeLoading } from '../../context/GlobeLoadingContext';
import { GlobeEngine } from '../../globe-engine/GlobeEngine';
import { useSpaceWeatherContext } from '../../context/SpaceWeatherContext';
import GlobeLoadingManager from './GlobeLoadingManager';
import { useIntelReport3DMarkers } from '../../hooks/useIntelReport3DMarkers';
import { useCyberThreats3D } from '../../hooks/useCyberThreats3D';
import { useCyberAttacks3D } from '../../hooks/useCyberAttacks3D';
import { intelReportVisualizationService } from '../../services/IntelReportVisualizationService';
import { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';
import { Enhanced3DGlobeInteractivity } from './Enhanced3DGlobeInteractivity';
import { useGlobeSolarSystemIntegration } from './GlobeSolarSystemIntegration';
import GlobePerformanceMonitor from './GlobePerformanceMonitor';
// Cyber visualization services
import { ThreatIntelligenceService } from '../../services/CyberThreats/ThreatIntelligenceService';
import { RealTimeAttackService } from '../../services/CyberAttacks/RealTimeAttackService';
import type { CyberThreatData } from '../../types/CyberThreats';
import type { CyberAttackData } from '../../types/CyberAttacks';

// Define ModelInstance interface locally since it's used in multiple files
interface ModelInstance {
  positionContainer: THREE.Group;
  orientationContainer: THREE.Group;
  rotationContainer: THREE.Group;
  mesh: THREE.Object3D;
  report: IntelReportOverlayMarker;
  basePosition: THREE.Vector3;
  hoverOffset: number;
  localRotationY: number;
}

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<object[]>([]);
  const globeRef = useRef<GlobeMethods>();
  const { visualizationMode } = useVisualizationMode();
  const { hasGlobeLoadedBefore, markGlobeAsLoaded, setGlobeInitialized } = useGlobeLoading();
  const [globeEngine, setGlobeEngine] = useState<GlobeEngine | null>(null);
  const [material, setMaterial] = useState<THREE.Material | null>(null);
  const bordersRef = useRef<THREE.Group>(new THREE.Group()); // Initialized for NationalTerritories
  const territoriesRef = useRef<THREE.Group>(new THREE.Group()); // Initialized for future territory fill
  
  // Intel Report 3D markers state
  const [intelReports, setIntelReports] = useState<IntelReportOverlayMarker[]>([]);
  const intelMarkerGroupRef = useRef<THREE.Group>(new THREE.Group());
  const [intelModels, setIntelModels] = useState<ModelInstance[]>([]); // Store 3D model instances for interactivity
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null); // Track hovered model

  // CyberThreats and CyberAttacks visualization state
  const cyberThreatsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const cyberAttacksGroupRef = useRef<THREE.Group>(new THREE.Group());
  const networkInfraGroupRef = useRef<THREE.Group>(new THREE.Group());
  const commHubsGroupRef = useRef<THREE.Group>(new THREE.Group());
  
  // Cyber data services and state
  const threatServiceRef = useRef<ThreatIntelligenceService | null>(null);
  const attackServiceRef = useRef<RealTimeAttackService | null>(null);
  const [cyberThreatsData, setCyberThreatsData] = useState<CyberThreatData[]>([]);
  const [cyberAttacksData, setCyberAttacksData] = useState<CyberAttackData[]>([]);
  const [cyberDataLoading, setCyberDataLoading] = useState(false);
  
  // Space weather integration via context
  const { 
    visualizationVectors 
    // isLoading: _spaceWeatherLoading,
    // error: _spaceWeatherError 
  } = useSpaceWeatherContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(!hasGlobeLoadedBefore);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Solar system integration (optional feature - can be enabled/disabled)
  // Only activate in compatible visualization modes to prevent conflicts
  const solarSystemEnabled = visualizationMode.mode === 'EcoNatural' || 
                              (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode !== 'IntelReports');
  
  const _solarSystemIntegration = useGlobeSolarSystemIntegration({
    globeRef,
    enabled: solarSystemEnabled, // Only enable in compatible modes
    debugMode: false, // Disabled debug mode to reduce console noise
    onStateChange: (state) => {
      // Optional: Handle solar system state changes for UI updates
      if (state.sunState?.isVisible) {
        console.log(`Sun is now visible in ${state.currentContext} scale`);
      }
      console.log('Solar system state change:', state);
    }
  });

  useEffect(() => {
    // Fast track initialization if Globe has loaded before
    const initDelay = hasGlobeLoadedBefore ? 0 : 800; // No delay for subsequent loads
    
    const initTimer = setTimeout(() => {
      const engine = new GlobeEngine({ mode: visualizationMode.mode });
      setGlobeEngine(engine);
      
      // Check for material with appropriate timing
      const materialCheckInterval = hasGlobeLoadedBefore ? 10 : 100; // Faster checks for subsequent loads
      const checkMaterial = setInterval(() => {
        const mat = engine.getMaterial();
        if (mat) {
          setMaterial(mat);
          // Mark as ready for rendering
          const readyDelay = hasGlobeLoadedBefore ? 0 : 100; // Instant for subsequent loads
          setTimeout(() => {
            setIsInitializing(false);
            setGlobeInitialized(true);
            if (!hasGlobeLoadedBefore) {
              markGlobeAsLoaded(); // Mark as loaded only on first successful initialization
            }
          }, readyDelay);
          clearInterval(checkMaterial);
        }
      }, materialCheckInterval);
      
      return () => clearInterval(checkMaterial);
    }, initDelay);

    return () => clearTimeout(initTimer);
  }, [visualizationMode.mode, hasGlobeLoadedBefore, markGlobeAsLoaded, setGlobeInitialized]);

  // Track container size for responsive Globe
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use the full available space, only enforce minimum for very small screens
        setContainerSize({ 
          width: Math.max(rect.width, 200), 
          height: Math.max(rect.height, 200) 
        });
      }
    };

    // Initial size
    updateSize();

    // Create ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as backup
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    // Example: update globe data if needed (can be extended for overlays)
    setGlobeData([]); // TODO: Use overlay/event data from GlobeEngine if needed
  }, [globeEngine]);

  // Intel Report 3D markers integration - only show when CyberCommand + IntelReports mode
  useEffect(() => {
    let mounted = true;
    let currentLoadRequest: Promise<void> | null = null;

    // Only fetch Intel Reports when in the correct visualization mode
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
      // Prevent duplicate loading if already in progress
      if (currentLoadRequest) {
        return;
      }

      // Fetch Intel Reports for 3D visualization
      currentLoadRequest = (async () => {
        try {
          const markers = await intelReportVisualizationService.getIntelReportMarkers({
            maxReports: 25 // Reduced from 50 for better performance
          });
          
          if (mounted) {
            setIntelReports(markers);
            console.log(`📊 Loaded ${markers.length} Intel Report 3D markers for CyberCommand/IntelReports mode`);
          }
        } catch (error) {
          if (mounted) {
            console.error('Error loading Intel Report markers:', error);
          }
        } finally {
          currentLoadRequest = null;
        }
      })();

      // Set up periodic refresh (every 60 seconds instead of 30) only when in correct mode
      const interval = setInterval(() => {
        if (mounted && visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') {
          currentLoadRequest = (async () => {
            try {
              const markers = await intelReportVisualizationService.getIntelReportMarkers({
                maxReports: 25
              });
              if (mounted) {
                setIntelReports(markers);
              }
            } catch (error) {
              if (mounted) {
                console.error('Error refreshing Intel Report markers:', error);
              }
            } finally {
              currentLoadRequest = null;
            }
          })();
        }
      }, 60000); // Increased from 30s to 60s

      return () => {
        mounted = false;
        clearInterval(interval);
        currentLoadRequest = null;
      };
    } else {
      // Clear Intel Reports when not in the correct mode
      if (mounted) {
        setIntelReports([]);
        console.log('🧹 Intel Report 3D markers cleared - not in CyberCommand/IntelReports mode');
      }
    }

    return () => {
      mounted = false;
    };
  }, [visualizationMode.mode, visualizationMode.subMode]);

  // Add Intel Report 3D markers to the Globe scene - respect visualization mode
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    const intelGroup = intelMarkerGroupRef.current;

    if (scene && intelGroup) {
      // Only add to scene if we're in the correct visualization mode and have reports
      if (visualizationMode.mode === 'CyberCommand' && 
          visualizationMode.subMode === 'IntelReports' && 
          intelReports.length > 0 &&
          !scene.children.includes(intelGroup)) {
        scene.add(intelGroup);
        console.log('Intel Report 3D marker group added to Globe scene');
      } else if (scene.children.includes(intelGroup)) {
        // Remove from scene if mode changed or no reports
        scene.remove(intelGroup);
        console.log('Intel Report 3D marker group removed from Globe scene');
      }
    }

    return () => {
      if (scene && intelGroup) {
        scene.remove(intelGroup);
      }
    };
  }, [globeRef, intelReports, visualizationMode.mode, visualizationMode.subMode]);

  // =============================================================================
  // CYBER THREATS DATA INTEGRATION - Real data loading and visualization
  // =============================================================================
  useEffect(() => {
    let mounted = true;
    let dataRefreshInterval: NodeJS.Timeout | null = null;

    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberThreats') {
      console.log('🔒 CYBER THREATS MODE ACTIVATED - Loading real threat data');
      
      // Initialize threat service if not already done
      if (!threatServiceRef.current) {
        threatServiceRef.current = new ThreatIntelligenceService({
          updateInterval: 10000, // 10 seconds
          maxActiveThreatss: 1000,
          enableGeographicCorrelation: true,
          enableTemporalCorrelation: true,
          debugMode: process.env.NODE_ENV === 'development'
        });
      }

      const loadThreatData = async () => {
        if (!mounted || !threatServiceRef.current) return;
        
        try {
          setCyberDataLoading(true);
          console.log('� Fetching cyber threat intelligence data...');
          
          const threatData = await threatServiceRef.current.getData({
            limit: 100, // Limit for performance
            target_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'], // Focus regions
            severity_min: 3, // Medium severity and above
            time_window: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              end: new Date()
            },
            sort_by: 'severity',
            sort_order: 'desc'
          });
          
          if (mounted) {
            setCyberThreatsData(threatData);
            console.log(`🔒 Loaded ${threatData.length} cyber threat data points`);
          }
        } catch (error) {
          if (mounted) {
            console.error('Error loading cyber threat data:', error);
            // Fallback to mock data for development
            console.log('� Using mock threat data for development');
          }
        } finally {
          if (mounted) {
            setCyberDataLoading(false);
          }
        }
      };

      // Initial data load
      loadThreatData();

      // Set up periodic data refresh
      dataRefreshInterval = setInterval(() => {
        if (mounted && visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberThreats') {
          loadThreatData();
        }
      }, 30000); // Refresh every 30 seconds

      return () => {
        mounted = false;
        if (dataRefreshInterval) {
          clearInterval(dataRefreshInterval);
        }
      };
    } else {
      // Clear data when leaving CyberThreats mode
      if (mounted) {
        setCyberThreatsData([]);
        console.log('🧹 Cyber threats data cleared - left CyberThreats mode');
      }
    }

    return () => {
      mounted = false;
    };
  }, [visualizationMode.mode, visualizationMode.subMode]);

  // =============================================================================
  // CYBER ATTACKS DATA INTEGRATION - Real data loading and visualization  
  // =============================================================================
  useEffect(() => {
    let mounted = true;
    let dataRefreshInterval: NodeJS.Timeout | null = null;

    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberAttacks') {
      console.log('⚡ CYBER ATTACKS MODE ACTIVATED - Loading real attack data');
      
      // Initialize attack service if not already done
      if (!attackServiceRef.current) {
        attackServiceRef.current = new RealTimeAttackService();
      }

      const loadAttackData = async () => {
        if (!mounted || !attackServiceRef.current) return;
        
        try {
          setCyberDataLoading(true);
          console.log('📡 Fetching real-time cyber attack data...');
          
          const attackData = await attackServiceRef.current.getData({
            limit: 150, // More attacks for dynamic visualization
            time_window: {
              start: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
              end: new Date()
            },
            attack_statuses: ['detected', 'in_progress', 'escalated'],
            severity_min: 3, // Medium severity (3) and above
            real_time: true
          });
          
          if (mounted) {
            setCyberAttacksData(attackData);
            console.log(`⚡ Loaded ${attackData.length} cyber attack data points`);
          }
        } catch (error) {
          if (mounted) {
            console.error('Error loading cyber attack data:', error);
            // Fallback to mock data for development
            console.log('🔧 Using mock attack data for development');
          }
        } finally {
          if (mounted) {
            setCyberDataLoading(false);
          }
        }
      };

      // Initial data load
      loadAttackData();

      // Set up faster refresh for real-time attacks
      dataRefreshInterval = setInterval(() => {
        if (mounted && visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberAttacks') {
          loadAttackData();
        }
      }, 15000); // Refresh every 15 seconds for more dynamic feel

      return () => {
        mounted = false;
        if (dataRefreshInterval) {
          clearInterval(dataRefreshInterval);
        }
      };
    } else {
      // Clear data when leaving CyberAttacks mode
      if (mounted) {
        setCyberAttacksData([]);
        console.log('🧹 Cyber attacks data cleared - left CyberAttacks mode');
      }
    }

    return () => {
      mounted = false;
    };
  }, [visualizationMode.mode, visualizationMode.subMode]);

  // =============================================================================
  // SATELLITES INTEGRATION - Real satellite tracking (MVP)
  // =============================================================================
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    const satellitesGroup = networkInfraGroupRef.current; // Reuse existing group

    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'Satellites') {
      console.log('🛰️ SATELLITES MODE ACTIVATED - Enhanced satellite tracking');
      console.log('📊 Data Source: CelesTrak with intelligent curation');
      console.log('🎯 Showing: ~100 carefully selected satellites from 21K+ database');
      
      // Add satellitesGroup to scene
      if (scene && satellitesGroup && !scene.children.includes(satellitesGroup)) {
        scene.add(satellitesGroup);
        console.log('🛰️ Satellites visualization group added to Globe scene');
        
        // Load satellite data with new service
        import('../../services/Satellites/SatelliteVisualizationService').then(({ satelliteVisualizationService }) => {
          // Initialize service if not already done
          satelliteVisualizationService.initialize().then(() => {
            return satelliteVisualizationService.getSatelliteData();
          }).then(satellites => {
            console.log(`🛰️ Loaded ${satellites.length} satellites for visualization`);
            
            // Clear previous satellites
            while (satellitesGroup.children.length > 0) {
              const child = satellitesGroup.children[0];
              satellitesGroup.remove(child);
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (child.material instanceof THREE.Material) {
                  child.material.dispose();
                }
              }
            }
            
            // Use Three.js InstancedMesh for better performance with many satellites
            const maxSatellites = Math.max(100, satellites.length);
            const geometry = new THREE.SphereGeometry(0.3, 8, 6); // Small, low-poly spheres
            const material = new THREE.MeshBasicMaterial({ 
              transparent: true,
              opacity: 0.8
            });
            
            const instancedMesh = new THREE.InstancedMesh(geometry, material, maxSatellites);
            const tempMatrix = new THREE.Matrix4();
            const tempColor = new THREE.Color();
            
            // Create satellite markers using instanced rendering
            satellites.forEach((satellite, index) => {
              const { lat, lng, altitude, type } = satellite;
              
              // Convert lat/lng/alt to 3D position
              const phi = (90 - lat) * (Math.PI / 180);
              const theta = (lng + 180) * (Math.PI / 180);
              const radius = 100 + (altitude / 1000); // Scale altitude for visibility
              
              const position = new THREE.Vector3(
                -radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
              );
              
              // Set instance matrix (position and scale)
              const scale = type === 'space_station' ? 2.0 : 
                           type === 'scientific' ? 1.5 :
                           type === 'gps_satellite' ? 1.2 : 1.0;
              
              tempMatrix.compose(position, new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
              instancedMesh.setMatrixAt(index, tempMatrix);
              
              // Set instance color
              const color = type === 'space_station' ? 0x00ff88 : // Green for stations
                           type === 'scientific' ? 0xff8800 : // Orange for scientific
                           type === 'gps_satellite' ? 0x4488ff : // Blue for GPS
                           type === 'starlink' ? 0xaaaaaa : // Gray for Starlink
                           type === 'weather' ? 0x88ff44 : // Light green for weather
                           type === 'communication' ? 0xff4488 : // Pink for communication
                           0xffffff; // White for others
              
              tempColor.setHex(color);
              instancedMesh.setColorAt(index, tempColor);
              
              // Store metadata for interaction (will be used in Phase 3)
              if (index === 0) {
                instancedMesh.userData = {
                  type: 'satelliteGroup',
                  satellites: satellites.map(sat => ({
                    id: sat.id,
                    name: sat.name,
                    type: sat.type,
                    altitude: sat.altitude,
                    position: { lat: sat.lat, lng: sat.lng }
                  }))
                };
              }
            });
            
            // Update instance matrices and colors
            instancedMesh.instanceMatrix.needsUpdate = true;
            if (instancedMesh.instanceColor) {
              instancedMesh.instanceColor.needsUpdate = true;
            }
            
            satellitesGroup.add(instancedMesh);
            console.log(`🛰️ Created instanced satellite visualization with ${satellites.length} satellites`);
          }).catch(error => {
            console.error('🛰️ Failed to load satellite data:', error);
            
            // Fallback: Show a few demo satellites
            const fallbackGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
            
            const issMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            issMesh.position.set(0, 110, 0); // Above Earth
            issMesh.userData = { type: 'satellite', name: 'ISS (Fallback)', id: 'iss-fallback' };
            satellitesGroup.add(issMesh);
            
            console.log('🛰️ Added fallback satellite visualization');
          });
        });
      }
    } else {
      // Remove from scene if mode changed
      if (scene && satellitesGroup && scene.children.includes(satellitesGroup)) {
        scene.remove(satellitesGroup);
        console.log('🛰️ Satellites visualization group removed from Globe scene');
      }
    }

    return () => {
      if (scene && satellitesGroup) {
        scene.remove(satellitesGroup);
      }
    };
  }, [globeRef, visualizationMode.mode, visualizationMode.subMode]);

  // =============================================================================
  // COMMUNICATION HUBS INTEGRATION - New mode integration
  // =============================================================================
  useEffect(() => {
    if (!globeRef.current) return;

    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj?.scene();
    const commGroup = commHubsGroupRef.current;

    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CommHubs') {
      console.log('📡 COMMUNICATION HUBS MODE ACTIVATED - New Integration Point');
      console.log('📊 Data Source: CommunicationHubsService (to be created)');
      console.log('🎯 Ready for: Satellite uplinks, radio towers, submarine cables, relay stations');
      
      // Add commGroup to scene
      if (scene && commGroup && !scene.children.includes(commGroup)) {
        scene.add(commGroup);
        console.log('📡 Communication Hubs visualization group added to Globe scene');
        
        // TODO: Create CommunicationHubsService
        // TODO: Add satellite constellation visualization
        // TODO: Add radio tower networks
        // TODO: Add submarine cable routes
        // TODO: Add relay station markers
      }
    } else {
      // Remove from scene if mode changed
      if (scene && commGroup && scene.children.includes(commGroup)) {
        scene.remove(commGroup);
        console.log('📡 Communication Hubs visualization group removed from Globe scene');
      }
    }

    return () => {
      if (scene && commGroup) {
        scene.remove(commGroup);
      }
    };
  }, [globeRef, visualizationMode.mode, visualizationMode.subMode]);

  // Initialize 3D Intel Report markers using the hook - capture models for interactivity
  const { models: intel3DModels } = useIntelReport3DMarkers(
    // Pass reports only when in correct visualization mode
    (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'IntelReports') 
      ? intelReports 
      : [], 
    globeRef.current ? (globeRef.current as unknown as { scene: () => THREE.Scene }).scene() : null,
    globeRef.current ? (globeRef.current as unknown as { camera: () => THREE.Camera }).camera() : null,
    null, // No longer need globe object reference
    {
      globeRadius: 100,
      hoverAltitude: 10,  // Reduced from 12 to 10
      rotationSpeed: 0.003, // Reduced from 0.005 to 0.003 for better performance
      scale: 3.0  // Reduced from 4.0 to 3.0
    },
    hoveredReportId // Pass the currently hovered report ID
  );

  // Initialize CyberThreats 3D visualization using the new hook
  const cyberThreats = useCyberThreats3D(
    visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberThreats',
    globeRef.current ? (globeRef.current as unknown as { scene: () => THREE.Scene }).scene() : null,
    globeRef.current ? (globeRef.current as unknown as { camera: () => THREE.Camera }).camera() : null,
    {
      globeRadius: 100,
      updateInterval: 5000,
      enableHeatMap: true,
      debugMode: process.env.NODE_ENV === 'development'
    }
  );

  // Initialize CyberAttacks 3D visualization using the new hook
  const cyberAttacks = useCyberAttacks3D(
    visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberAttacks',
    globeRef.current ? (globeRef.current as unknown as { scene: () => THREE.Scene }).scene() : null,
    globeRef.current ? (globeRef.current as unknown as { camera: () => THREE.Camera }).camera() : null,
    {
      globeRadius: 100,
      updateInterval: 2000,
      enableTrajectories: true,
      trajectorySpeed: 1.0,
      debugMode: process.env.NODE_ENV === 'development'
    }
  );

  // Update the models state when intel3DModels changes
  useEffect(() => {
    setIntelModels(intel3DModels);
  }, [intel3DModels]);

  // Monitor CyberThreats hook status
  useEffect(() => {
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberThreats') {
      console.log(`🔒 CYBER THREATS 3D HOOK STATUS: ${cyberThreats.threats.length} threats loaded, Loading: ${cyberThreats.isLoading}`);
      if (cyberThreats.error) {
        console.error('🔒 CyberThreats Hook Error:', cyberThreats.error);
      }
      setCyberDataLoading(cyberThreats.isLoading);
    }
  }, [visualizationMode.mode, visualizationMode.subMode, cyberThreats.threats.length, cyberThreats.isLoading, cyberThreats.error]);

  // Monitor CyberAttacks hook status
  useEffect(() => {
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberAttacks') {
      console.log(`⚡ CYBER ATTACKS 3D HOOK STATUS: ${cyberAttacks.attacks.length} attacks loaded, Loading: ${cyberAttacks.isLoading}`);
      if (cyberAttacks.error) {
        console.error('⚡ CyberAttacks Hook Error:', cyberAttacks.error);
      }
      setCyberDataLoading(cyberAttacks.isLoading);
    }
  }, [visualizationMode.mode, visualizationMode.subMode, cyberAttacks.attacks.length, cyberAttacks.isLoading, cyberAttacks.error]);

  // =============================================================================
  // CYBER THREATS 3D VISUALIZATION - Real animated data-driven visualization
  // =============================================================================
  useEffect(() => {
    if (!globeRef.current || cyberThreatsData.length === 0) return;
    
    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj && globeObj.scene();
    const cyberThreatsGroup = cyberThreatsGroupRef.current;
    
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberThreats') {
      console.log(`🔒 CYBER THREATS 3D VISUALIZATION - Rendering ${cyberThreatsData.length} threat objects`);
      
      // Clear previous visualization efficiently
      while (cyberThreatsGroup.children.length > 0) {
        const child = cyberThreatsGroup.children[0];
        cyberThreatsGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      }
      
      // Create animated threat visualizations from real data
      cyberThreatsData.forEach((threatData) => {
        const { location, category, severity, status, confidence } = threatData;
        
        // Convert lat/lng to 3D position
        const phi = (90 - location.latitude) * (Math.PI / 180);
        const theta = (location.longitude + 180) * (Math.PI / 180);
        const radius = 1.05 + (severity / 20); // Height varies by severity
        
        // Create threat geometry based on category
        let geometry: THREE.BufferGeometry;
        let color: number;
        
        switch (category) {
          case 'Malware':
            geometry = new THREE.IcosahedronGeometry(0.02 + severity * 0.005, 1);
            color = 0xff3333; // Red
            break;
          case 'APT':
            geometry = new THREE.ConeGeometry(0.015 + severity * 0.003, 0.04 + severity * 0.008, 6);
            color = 0xff1144; // Dark red
            break;
          case 'Botnet':
            geometry = new THREE.SphereGeometry(0.018 + severity * 0.004, 8, 6);
            color = 0xff6600; // Orange-red
            break;
          case 'Phishing':
            geometry = new THREE.TetrahedronGeometry(0.015 + severity * 0.003);
            color = 0xffaa00; // Orange
            break;
          case 'DataBreach':
            geometry = new THREE.OctahedronGeometry(0.02 + severity * 0.005);
            color = 0xcc0000; // Deep red
            break;
          default:
            geometry = new THREE.SphereGeometry(0.015 + severity * 0.003, 6, 4);
            color = 0xff4444; // Default red
        }
        
        // Create material with confidence-based opacity and status-based effects
        const material = new THREE.MeshBasicMaterial({ 
          color,
          transparent: true, 
          opacity: 0.7 + (confidence === 'Confirmed' ? 0.3 : 
                         confidence === 'High' ? 0.2 : 
                         confidence === 'Medium' ? 0.1 : 0),
          wireframe: status === 'Emerging' // Wireframe for emerging threats
        });
        
        const threatMarker = new THREE.Mesh(geometry, material);
        threatMarker.position.set(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
        
        // Store metadata for interactivity
        threatMarker.userData = { 
          type: 'cyber-threat', 
          id: threatData.id,
          category: threatData.category,
          severity: threatData.severity,
          name: threatData.name,
          threatData: threatData
        };
        
        // Add pulsing animation for active threats
        if (status === 'Active') {
          const animationSpeed = 0.01 + (severity * 0.002);
          threatMarker.userData.animate = () => {
            const scale = 1 + Math.sin(Date.now() * animationSpeed) * 0.3;
            threatMarker.scale.setScalar(scale);
          };
        }
        
        cyberThreatsGroup.add(threatMarker);
      });
      
      // Add group to scene only once
      if (scene && !scene.children.includes(cyberThreatsGroup)) {
        scene.add(cyberThreatsGroup);
      }
      
      console.log(`🔒 Generated ${cyberThreatsGroup.children.length} 3D threat visualization objects`);
      
    } else {
      // Clean up when leaving mode
      if (scene && scene.children.includes(cyberThreatsGroup)) {
        scene.remove(cyberThreatsGroup);
        // Dispose of geometries and materials to free memory
        cyberThreatsGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        cyberThreatsGroup.clear();
      }
    }

    return () => {
      // Cleanup on unmount
      if (scene && cyberThreatsGroup && scene.children.includes(cyberThreatsGroup)) {
        scene.remove(cyberThreatsGroup);
      }
    };
  }, [globeRef, cyberThreatsData, visualizationMode.mode, visualizationMode.subMode]);

  // =============================================================================
  // CYBER ATTACKS 3D VISUALIZATION - Real animated attack trajectories
  // =============================================================================
  useEffect(() => {
    if (!globeRef.current || cyberAttacksData.length === 0) return;
    
    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj && globeObj.scene();
    const cyberAttacksGroup = cyberAttacksGroupRef.current;
    
    if (visualizationMode.mode === 'CyberCommand' && visualizationMode.subMode === 'CyberAttacks') {
      console.log(`⚡ CYBER ATTACKS 3D VISUALIZATION - Rendering ${cyberAttacksData.length} attack objects with trajectories`);
      
      // Clear previous visualization efficiently
      while (cyberAttacksGroup.children.length > 0) {
        const child = cyberAttacksGroup.children[0];
        cyberAttacksGroup.remove(child);
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          } else if (child instanceof THREE.Line) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        }
      }
      
      // Create animated attack visualizations from real data
      cyberAttacksData.forEach((attackData) => {
        const { trajectory, attack_type, severity, attack_status } = attackData;
        
        // Source position (attack origin)
        const sourcePhi = (90 - trajectory.source.latitude) * (Math.PI / 180);
        const sourceTheta = (trajectory.source.longitude + 180) * (Math.PI / 180);
        const sourceRadius = 1.02;
        
        const sourcePosition = new THREE.Vector3(
          -sourceRadius * Math.sin(sourcePhi) * Math.cos(sourceTheta),
          sourceRadius * Math.cos(sourcePhi),
          sourceRadius * Math.sin(sourcePhi) * Math.sin(sourceTheta)
        );
        
        // Target position (attack destination)
        const targetPhi = (90 - trajectory.target.latitude) * (Math.PI / 180);
        const targetTheta = (trajectory.target.longitude + 180) * (Math.PI / 180);
        const targetRadius = 1.02;
        
        const targetPosition = new THREE.Vector3(
          -targetRadius * Math.sin(targetPhi) * Math.cos(targetTheta),
          targetRadius * Math.cos(targetPhi),
          targetRadius * Math.sin(targetPhi) * Math.sin(targetTheta)
        );
        
        // Create attack trajectory curve (great circle)
        const distance = sourcePosition.distanceTo(targetPosition);
        const midPoint = sourcePosition.clone().add(targetPosition).multiplyScalar(0.5);
        midPoint.normalize().multiplyScalar(1.15 + distance * 0.1); // Arc height based on distance
        
        const curve = new THREE.QuadraticBezierCurve3(sourcePosition, midPoint, targetPosition);
        const curveGeometry = new THREE.TubeGeometry(curve, 32, 0.003 + severity * 0.001, 8, false);
        
        // Color based on attack type and severity
        let attackColor: number;
        switch (attack_type) {
          case 'DDoS':
            attackColor = 0x00ffff; // Cyan
            break;
          case 'Malware':
            attackColor = 0xff3366; // Pink-red
            break;
          case 'Ransomware':
            attackColor = 0xff0000; // Red
            break;
          case 'DataBreach':
            attackColor = 0xffaa00; // Orange
            break;
          case 'WebAttack':
            attackColor = 0xff6600; // Orange-red
            break;
          case 'NetworkIntrusion':
            attackColor = 0x9900ff; // Purple
            break;
          case 'APT':
            attackColor = 0xcc0000; // Dark red
            break;
          case 'Botnet':
            attackColor = 0xff9900; // Orange
            break;
          default:
            attackColor = 0x00aaff; // Blue
        }
        
        const attackMaterial = new THREE.MeshBasicMaterial({ 
          color: attackColor,
          transparent: true, 
          opacity: attack_status === 'in_progress' ? 0.9 : 0.6
        });
        
        const trajectoryMesh = new THREE.Mesh(curveGeometry, attackMaterial);
        trajectoryMesh.userData = { 
          type: 'cyber-attack-trajectory', 
          id: attackData.id,
          attack_type: attackData.attack_type,
          severity: attackData.severity,
          attackData: attackData
        };
        
        cyberAttacksGroup.add(trajectoryMesh);
        
        // Source marker (attack origin)
        const sourceGeometry = new THREE.ConeGeometry(0.01 + severity * 0.002, 0.025 + severity * 0.005, 6);
        const sourceMaterial = new THREE.MeshBasicMaterial({ 
          color: attackColor,
          transparent: true,
          opacity: 0.8
        });
        const sourceMarker = new THREE.Mesh(sourceGeometry, sourceMaterial);
        sourceMarker.position.copy(sourcePosition);
        sourceMarker.lookAt(0, 0, 0);
        sourceMarker.userData = { 
          type: 'cyber-attack-source', 
          id: `${attackData.id}-source`,
          attackData: attackData
        };
        
        cyberAttacksGroup.add(sourceMarker);
        
        // Target marker (attack destination) - different shape
        const targetGeometry = new THREE.OctahedronGeometry(0.012 + severity * 0.003);
        const targetMaterial = new THREE.MeshBasicMaterial({ 
          color: attackColor,
          transparent: true,
          opacity: 0.9,
          wireframe: attack_status === 'detected'
        });
        const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
        targetMarker.position.copy(targetPosition);
        targetMarker.userData = { 
          type: 'cyber-attack-target', 
          id: `${attackData.id}-target`,
          attackData: attackData
        };
        
        cyberAttacksGroup.add(targetMarker);
        
        // Add pulsing animation for active attacks
        if (attack_status === 'in_progress') {
          const animationSpeed = 0.008 + (severity * 0.003);
          sourceMarker.userData.animate = () => {
            const scale = 1 + Math.sin(Date.now() * animationSpeed) * 0.4;
            sourceMarker.scale.setScalar(scale);
          };
          targetMarker.userData.animate = () => {
            const scale = 1 + Math.sin(Date.now() * animationSpeed + Math.PI) * 0.3;
            targetMarker.scale.setScalar(scale);
          };
        }
        
        // Trajectory flow animation (if attack is in progress)
        if (attack_status === 'in_progress') {
          trajectoryMesh.userData.animate = () => {
            // Create flowing effect by modifying material properties
            const flow = (Date.now() * 0.001) % 1;
            attackMaterial.opacity = 0.6 + Math.sin(flow * Math.PI * 2) * 0.3;
          };
        }
      });
      
      // Add group to scene only once
      if (scene && !scene.children.includes(cyberAttacksGroup)) {
        scene.add(cyberAttacksGroup);
      }
      
      console.log(`⚡ Generated ${cyberAttacksGroup.children.length} 3D attack visualization objects with trajectories`);
      
    } else {
      // Clean up when leaving mode
      if (scene && scene.children.includes(cyberAttacksGroup)) {
        scene.remove(cyberAttacksGroup);
        // Dispose of geometries and materials to free memory
        cyberAttacksGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          } else if (child instanceof THREE.Line) {
            child.geometry?.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
        cyberAttacksGroup.clear();
      }
    }

    return () => {
      // Cleanup on unmount
      if (scene && cyberAttacksGroup && scene.children.includes(cyberAttacksGroup)) {
        scene.remove(cyberAttacksGroup);
      }
    };
  }, [globeRef, cyberAttacksData, visualizationMode.mode, visualizationMode.subMode]);

  useEffect(() => {
    if (!globeRef.current) return;
    // GlobeMethods type does not expose .scene(), so we cast to the correct type
    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj && globeObj.scene();
    const bordersGroup = bordersRef.current;
    const territoriesGroup = territoriesRef.current;

    // Only manage geopolitical groups when in GeoPolitical primary mode
    const geoModeActive = visualizationMode.mode === 'GeoPolitical' && visualizationMode.subMode === 'NationalTerritories';

    // Helper to dispose group children
    const disposeChildren = (group: THREE.Group) => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
          if ((child as any).geometry) {
            (child as any).geometry.dispose?.();
          }
          const mat = (child as any).material;
            if (mat) {
              if (Array.isArray(mat)) mat.forEach(m => m.dispose?.()); else mat.dispose?.();
            }
        }
      }
    };

    // Basic loader for prototype borders (Phase 1)
    const loadBorderGeometry = async () => {
      if (!bordersGroup) return;
      // Avoid duplicate loads if already populated
      if (bordersGroup.children.length > 0) return;
      try {
        console.log('🗺️ NationalTerritories: Loading /borders.geojson');
        const res = await fetch('/borders.geojson');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson = await res.json();
        disposeChildren(bordersGroup);
        const radius = 100.2; // Slightly above globe surface
        (geojson.features || []).forEach((feature: any) => {
          if (feature?.geometry?.type === 'LineString') {
            const coords: number[][] = feature.geometry.coordinates;
            if (!Array.isArray(coords)) return;
            const pts = coords.map(coord => {
              const lng = (coord[0] || 0) * Math.PI / 180;
              const lat = (coord[1] || 0) * Math.PI / 180;
              return new THREE.Vector3(
                -radius * Math.cos(lat) * Math.cos(lng),
                radius * Math.sin(lat),
                radius * Math.cos(lat) * Math.sin(lng)
              );
            });
            if (pts.length < 2) return;
            const geom = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.85 });
            const line = new THREE.Line(geom, mat);
            bordersGroup.add(line);
          }
        });
        console.log(`🗺️ NationalTerritories: Rendered ${bordersGroup.children.length} border line(s)`);
      } catch (e) {
        console.error('🗺️ NationalTerritories: Failed to load borders', e);
      }
    };

    if (geoModeActive) {
      if (scene && bordersGroup && !scene.children.includes(bordersGroup)) {
        scene.add(bordersGroup);
        console.log('🗺️ NationalTerritories: Borders group added to scene');
        loadBorderGeometry();
      }
      if (scene && territoriesGroup && !scene.children.includes(territoriesGroup)) {
        scene.add(territoriesGroup); // Empty placeholder for future territory fills
      }
    } else {
      // Remove / cleanup when leaving mode
      if (scene && bordersGroup && scene.children.includes(bordersGroup)) {
        scene.remove(bordersGroup);
        disposeChildren(bordersGroup);
        console.log('🗺️ NationalTerritories: Borders group removed');
      }
      if (scene && territoriesGroup && scene.children.includes(territoriesGroup)) {
        scene.remove(territoriesGroup);
        disposeChildren(territoriesGroup);
      }
    }

    return () => {
      // Cleanup on unmount
      if (scene && bordersGroup && scene.children.includes(bordersGroup)) {
        scene.remove(bordersGroup);
        disposeChildren(bordersGroup);
      }
      if (scene && territoriesGroup && scene.children.includes(territoriesGroup)) {
        scene.remove(territoriesGroup);
        disposeChildren(territoriesGroup);
      }
    };
  }, [globeRef, visualizationMode.mode, visualizationMode.subMode]);

  // Add debounce utility for resize handling
  // AI-NOTE: Fix for stack overflow caused by recursive resize event dispatch
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    function handleResize() {
      // Clear any existing timeout to debounce resize calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        // Force Globe to re-render with new window dimensions
        if (globeRef.current) {
          // Access the internal controls to trigger a re-render without dispatching events
          const globeInstance = globeRef.current as unknown as { controls?: { update: () => void } };
          if (globeInstance.controls && typeof globeInstance.controls.update === 'function') {
            globeInstance.controls.update();
          }
        }
      }, 100); // Debounce resize calls by 100ms
    }

    // Handle page visibility changes
    function handleVisibilityChange() {
      if (!document.hidden) {
        // Page became visible, refresh globe
        setTimeout(() => {
          handleResize();
        }, 100);
      }
    }

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial sizing
    setTimeout(handleResize, 50);
    setTimeout(handleResize, 200);

    return () => {
      // Clear any pending debounced resize calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Space weather data visualization effect - only show when EcoNatural + SpaceWeather mode
  useEffect(() => {
    if (!globeEngine) return;
    
    // Only show space weather data when in the correct visualization mode
    const shouldShowSpaceWeather = (
      visualizationMode.mode === 'EcoNatural' && 
      visualizationMode.subMode === 'SpaceWeather' &&
      visualizationVectors.length > 0
    );
    
    if (!shouldShowSpaceWeather) {
      // Clear space weather markers when mode changed or no data
      setGlobeData(prevData => {
        const filtered = prevData.filter((d: { type?: string }) => d.type !== 'space-weather');
        // Only log if we actually removed data to prevent spam
        if (filtered.length !== prevData.length) {
          console.log('Space weather data cleared - not in EcoNatural/SpaceWeather mode');
        }
        return filtered;
      });
      return;
    }
    
    // Use pre-processed visualization vectors from context
    const spaceWeatherMarkers = visualizationVectors.map(vector => ({
      lat: vector.latitude,
      lng: vector.longitude,
      size: vector.size,
      color: vector.color,
      label: `E-Field: ${vector.magnitude.toFixed(2)} V/m`,
      magnitude: vector.magnitude,
      direction: vector.direction,
      quality: vector.quality,
      type: 'space-weather' // Add type for filtering and rendering
    }));
    
    // Update the overlay data using the new method
    globeEngine.updateSpaceWeatherVisualization(spaceWeatherMarkers);
    
    // CRITICAL: Merge space weather data into globe's point data for actual rendering
    setGlobeData(prevData => {
      // Remove existing space weather markers
      const nonSpaceWeatherData = prevData.filter((d: { type?: string }) => d.type !== 'space-weather');
      // Add new space weather markers
      return [...nonSpaceWeatherData, ...spaceWeatherMarkers];
    });
    
    console.log(`Updated space weather visualization with ${spaceWeatherMarkers.length} markers for EcoNatural/SpaceWeather mode`);
    
  }, [globeEngine, visualizationVectors, visualizationMode.mode, visualizationMode.subMode]);

  // Handle intel report creation from context menu
  const handleCreateIntelReport = (geoLocation: { lat: number; lng: number }) => {
    const { lat, lng } = geoLocation;
    
    // Create a new intel report
    const newReport: IntelReportOverlayMarker = {
      pubkey: `report-${Date.now()}`,
      title: `Intel Report - ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      author: 'Current User',
      content: `Intelligence report created at coordinates ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      timestamp: Date.now(),
      latitude: lat,
      longitude: lng,
      tags: ['user-created', 'context-menu']
    };
    
    // Add to existing reports
    setIntelReports(prev => [...prev, newReport]);
    
    console.log('📝 Intel report created from context menu:', newReport);
    alert(`Intel report created at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // =============================================================================
  // ANIMATION LOOP - Real-time animations for cyber visualizations
  // =============================================================================
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      // Animate cyber threats (pulsing for active threats)
      cyberThreatsGroupRef.current?.children.forEach(child => {
        if (child.userData.animate && typeof child.userData.animate === 'function') {
          child.userData.animate();
        }
      });
      
      // Animate cyber attacks (pulsing markers and flowing trajectories)
      cyberAttacksGroupRef.current?.children.forEach(child => {
        if (child.userData.animate && typeof child.userData.animate === 'function') {
          child.userData.animate();
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation loop when in cyber visualization modes
    if (visualizationMode.mode === 'CyberCommand' && 
        (visualizationMode.subMode === 'CyberThreats' || visualizationMode.subMode === 'CyberAttacks')) {
      animate();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [visualizationMode.mode, visualizationMode.subMode]);

  // Cleanup effect when component unmounts or visualization mode changes
  useEffect(() => {
    return () => {
      // Clean up all visualization groups
      [cyberThreatsGroupRef, cyberAttacksGroupRef, networkInfraGroupRef, commHubsGroupRef, intelMarkerGroupRef].forEach(groupRef => {
        const group = groupRef.current;
        if (group) {
          // Dispose of all geometries and materials
          group.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              } else if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              }
            }
          });
          group.clear();
        }
      });
      
      // Clear models array
      setIntelModels([]);
      setIntelReports([]);
      
      console.log('🧹 Globe cleanup completed - all visualization groups disposed');
    };
  }, []);

  return (
    <div ref={containerRef} style={{ 
      position: 'relative',
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      opacity: isInitializing ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      // Remove centering from main container to let Globe fill space
      minWidth: '100%',
      minHeight: '100%'
    }}>
      <GlobeLoadingManager 
        material={material} 
        globeEngine={globeEngine}
        fastTrackMode={false} // TODO: Implement user preference for globe loading optimization (cached vs real-time data)
      >        {/* Globe render with full space utilization */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}>
          <Globe
          ref={globeRef}
          width={containerSize.width}
          height={containerSize.height}
          pointsData={globeData.filter((d: { lat?: number; lng?: number }) => d.lat !== undefined && d.lng !== undefined)}
          pointAltitude={(d: { size?: number }) => d.size || 0.5}
          pointColor={(d: { type?: string; color?: string }) => {
            if (d.type === 'space-weather') return d.color || 'purple';
            if (d.type === 'intel') return 'orange';
            if (d.type === 'earthquake') return 'red';
            if (d.type === 'volcano') return 'purple';
            if (d.type === 'cyber') return 'cyan';
            if (d.type === 'system') return 'yellow';
            if (d.type === 'storm') return 'blue';
            if (d.type === 'cloud') return 'gray';
            return d.color || 'white';
          }}
          globeMaterial={material ?? undefined}
          // Configure renderer for optimal space usage
          rendererConfig={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false
          }}
          // Disable automatic camera positioning that might constrain view
          enablePointerInteraction={true}
          // ...existing Globe props...
        />
        </div>
        
        {/* Enhanced 3D Globe Interactivity - handles Intel Report model interactions with game-inspired 3D system */}
        <Enhanced3DGlobeInteractivity 
          globeRef={globeRef}
          intelReports={intelReports}
          visualizationMode={visualizationMode}
          models={intelModels}
          onHoverChange={setHoveredReportId}
          containerRef={containerRef}
          onCreateIntelReport={handleCreateIntelReport}
        />
        
        {/* Performance Monitor for debugging data issues */}
        <GlobePerformanceMonitor 
          enabled={process.env.NODE_ENV === 'development'}
          visualizationMode={visualizationMode}
          onPerformanceIssue={(issue) => {
            console.warn('🐌 Globe Performance Issue:', issue);
          }}
        />
        
        {/* Cyber Data Loading Indicator */}
        {cyberDataLoading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#00ffff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            {visualizationMode.subMode === 'CyberThreats' ? '🔒 Loading Threats...' : '⚡ Loading Attacks...'}
          </div>
        )}
        
        {/* Solar System Debug Panel - Temporarily disabled for performance */}
        {/* <SolarSystemDebugPanel 
          solarSystemState={solarSystemIntegration.solarSystemState ? {
            isActive: solarSystemIntegration.isActive,
            currentScale: solarSystemIntegration.currentScale || 'unknown',
            sunVisible: solarSystemIntegration.sunVisible,
            cameraDistance: solarSystemIntegration.solarSystemState.cameraDistance || 0,
            sunState: solarSystemIntegration.solarSystemState.sunState,
            planetsVisible: solarSystemIntegration.solarSystemState.planetaryInfo?.visiblePlanets,
            activePlanets: solarSystemIntegration.solarSystemState.planetaryInfo?.activePlanets
          } : null}
        /> */}
        
        {/* Borders and territories overlays would be attached to the Three.js scene here in a custom renderer or with react-three-fiber */}
      </GlobeLoadingManager>
    </div>
  );
};

export default React.memo(GlobeView);
// AI-NOTE: Refactored to use GlobeEngine. See globe-engine-api.artifact for integration details.
// Artifact references:
// - Overlay UI/UX: globe-overlays.artifact (UI/UX Guidelines)
// - Overlay logic: globe-engine-api.artifact, globe-modes.artifact