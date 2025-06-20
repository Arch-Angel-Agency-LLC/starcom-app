import React, { useEffect, useRef, useState } from 'react';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import styles from './TinyGlobe.module.css';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { GlobeEngine } from '../../globe-engine/GlobeEngine';
import * as THREE from 'three';
import type { GlobeEvent } from '../../globe-engine/GlobeEngine';

type OverlayPayload = { overlay: string; data: object[] };

const TinyGlobe: React.FC = () => {
    const { focusLocation } = useGlobeContext();
    const { visualizationMode, setVisualizationMode, setPrimaryMode } = useVisualizationMode();
    const globeRef = useRef<GlobeMethods>();
    const [globeReady, setGlobeReady] = useState(false);
    const [material, setMaterial] = useState<THREE.Material | null>(null);
    const [globeData, setGlobeData] = useState<object[]>([]);

    useEffect(() => {
        // Simple GlobeEngine initialization
        const engine = new GlobeEngine({ mode: visualizationMode.mode });
        
        // Simple material check
        const checkMaterial = setInterval(() => {
            const mat = engine.getMaterial();
            if (mat) {
                setMaterial(mat);
                clearInterval(checkMaterial);
            }
        }, 100);
        
        return () => clearInterval(checkMaterial);
    }, [visualizationMode.mode]);

    useEffect(() => {
        if (globeReady && globeRef.current && focusLocation) {
            globeRef.current.pointOfView({ lat: focusLocation.lat, lng: focusLocation.lng + 90, altitude: 2 });
        }
    }, [globeReady, focusLocation]);

    useEffect(() => {
        // AI-NOTE: Integration with GlobeEngine per globe-engine-api.artifact
        const engine = new GlobeEngine({ mode: visualizationMode.mode });
        // Listen for overlay data updates
        const handler = ({ type, payload }: GlobeEvent) => {
            if (type === 'overlayDataUpdated' && payload && typeof payload === 'object') {
                const p = payload as OverlayPayload;
                if (p.overlay === 'markers') {
                    setGlobeData(p.data || []);
                }
                if (p.overlay === 'alerts') {
                    setGlobeData((prev) => [...prev, ...(p.data || [])]);
                }
            }
        };
        engine.on('overlayDataUpdated', handler);
        // Add overlays for current mode
        const overlays = engine.getOverlays();
        overlays.forEach((o: string) => engine.addOverlay(o));
        // No cleanup needed for this mock
    }, [visualizationMode.mode]);

    // Remove visibility tracking - TinyGlobe should render immediately

    return (
        <div className={styles.tinyGlobeContainer}>
            {material ? (
                <Globe
                    ref={globeRef}
                    width={110}
                    height={110}
                    backgroundColor="rgba(0, 0, 0, 0)"
                    showAtmosphere={true}
                    atmosphereColor="#00C4FF"
                    atmosphereAltitude={0.18}
                    globeMaterial={material ?? undefined}
                    pointsData={globeData}
                    pointAltitude="size"
                    pointColor="color"
                    onGlobeReady={() => setGlobeReady(true)}
                />
            ) : (
                <div style={{
                    width: 110,
                    height: 110,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00ff41',
                    fontSize: '8px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    position: 'relative'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '1px solid #00ff41',
                        borderRadius: '50%',
                        position: 'relative',
                        marginBottom: '8px',
                        animation: 'miniRotate 1.5s linear infinite'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '16px'
                        }}>
                            🌍
                        </div>
                        <div style={{
                            position: 'absolute',
                            top: '-1px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '2px',
                            height: '2px',
                            background: '#00ff41',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px #00ff41'
                        }}></div>
                    </div>
                    <div style={{
                        animation: 'miniPulse 1s ease-in-out infinite',
                        textTransform: 'uppercase'
                    }}>
                        INIT...
                    </div>
                    <style>{`
                        @keyframes miniRotate {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        @keyframes miniPulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
                        }
                    `}</style>
                </div>
            )}
            <div className={styles.buttonContainer}>
                <button 
                    className={`${styles.shaderButton} ${visualizationMode.mode === 'EcoNatural' ? styles.active : ''}`}
                    data-interface-button="geoMagnetics" 
                    onClick={() => setPrimaryMode('EcoNatural')}
                >
                    🌎
                </button>
                <button 
                    className={`${styles.shaderButton} ${visualizationMode.mode === 'CyberCommand' ? styles.active : ''}`}
                    data-interface-button="intelReports" 
                    onClick={() => setPrimaryMode('CyberCommand')}
                >
                    📑
                </button>
                <button 
                    className={`${styles.shaderButton} ${visualizationMode.mode === 'GeoPolitical' ? styles.active : ''}`}
                    data-interface-button="solarSystem" 
                    onClick={() => setPrimaryMode('GeoPolitical')}
                >
                    ☀️
                </button>
            </div>
            
            {/* Secondary Mode Buttons - 3 buttons that change based on primary mode selection */}
            <div className={styles.secondaryButtonContainer}>
                {/* CyberCommand submodes */}
                {visualizationMode.mode === 'CyberCommand' && (
                    <>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'IntelReports' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'IntelReports' })}
                            title="Intel Reports"
                        >
                            📑
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'Timelines' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'Timelines' })}
                            title="Timelines"
                        >
                            ⏱️
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'CrisisZones' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'CrisisZones' })}
                            title="Crisis Zones"
                        >
                            🚨
                        </button>
                    </>
                )}
                
                {/* GeoPolitical submodes */}
                {visualizationMode.mode === 'GeoPolitical' && (
                    <>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'NationalTerritories' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'NationalTerritories' })}
                            title="National Territories"
                        >
                            🗺️
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'DiplomaticEvents' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'DiplomaticEvents' })}
                            title="Diplomatic Events"
                        >
                            🤝
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'ResourceZones' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'ResourceZones' })}
                            title="Resource Zones"
                        >
                            💎
                        </button>
                    </>
                )}
                
                {/* EcoNatural submodes */}
                {visualizationMode.mode === 'EcoNatural' && (
                    <>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'SpaceWeather' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'SpaceWeather' })}
                            title="Space Weather"
                        >
                            🌎
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EcologicalDisasters' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EcologicalDisasters' })}
                            title="Ecological Disasters"
                        >
                            🌪️
                        </button>
                        <button 
                            className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EarthWeather' ? styles.active : ''}`}
                            onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EarthWeather' })}
                            title="Earth Weather"
                        >
                            🌤️
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TinyGlobe;
// AI-NOTE: Refactored to use GlobeEngine. See globe-engine-api.artifact for integration details.