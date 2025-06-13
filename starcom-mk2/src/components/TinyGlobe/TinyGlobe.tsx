import React, { useEffect, useRef, useState, Suspense } from 'react';
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
    const { visualizationMode, setVisualizationMode } = useVisualizationMode();
    const globeRef = useRef<GlobeMethods>();
    const [globeReady, setGlobeReady] = useState(false);
    const [material, setMaterial] = useState<THREE.Material | null>(null);
    const [globeData, setGlobeData] = useState<object[]>([]);

    useEffect(() => {
        // AI-NOTE: Integration with GlobeEngine per globe-engine-api.artifact
        const engine = new GlobeEngine({ mode: visualizationMode.mode });
        // Listen for material ready
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

    return (
        <div className={styles.tinyGlobeContainer}>
            <Suspense fallback={<div>Loading...</div>}>
                <Globe
                    ref={globeRef}
                    width={100}
                    height={100}
                    backgroundColor="rgba(0, 0, 0, 0)"
                    showAtmosphere={true}
                    atmosphereColor="#00C4FF"
                    atmosphereAltitude={0.15}
                    globeMaterial={material || undefined}
                    pointsData={globeData}
                    pointAltitude="size"
                    pointColor="color"
                    onGlobeReady={() => setGlobeReady(true)}
                />
            </Suspense>
            <div className={styles.buttonContainer}>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="geoMagnetics" 
                    onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EarthWeather' })}
                >
                    🌎
                </button>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="intelReports" 
                    onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'IntelReports' })}
                >
                    📑
                </button>
                <button 
                    className={styles.shaderButton} 
                    data-interface-button="solarSystem" 
                    onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'NationalTerritories' })}
                >
                    ☀️
                </button>
            </div>
        </div>
    );
};

export default TinyGlobe;
// AI-NOTE: Refactored to use GlobeEngine. See globe-engine-api.artifact for integration details.