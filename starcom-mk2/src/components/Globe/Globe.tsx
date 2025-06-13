// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import { GlobeEngine, GlobeEvent } from '../../globe-engine/GlobeEngine';
import * as THREE from 'three';
import Modal from 'react-modal';
import { Tooltip } from 'react-tooltip';

// Artifact-driven overlay mapping (see globe-overlays.artifact, globe-mode-mapping-reference.artifact)
const ALL_OVERLAYS = [
  'markers',
  'alerts',
  'intelMarkers',
  'weather',
  'naturalEvents',
  'borders',
  'territories',
  'spaceAssets',
];

// Artifact-driven overlay legend (see globe-overlays.artifact)
const OVERLAY_LEGEND: Record<string, { label: string; color: string; description: string }> = {
  markers: { label: 'Markers', color: 'white', description: 'User-placed or data-driven markers (incidents, investigations)' },
  alerts: { label: 'Alerts', color: 'cyan', description: 'Cyber or system alerts (real-time)' },
  intelMarkers: { label: 'Intel Markers', color: 'orange', description: 'Intelligence report locations' },
  weather: { label: 'Weather', color: 'blue', description: 'Weather overlays (clouds, storms)' },
  naturalEvents: { label: 'Natural Events', color: 'red', description: 'Earthquakes, volcanoes, etc.' },
  borders: { label: 'Borders', color: 'red', description: 'Country/region borders' },
  territories: { label: 'Territories', color: 'green', description: 'National territories' },
  spaceAssets: { label: 'Space Assets', color: 'lime', description: 'Satellites, space debris, and orbital objects' },
};

const PERIODIC_OVERLAYS = ['spaceAssets', 'weather', 'naturalEvents']; // Artifact-driven: overlays with periodic/real-time updates (see globe-overlays.artifact)

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<object[]>([]);
  const globeRef = useRef<GlobeMethods>();
  const { setFocusLocation } = useGlobeContext();
  const { visualizationMode } = useVisualizationMode();
  const [globeEngine, setGlobeEngine] = useState<GlobeEngine | null>(null);
  const [material, setMaterial] = useState<THREE.Material | null>(null);
  const bordersRef = useRef<THREE.Group>(null);
  const territoriesRef = useRef<THREE.Group>(null);
  // Merge all overlays for UI, but only enable those mapped to the current mode by default
  const availableOverlays = ALL_OVERLAYS;
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const [overlayStatus, setOverlayStatus] = useState<Record<string, { loading: boolean; error: string | null; count: number }>>({});
  const [overlayData, setOverlayData] = useState<Record<string, object[]>>({});
  const [inspectOverlay, setInspectOverlay] = useState<string | null>(null);
  const [modalPage, setModalPage] = useState(0); // For modal pagination
  const MODAL_PAGE_SIZE = 50; // Artifact-driven: keep modal tables performant (see globe-overlays.artifact)
  const [overlayLastUpdated, setOverlayLastUpdated] = useState<Record<string, number>>({});
  const [legendOpen, setLegendOpen] = useState(false); // Legend is closed by default
  const [overlayPanelOpen, setOverlayPanelOpen] = useState(false); // Overlay controls panel is minimized by default

  useEffect(() => {
    // AI-NOTE: Integration with GlobeEngine per globe-engine-api.artifact
    const engine = new GlobeEngine({ mode: visualizationMode.mode });
    setGlobeEngine(engine);
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
    // Example: update globe data if needed (can be extended for overlays)
    setGlobeData([]); // TODO: Use overlay/event data from GlobeEngine if needed
  }, [globeEngine]);

  useEffect(() => {
    if (!globeEngine) return;
    // Listen for overlay data updates and status
    const handler = ({ type, payload }: GlobeEvent) => {
      if (type === 'overlayDataUpdated' && payload && typeof payload === 'object') {
        const p = payload as { overlay: string; data: object[] };
        setOverlayData((prev) => ({ ...prev, [p.overlay]: p.data || [] }));
        setOverlayStatus((prev) => ({
          ...prev,
          [p.overlay]: {
            ...(prev[p.overlay] || { loading: false, error: null, count: 0 }),
            loading: false,
            error: null,
            count: Array.isArray(p.data) ? p.data.length : 0,
          },
        }));
        setOverlayLastUpdated((prev) => ({ ...prev, [p.overlay]: Date.now() }));
      }
      if (type === 'overlayDataLoading' && payload && typeof payload === 'object') {
        const p = payload as { overlay: string };
        setOverlayStatus((prev) => ({
          ...prev,
          [p.overlay]: {
            ...(prev[p.overlay] || { loading: false, error: null, count: 0 }),
            loading: true,
            error: null,
          },
        }));
      }
      if (type === 'overlayDataError' && payload && typeof payload === 'object') {
        const p = payload as { overlay: string; error: string };
        setOverlayStatus((prev) => ({
          ...prev,
          [p.overlay]: {
            ...(prev[p.overlay] || { loading: false, error: null, count: 0 }),
            loading: false,
            error: p.error,
          },
        }));
      }
    };
    globeEngine.on('overlayDataUpdated', handler);
    globeEngine.on('overlayDataLoading', handler);
    globeEngine.on('overlayDataError', handler);
    // Add overlays for current mode
    const overlays = globeEngine.getOverlays();
    overlays.forEach((o) => globeEngine.addOverlay(o));
    return () => {
      // No off() method, so ignore cleanup for now
    };
  }, [globeEngine]);

  useEffect(() => {
    if (!globeRef.current) return;
    // GlobeMethods type does not expose .scene(), so we cast to the correct type
    const globeObj = globeRef.current as unknown as { scene: () => THREE.Scene };
    const scene = globeObj && globeObj.scene();
    const bordersGroup = bordersRef.current;
    const territoriesGroup = territoriesRef.current;
    if (scene && bordersGroup && !scene.children.includes(bordersGroup)) {
      scene.add(bordersGroup);
    }
    if (scene && territoriesGroup && !scene.children.includes(territoriesGroup)) {
      scene.add(territoriesGroup);
    }
    return () => {
      if (scene && bordersGroup) scene.remove(bordersGroup);
      if (scene && territoriesGroup) scene.remove(territoriesGroup);
    };
  }, [globeRef, bordersRef, territoriesRef, globeEngine]);

  const handleGlobeClick = ({ lat, lng }: { lat: number; lng: number }) => {
    const newMarker = { lat, lng, size: 0.5, color: 'red' };
    setGlobeData((prevData) => [...prevData, newMarker]);
    setFocusLocation({ lat, lng });
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 1.5 });
    }
  };

  const handleOverlayToggle = (overlay: string) => {
    if (!globeEngine) return;
    if (activeOverlays.includes(overlay)) {
      globeEngine.removeOverlay(overlay);
      setActiveOverlays((prev) => prev.filter((o) => o !== overlay));
    } else {
      globeEngine.addOverlay(overlay);
      setActiveOverlays((prev) => [...prev, overlay]);
    }
  };

  // Manual refresh for overlays with periodic updates (artifact-driven, see globe-overlays.artifact)
  const handleOverlayRefresh = (overlay: string) => {
    if (!globeEngine) return;
    // Remove and re-add overlay to force refresh
    globeEngine.removeOverlay(overlay);
    setTimeout(() => globeEngine.addOverlay(overlay), 50);
  };

  // Reset modal page when inspecting a new overlay
  useEffect(() => {
    setModalPage(0);
  }, [inspectOverlay]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Overlay Controls Panel (minimizable, repositioned) */}
      <div
        style={{
          position: 'absolute',
          top: 64, // Adjust as needed to be just below TopBar (assume TopBar is 64px tall)
          left: 100, // Adjust as needed to be just to the right of LeftSideBar (assume sidebar is 80px wide)
          zIndex: 20,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          borderRadius: 8,
          padding: overlayPanelOpen ? 12 : 0,
          minWidth: overlayPanelOpen ? 260 : 48,
          minHeight: 32,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: overlayPanelOpen ? 'stretch' : 'center',
        }}
      >
        <button
          onClick={() => setOverlayPanelOpen((open) => !open)}
          style={{
            alignSelf: 'flex-end',
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 18,
            margin: 4,
            padding: 2,
            borderRadius: 4,
            transition: 'background 0.2s',
            minWidth: 32,
          }}
          aria-label={overlayPanelOpen ? 'Minimize overlay controls' : 'Expand overlay controls'}
        >
          {overlayPanelOpen ? '−' : '+'}
        </button>
        {overlayPanelOpen && (
          <>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Overlays</div>
            {availableOverlays.map((overlay) => (
              <div key={overlay} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <label
                  style={{ flex: 1, display: 'flex', alignItems: 'center' }}
                  data-tooltip-id={`tip-${overlay}`}
                  data-tooltip-content={OVERLAY_LEGEND[overlay]?.description}
                  aria-label={`Toggle ${OVERLAY_LEGEND[overlay]?.label || overlay} overlay`}
                >
                  <input
                    type="checkbox"
                    checked={activeOverlays.includes(overlay)}
                    onChange={() => handleOverlayToggle(overlay)}
                    style={{ marginRight: 6 }}
                    aria-checked={activeOverlays.includes(overlay)}
                    aria-label={`Toggle ${OVERLAY_LEGEND[overlay]?.label || overlay} overlay`}
                  />
                  <span style={{ color: OVERLAY_LEGEND[overlay]?.color || '#fff', fontWeight: 500 }}>
                    {OVERLAY_LEGEND[overlay]?.label || overlay}
                  </span>
                </label>
                <Tooltip id={`tip-${overlay}`} place="left" />
                <span style={{ fontSize: 12, marginLeft: 8 }}>
                  {overlayStatus[overlay]?.loading ? 'Loading...' : overlayStatus[overlay]?.error ? 'Error' : overlayStatus[overlay]?.count !== undefined ? `(${overlayStatus[overlay]?.count})` : ''}
                </span>
                {/* Manual refresh for overlays with periodic updates */}
                {PERIODIC_OVERLAYS.includes(overlay) && activeOverlays.includes(overlay) && (
                  <button
                    style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', borderRadius: 4, border: 'none', background: '#444', color: '#fff', cursor: 'pointer' }}
                    onClick={() => handleOverlayRefresh(overlay)}
                    aria-label={`Refresh ${OVERLAY_LEGEND[overlay]?.label || overlay} overlay now`}
                    title="Refresh now"
                  >
                    ⟳
                  </button>
                )}
                {/* Last updated timestamp for overlays with periodic updates */}
                {PERIODIC_OVERLAYS.includes(overlay) && overlayLastUpdated[overlay] && (
                  <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }} aria-label={`Last updated for ${OVERLAY_LEGEND[overlay]?.label || overlay}`}>
                    {new Date(overlayLastUpdated[overlay]).toLocaleTimeString()}
                  </span>
                )}
                <button
                  style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', borderRadius: 4, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}
                  onClick={() => setInspectOverlay(overlay)}
                  disabled={!overlayData[overlay] || overlayStatus[overlay]?.loading}
                  title="Inspect overlay data"
                  aria-label={`Inspect ${OVERLAY_LEGEND[overlay]?.label || overlay} data`}
                >
                  Inspect
                </button>
              </div>
            ))}
            <div style={{ marginTop: 12, borderTop: '1px solid #444', paddingTop: 8 }}>
              <button
                onClick={() => setLegendOpen((open) => !open)}
                style={{
                  display: 'flex', alignItems: 'center', marginBottom: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 15
                }}
                aria-label={legendOpen ? 'Hide overlay legend' : 'Show overlay legend'}
              >
                {legendOpen ? '▼ Legend' : '▲ Legend'}
              </button>
              {legendOpen && (
                <div>
                  {availableOverlays.map((overlay) => (
                    <div
                      key={overlay}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
                      data-tooltip-id={`legend-tip-${overlay}`}
                      data-tooltip-content={OVERLAY_LEGEND[overlay]?.description}
                    >
                      <span style={{ width: 14, height: 14, background: OVERLAY_LEGEND[overlay]?.color || '#fff', borderRadius: 3, display: 'inline-block', marginRight: 8 }} />
                      <span style={{ fontWeight: 500 }}>{OVERLAY_LEGEND[overlay]?.label || overlay}</span>
                      <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>{OVERLAY_LEGEND[overlay]?.description}</span>
                      <Tooltip id={`legend-tip-${overlay}`} place="left" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Overlay Data Inspection Modal (artifact-driven, see globe-overlays.artifact UI/UX guidelines) */}
      <Modal
        isOpen={!!inspectOverlay}
        onRequestClose={() => setInspectOverlay(null)}
        contentLabel="Overlay Data Inspector"
        style={{
          content: {
            top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)',
            background: '#222', color: '#fff', borderRadius: 8, padding: 24, minWidth: 400, maxHeight: '80vh', overflowY: 'auto',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.7)' },
        }}
        ariaHideApp={false}
        aria-modal="true"
        aria-label="Overlay Data Inspector"
      >
        <h3 style={{ marginTop: 0 }}>{inspectOverlay && OVERLAY_LEGEND[inspectOverlay]?.label} Data</h3>
        <button onClick={() => setInspectOverlay(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }} aria-label="Close overlay data inspector">×</button>
        {inspectOverlay && overlayStatus[inspectOverlay]?.loading && <div>Loading...</div>}
        {inspectOverlay && overlayStatus[inspectOverlay]?.error && <div style={{ color: 'red' }}>Error: {overlayStatus[inspectOverlay]?.error}</div>}
        {inspectOverlay && overlayData[inspectOverlay] && overlayData[inspectOverlay].length > 0 ? (
          <>
            <table style={{ width: '100%', fontSize: 13, background: '#222', color: '#fff', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {inspectOverlay && Object.keys(overlayData[inspectOverlay][0]).map((key) => (
                    <th key={key} style={{ borderBottom: '1px solid #444', textAlign: 'left', padding: 4 }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inspectOverlay && overlayData[inspectOverlay].slice(modalPage * MODAL_PAGE_SIZE, (modalPage + 1) * MODAL_PAGE_SIZE).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ borderBottom: '1px solid #333', padding: 4 }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination controls (artifact-driven, see globe-overlays.artifact UI/UX guidelines) */}
            {overlayData[inspectOverlay].length > MODAL_PAGE_SIZE && (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => setModalPage((p) => Math.max(0, p - 1))}
                  disabled={modalPage === 0}
                  style={{ marginRight: 8, padding: '2px 8px', borderRadius: 4, border: 'none', background: '#333', color: '#fff', cursor: modalPage === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: 13 }}>
                  Page {modalPage + 1} of {Math.ceil(overlayData[inspectOverlay].length / MODAL_PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setModalPage((p) => p + 1)}
                  disabled={(modalPage + 1) * MODAL_PAGE_SIZE >= overlayData[inspectOverlay].length}
                  style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, border: 'none', background: '#333', color: '#fff', cursor: (modalPage + 1) * MODAL_PAGE_SIZE >= overlayData[inspectOverlay].length ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          inspectOverlay && !overlayStatus[inspectOverlay]?.loading && !overlayStatus[inspectOverlay]?.error && <div>No data.</div>
        )}
      </Modal>
      <Globe
        ref={globeRef}
        pointsData={globeData.filter((d: { lat?: number; lng?: number }) => d.lat !== undefined && d.lng !== undefined)}
        pointAltitude={(d: { size?: number }) => d.size || 0.5}
        pointColor={(d: { type?: string; color?: string }) => {
          if (d.type === 'intel') return 'orange';
          if (d.type === 'earthquake') return 'red';
          if (d.type === 'volcano') return 'purple';
          if (d.type === 'cyber') return 'cyan';
          if (d.type === 'system') return 'yellow';
          if (d.type === 'storm') return 'blue';
          if (d.type === 'cloud') return 'gray';
          return d.color || 'white';
        }}
        globeMaterial={material || undefined}
        onGlobeClick={handleGlobeClick}
        // ...existing Globe props...
      />
      {/* Borders and territories overlays would be attached to the Three.js scene here in a custom renderer or with react-three-fiber */}
    </div>
  );
};

export default GlobeView;
// AI-NOTE: Refactored to use GlobeEngine. See globe-engine-api.artifact for integration details.
// Artifact references:
// - Overlay UI/UX: globe-overlays.artifact (UI/UX Guidelines)
// - Overlay logic: globe-engine-api.artifact, globe-modes.artifact