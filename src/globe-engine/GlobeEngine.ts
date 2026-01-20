// GlobeEngine.ts
// AI-NOTE: See globe-engine-architecture.artifact and globe-engine-api.artifact for design and API rationale.

/**
 * GlobeEngine: Central class for creating and managing globe instances (main, tiny, etc.)
 * - Handles mode, overlays, shaders, textures, and integration with Starcom context.
 * - See globe-engine-api.artifact for API and integration details.
 */

import { GlobeModeMapping } from './GlobeModeMapping';
import { GlobeTextureLoader } from './GlobeTextureLoader';
import { GlobeMaterialManager } from './GlobeMaterialManager';
import * as THREE from 'three';
import { fetchWeatherData } from '../services/WeatherDataService';
import { fetchAlerts } from '../services/AlertsService';
import { fetchNaturalEvents } from '../services/GeoEventsService';
import { fetchSpaceAssets } from '../services/SpaceAssetsService';
import { fetchLatestElectricFieldData, transformNOAAToIntelMarkers } from '../services/noaaSpaceWeather';
import {
  buildAuroralPayload,
  buildBowShockPayload,
  buildMagnetopausePayload,
  type AuroraPayload,
  type BowShockPayload,
  type MagnetopausePayload,
} from '../services/SpaceWeatherModeling';
import { fetchLiveKpSnapshot, fetchLiveSolarWindSnapshot } from '../services/SpaceWeatherLive';
import {
  createAuroraBlackoutMesh,
  createAuroraLines,
  createBowShockMesh,
  createMagnetopauseMesh,
  disposeObject,
  logVertexCount,
} from './SpaceWeatherGeometry';
import type { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

export type GlobeEvent = { type: string; payload?: unknown };

export interface GlobeEngineConfig {
  /**
   * Initial globe mode (see globe-modes.artifact)
   */
  mode: string;
  /**
   * Initial overlays (see globe-overlays.artifact)
   */
  overlays?: string[];
  /**
   * Event callback (see globe-engine-api.artifact)
   */
  onEvent?: (event: GlobeEvent) => void;
}

export class GlobeEngine {
  private static readonly SOLAR_WIND_STALE_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly KP_STALE_MS = 90 * 60 * 1000; // 90 minutes (Kp cadence)
  private mode: string;
  private overlays: string[];
  private material: THREE.Material | null = null;
  private eventHandlers: Record<string, ((event: GlobeEvent) => void)[]> = {};
  private overlayData: Record<string, unknown> = {};
  // Overlay data cache (see globe-overlays.artifact, UI/UX guidelines)
  private overlayDataCache: Record<string, unknown> = {};
  // Optional overlay objects (THREE) for renderers that consume ready-made meshes
  private overlayObjects: Record<string, THREE.Object3D | undefined> = {};
  // Checksums to debounce redundant space weather geometry rebuilds
  private spaceWeatherChecksums: Record<string, string> = {};
  private spaceAssetsInterval: NodeJS.Timeout | null = null; // For periodic updates
  private spaceWeatherInterval: NodeJS.Timeout | null = null; // For space weather updates

  constructor(config: GlobeEngineConfig) {
    this.mode = config.mode;
    this.overlays = config.overlays || [];
    if (config.onEvent) {
      // Register the event handler for all event types
      this.on('overlayDataLoading', config.onEvent);
      this.on('overlayDataUpdated', config.onEvent);
      this.on('overlayDataError', config.onEvent);
      this.on('overlayAdded', config.onEvent);
      this.on('overlayRemoved', config.onEvent);
    }
    // Async init
    this.init();
  }

  private async init() {
    try {
      // AI-NOTE: See globe-mode-mapping-reference.artifact, globe-modes.artifact, globe-shaders.artifact, globe-textures.artifact
      const renderConfig = GlobeModeMapping.getRenderConfigForMode(this.mode);
      const textureNames = [renderConfig.texture, 'blueMarble', 'earthDay', 'earthDark'];
      const textures: Record<string, THREE.Texture> = {};
      
      // Load textures with timeout and error handling
      const texturePromises = textureNames.map(async (name) => {
        try {
          const texture = await Promise.race([
            GlobeTextureLoader.loadTexture(name),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`Texture loading timeout for ${name}`)), 10000)
            )
          ]);
          textures[`${name}Texture`] = texture;
        } catch (error) {
          console.warn(`Failed to load texture ${name}:`, error);
          // Create a simple colored texture as fallback
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = name === 'earthDark' ? '#002244' : '#4477cc';
          ctx.fillRect(0, 0, 1, 1);
          const fallbackTexture = new THREE.CanvasTexture(canvas);
          textures[`${name}Texture`] = fallbackTexture;
        }
      });
      
      await Promise.all(texturePromises);
      this.material = GlobeMaterialManager.getMaterialForMode(renderConfig.shader, textures);
      
      // Initialize overlays
      if (this.overlays.includes('spaceAssets')) {
        this.startSpaceAssetsUpdates();
      } else {
        this.stopSpaceAssetsUpdates();
      }
      
      // Start space weather updates if any space weather overlays are active
      if (this.overlays.some(o => o.startsWith('spaceWeather'))) {
        this.startSpaceWeatherUpdates();
      } else {
        this.stopSpaceWeatherUpdates();
      }
    } catch (error) {
      console.error('GlobeEngine initialization failed:', error);
      // Create a basic fallback material
      this.material = new THREE.MeshBasicMaterial({ color: 0x4444ff });
    }
  }

  private startSpaceAssetsUpdates() {
    this.stopSpaceAssetsUpdates();
    // Fetch immediately, then every 60s (artifact-driven: periodic/real-time, see globe-overlays.artifact)
    this.fetchAndUpdateSpaceAssets();
    this.spaceAssetsInterval = setInterval(() => {
      this.fetchAndUpdateSpaceAssets();
    }, 60000);
  }

  private stopSpaceAssetsUpdates() {
    if (this.spaceAssetsInterval) {
      clearInterval(this.spaceAssetsInterval);
      this.spaceAssetsInterval = null;
    }
  }

  private fetchAndUpdateSpaceAssets() {
    this.emit('overlayDataLoading', { overlay: 'spaceAssets' });
    fetchSpaceAssets()
      .then((data) => {
        this.overlayDataCache['spaceAssets'] = data;
        this.setOverlayData('spaceAssets', data);
      })
      .catch((err) => {
        this.emit('overlayDataError', { overlay: 'spaceAssets', error: err?.message || String(err) });
      });
  }

  // AI-NOTE: Space weather periodic update methods
  private startSpaceWeatherUpdates() {
    this.stopSpaceWeatherUpdates();
    // Fetch immediately, then every 5 minutes (matches NOAA update frequency)
    this.fetchAndUpdateSpaceWeather();
    this.spaceWeatherInterval = setInterval(() => {
      this.fetchAndUpdateSpaceWeather();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopSpaceWeatherUpdates() {
    if (this.spaceWeatherInterval) {
      clearInterval(this.spaceWeatherInterval);
      this.spaceWeatherInterval = null;
    }
  }

  private async fetchAndUpdateSpaceWeather() {
    try {
      this.emit('overlayDataLoading', { overlay: 'spaceWeather' });
      
      // Fetch both InterMag and US-Canada data
      const [interMagData, usCanadaData] = await Promise.all([
        fetchLatestElectricFieldData('InterMag'),
        fetchLatestElectricFieldData('US-Canada')
      ]);

      // Transform to intelligence markers for globe visualization
      const interMagMarkers = transformNOAAToIntelMarkers(interMagData, 'electric-field-intermag');
      const usCanadaMarkers = transformNOAAToIntelMarkers(usCanadaData, 'electric-field-us-canada');
      
      // Combine both datasets
      const combinedMarkers = [...interMagMarkers, ...usCanadaMarkers];
      
      // Cache and update - Note: actual rendering will be controlled by Globe component with settings
      this.overlayDataCache['spaceWeather'] = combinedMarkers;
      this.setOverlayData('spaceWeather', combinedMarkers);
      // Update boundary overlays (magnetopause, bow shock, aurora) using modeled fallbacks for now
      await this.fetchAndUpdateSpaceWeatherBoundaries();
    } catch (err) {
      this.emit('overlayDataError', { overlay: 'spaceWeather', error: err instanceof Error ? err.message : String(err) });
    }
  }

  // AI-NOTE: Modeled boundaries for MVP until live endpoints are wired
  private async fetchAndUpdateSpaceWeatherBoundaries() {
    try {
      const { snapshot: solarWind, quality: solarWindQuality } = await fetchLiveSolarWindSnapshot();
      const { snapshot: kp, quality: kpQuality } = await fetchLiveKpSnapshot();

      const now = Date.now();
      const solarWindAgeMs = Math.max(0, now - Date.parse(solarWind.timestamp));
      const kpAgeMs = Math.max(0, now - Date.parse(kp.timestamp));
      const solarWindStale = solarWindAgeMs > GlobeEngine.SOLAR_WIND_STALE_MS;
      const kpStale = kpAgeMs > GlobeEngine.KP_STALE_MS;

      const magnetopause: MagnetopausePayload = buildMagnetopausePayload(solarWind, solarWindQuality);
      const bowShock: BowShockPayload = buildBowShockPayload(solarWind, magnetopause.standoffRe, solarWindQuality);
      const aurora: AuroraPayload = buildAuroralPayload(kp, kpQuality);

      const qualityForSolarWind = solarWindStale ? 'stale' : solarWindQuality;
      magnetopause.quality = qualityForSolarWind;
      bowShock.quality = qualityForSolarWind;
      magnetopause.meta = { ...(magnetopause.meta || {}), stale: solarWindStale, ageMs: solarWindAgeMs };
      bowShock.meta = { ...(bowShock.meta || {}), stale: solarWindStale, ageMs: solarWindAgeMs };

      const qualityForKp = kpStale ? 'stale' : kpQuality;
      aurora.quality = qualityForKp;
      aurora.meta = { ...(aurora.meta || {}), stale: kpStale, ageMs: kpAgeMs };

      this.overlayDataCache['spaceWeatherMagnetopause'] = magnetopause;
      this.overlayDataCache['spaceWeatherBowShock'] = bowShock;
      this.overlayDataCache['spaceWeatherAurora'] = aurora;

      this.setOverlayData('spaceWeatherMagnetopause', magnetopause);
      this.setOverlayData('spaceWeatherBowShock', bowShock);
      this.setOverlayData('spaceWeatherAurora', aurora);
    } catch (error) {
      this.emit('overlayDataError', { overlay: 'spaceWeatherBoundaries', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Switch globe mode (see globe-modes.artifact)
   */
  setMode(mode: string): void {
    this.mode = mode;
    // Artifact-driven: Reset overlays to mode defaults (see globe-modes.artifact, globe-mode-mapping-reference.artifact)
    const modeDefaults: Record<string, string[]> = {
      CyberCommand: [
        'alerts',
        'intelMarkers',
        'markers',
        // Space weather visualizations (electric field + boundaries)
        'spaceWeatherInterMag',
        'spaceWeatherUSCanada',
        'spaceWeatherMagnetopause',
        'spaceWeatherBowShock',
        'spaceWeatherAurora',
      ],
      EcoNatural: ['weather', 'naturalEvents', 'markers', 'spaceWeather'],
      GeoPolitical: ['borders', 'territories', 'markers'],
    };
    const newOverlays = modeDefaults[mode] || [];
    // Remove overlays not in new mode
    this.overlays.forEach(o => {
      if (!newOverlays.includes(o)) this.removeOverlay(o);
    });
    // Add overlays required by new mode
    newOverlays.forEach(o => {
      if (!this.overlays.includes(o)) this.addOverlay(o);
    });
    this.init();
  }

  /**
   * Add overlay (see globe-overlays.artifact)
   */
  addOverlay(overlay: string) {
    if (!this.overlays.includes(overlay)) {
      this.overlays.push(overlay);
      // Overlay data caching (see globe-overlays.artifact)
      if (this.overlayDataCache[overlay]) {
        this.setOverlayData(overlay, this.overlayDataCache[overlay]);
        this.emit('overlayAdded', overlay);
        // Start/stop periodic updates for spaceAssets and spaceWeather
        if (overlay === 'spaceAssets') this.startSpaceAssetsUpdates();
        if (overlay === 'spaceWeather') this.startSpaceWeatherUpdates();
        return;
      }
      // AI-NOTE: See globe-overlays.artifact for overlay logic and data sources.
      if (overlay === 'alerts') {
        // Fetch alerts from real API (artifact-driven)
        fetchAlerts().then((data) => {
          this.overlayDataCache['alerts'] = data;
          this.setOverlayData('alerts', data);
        });
      }
      if (overlay === 'weather') {
        // Fetch weather for key locations (artifact-driven, see globe-overlays.artifact)
        // Example: fetch for several major cities (can be replaced with dynamic locations)
        const locations = [
          { lat: 35, lng: 139 }, // Tokyo
          { lat: -33, lng: 151 }, // Sydney
          { lat: 40.7, lng: -74 }, // New York
          { lat: 51.5, lng: -0.1 }, // London
        ];
        Promise.all(locations.map(loc => fetchWeatherData(loc.lat, loc.lng)))
          .then((results) => {
            const data = results.map((weather, i) => ({
              id: i + 1,
              lat: locations[i].lat,
              lng: locations[i].lng,
              type: 'weather',
              ...weather,
            }));
            this.overlayDataCache['weather'] = data;
            this.setOverlayData('weather', data);
          });
      }
      if (overlay === 'borders') {
        // Fetch borders from static geojson
        fetch('/borders.geojson')
          .then(res => res.json())
          .then((geojson: { features: Array<{ properties?: { name?: string }, geometry: { type: string, coordinates: number[][] } }> }) => {
            // Parse LineString features into arrays of lat/lng
            const lines = (geojson.features || [])
              .filter((f) => f.geometry.type === 'LineString')
              .map((f) => ({
                id: f.properties?.name || 'border',
                coordinates: f.geometry.coordinates // [lng, lat] pairs
              }));
            this.overlayDataCache['borders'] = lines;
            this.setOverlayData('borders', lines);
          });
      }
      if (overlay === 'territories') {
        // Fetch territories from static geojson
        fetch('/territories.geojson')
          .then(res => res.json())
          .then((geojson: { features: Array<{ properties?: { name?: string }, geometry: { type: string, coordinates: number[][][] } }> }) => {
            // Parse Polygon features into arrays of lat/lng
            const polygons = (geojson.features || [])
              .filter((f) => f.geometry.type === 'Polygon')
              .map((f) => ({
                id: f.properties?.name || 'territory',
                coordinates: f.geometry.coordinates // array of rings: [ [ [lng, lat], ... ] ]
              }));
            this.overlayDataCache['territories'] = polygons;
            this.setOverlayData('territories', polygons);
          });
      }
      if (overlay === 'intelMarkers') {
        // Fetch intel markers from centralized IntelReportVisualizationService
        import('../services/IntelReportVisualizationService').then(({ IntelReportVisualizationService }) => {
          const viz = new IntelReportVisualizationService();
          viz.getIntelReportMarkers().then((markers) => {
            this.overlayDataCache['intelMarkers'] = markers;
            this.setOverlayData('intelMarkers', markers);
          }).catch((error) => {
            console.error('Failed to load intel report markers:', error);
            this.overlayDataCache['intelMarkers'] = [];
            this.setOverlayData('intelMarkers', []);
          });
        });
      }
      if (overlay === 'naturalEvents') {
        // Fetch natural events from real API (artifact-driven)
        fetchNaturalEvents().then((data) => {
          this.overlayDataCache['naturalEvents'] = data;
          this.setOverlayData('naturalEvents', data);
        });
      }
      if (overlay === 'spaceAssets') {
        this.startSpaceAssetsUpdates();
        return;
      }
      if (overlay === 'spaceWeather') {
        // AI-NOTE: Fetch NOAA space weather data (electric field InterMag & US-Canada)
        this.startSpaceWeatherUpdates();
        return;
      }

      // Modeled space weather boundary overlays (magnetopause, bow shock, aurora)
      if (overlay === 'spaceWeatherMagnetopause' || overlay === 'spaceWeatherBowShock' || overlay === 'spaceWeatherAurora') {
        // Start periodic updates if not already running
        if (!this.spaceWeatherInterval) {
          this.startSpaceWeatherUpdates();
        }
        // If cached data exists, emit immediately; otherwise compute fallback once
        const cached = this.overlayDataCache[overlay];
        if (cached) {
          this.setOverlayData(overlay, cached);
          this.emit('overlayAdded', overlay);
          return;
        }
        this.fetchAndUpdateSpaceWeatherBoundaries();
        this.emit('overlayAdded', overlay);
        return;
      }
      
      // AI-NOTE: Space weather overlays integration (see NOAA-TDD-Implementation-Summary.md)
      if (overlay === 'spaceWeatherInterMag') {
        this.emit('overlayDataLoading', { overlay: 'spaceWeatherInterMag' });
        fetchLatestElectricFieldData('InterMag')
          .then((data) => {
            // Transform to intelligence markers for visualization
            const markers = transformNOAAToIntelMarkers(data, 'electric-field-intermag');
            this.overlayDataCache['spaceWeatherInterMag'] = markers;
            this.setOverlayData('spaceWeatherInterMag', markers);
          })
          .catch((err) => {
            this.emit('overlayDataError', { 
              overlay: 'spaceWeatherInterMag', 
              error: err?.message || String(err) 
            });
          });
        // Start space weather updates if not already running
        if (!this.spaceWeatherInterval) {
          this.startSpaceWeatherUpdates();
        }
        return;
      }
      
      if (overlay === 'spaceWeatherUSCanada') {
        this.emit('overlayDataLoading', { overlay: 'spaceWeatherUSCanada' });
        fetchLatestElectricFieldData('US-Canada')  
          .then((data) => {
            // Transform to intelligence markers for visualization
            const markers = transformNOAAToIntelMarkers(data, 'electric-field-us-canada');
            this.overlayDataCache['spaceWeatherUSCanada'] = markers;
            this.setOverlayData('spaceWeatherUSCanada', markers);
          })
          .catch((err) => {
            this.emit('overlayDataError', { 
              overlay: 'spaceWeatherUSCanada', 
              error: err?.message || String(err) 
            });
          });
        // Start space weather updates if not already running
        if (!this.spaceWeatherInterval) {
          this.startSpaceWeatherUpdates();
        }
        return;
      }
      
      this.emit('overlayAdded', overlay);
    }
  }

  /**
   * Remove overlay (see globe-overlays.artifact)
   */
  removeOverlay(overlay: string): void {
    this.overlays = this.overlays.filter(o => o !== overlay);
    // Optionally clear overlay data (but keep cache for efficiency)
    this.setOverlayData(overlay, undefined);
    this.emit('overlayRemoved', overlay);
    
    // Stop periodic updates for spaceAssets and spaceWeather
    if (overlay === 'spaceAssets') {
      this.stopSpaceAssetsUpdates();
    }
    if (overlay === 'spaceWeather') {
      this.stopSpaceWeatherUpdates();
    }
    // Stop space weather polling when no spaceWeather overlays remain
    if (!this.overlays.some(o => o.startsWith('spaceWeather'))) {
      this.stopSpaceWeatherUpdates();
    }
  }

  /**
   * Update space weather visualization with settings-based processing
   * Called by Globe component when settings change
   */
  updateSpaceWeatherVisualization(processedData: unknown, allowedBoundaryOverlays?: string[]): void {
    if (!this.overlays.includes('spaceWeather')) {
      this.addOverlay('spaceWeather');
    }
    const boundaryList = allowedBoundaryOverlays ?? ['spaceWeatherMagnetopause', 'spaceWeatherBowShock', 'spaceWeatherAurora'];
    // Only add boundary overlays that the caller allows (respects user toggles)
    boundaryList.forEach((overlay) => {
      if (!this.overlays.includes(overlay)) {
        this.addOverlay(overlay);
      }
    });
    this.setOverlayData('spaceWeather', processedData);
  }

  /**
   * Get current overlays
   */
  getOverlays(): string[] {
    return this.overlays;
  }

  /**
   * Get overlay data (see globe-overlays.artifact)
   */
  getOverlayData(overlay: string): unknown {
    // AI-NOTE: Overlay data structure and update mechanism should be defined in globe-overlays.artifact
    return this.overlayData[overlay];
  }

  private computeSpaceWeatherChecksum(
    overlay: string,
    payload: MagnetopausePayload | BowShockPayload | AuroraPayload
  ): string {
    if (overlay === 'spaceWeatherMagnetopause') {
      const p = payload as MagnetopausePayload;
      const pressure = typeof (p.meta as Record<string, unknown> | undefined)?.pressureNPa === 'number'
        ? (p.meta as { pressureNPa: number }).pressureNPa
        : 0;
      return ['mp', p.quality, p.standoffRe.toFixed(3), p.clamped ? '1' : '0', pressure.toFixed(3)].join('|');
    }
    if (overlay === 'spaceWeatherBowShock') {
      const p = payload as BowShockPayload;
      const pressure = typeof (p.meta as Record<string, unknown> | undefined)?.pressureNPa === 'number'
        ? (p.meta as { pressureNPa: number }).pressureNPa
        : 0;
      return ['bs', p.quality, p.radiusRe.toFixed(3), p.clamped ? '1' : '0', pressure.toFixed(3)].join('|');
    }
    if (overlay === 'spaceWeatherAurora') {
      const p = payload as AuroraPayload;
      const gradient = p.blackout?.gradient || { inner: 0, outer: 0 };
      const pulse = (p.meta as Record<string, unknown> | undefined)?.pulse ? '1' : '0';
      return [
        'aurora',
        p.quality,
        p.kp.toFixed(2),
        gradient.inner.toFixed(3),
        gradient.outer.toFixed(3),
        pulse
      ].join('|');
    }
    return `${overlay}|${JSON.stringify(payload)}`;
  }

  /**
   * Set overlay data (see globe-overlays.artifact)
   */
  setOverlayData(overlay: string, data: unknown): void {
    // AI-NOTE: Overlay data update mechanism should be defined in globe-overlays.artifact
    const isSpaceWeatherBoundary =
      overlay === 'spaceWeatherMagnetopause' ||
      overlay === 'spaceWeatherBowShock' ||
      overlay === 'spaceWeatherAurora';

    if (isSpaceWeatherBoundary && (data === undefined || data === null)) {
      // Clear stored THREE objects and checksums on teardown
      if (overlay === 'spaceWeatherAurora') {
        disposeObject(this.overlayObjects['spaceWeatherAuroraLinesNorth']);
        disposeObject(this.overlayObjects['spaceWeatherAuroraLinesSouth']);
        disposeObject(this.overlayObjects['spaceWeatherAuroraBlackout']);
        this.overlayObjects['spaceWeatherAuroraLinesNorth'] = undefined;
        this.overlayObjects['spaceWeatherAuroraLinesSouth'] = undefined;
        this.overlayObjects['spaceWeatherAuroraBlackout'] = undefined;
      }
      disposeObject(this.overlayObjects[overlay]);
      this.overlayObjects[overlay] = undefined;
      delete this.spaceWeatherChecksums[overlay];
    }

    if (isSpaceWeatherBoundary && data && typeof data === 'object') {
      const checksum = this.computeSpaceWeatherChecksum(
        overlay,
        data as MagnetopausePayload | BowShockPayload | AuroraPayload
      );
      const previousChecksum = this.spaceWeatherChecksums[overlay];
      // Keep caches in sync even when we debounce rebuilds
      this.overlayDataCache[overlay] = data;
      this.overlayData[overlay] = data;
      if (previousChecksum === checksum) {
        this.emit('overlayDataUpdated', { overlay, data, unchanged: true });
        return;
      }
      this.spaceWeatherChecksums[overlay] = checksum;
    } else {
      this.overlayData[overlay] = data;
    }

    // Build THREE objects for space weather boundary overlays so consumers can attach them
    if (overlay === 'spaceWeatherMagnetopause' && data && typeof data === 'object') {
      const payload = data as MagnetopausePayload;
      disposeObject(this.overlayObjects[overlay]);
      this.overlayObjects[overlay] = createMagnetopauseMesh(payload);
      logVertexCount('Magnetopause shell', this.overlayObjects[overlay]!);
    }
    if (overlay === 'spaceWeatherBowShock' && data && typeof data === 'object') {
      const payload = data as BowShockPayload;
      disposeObject(this.overlayObjects[overlay]);
      this.overlayObjects[overlay] = createBowShockMesh(payload);
      logVertexCount('Bow shock shell', this.overlayObjects[overlay]!);
    }
    if (overlay === 'spaceWeatherAurora' && data && typeof data === 'object') {
      const payload = data as AuroraPayload;
      disposeObject(this.overlayObjects['spaceWeatherAuroraLinesNorth']);
      disposeObject(this.overlayObjects['spaceWeatherAuroraLinesSouth']);
      disposeObject(this.overlayObjects['spaceWeatherAuroraBlackout']);
      const lines = createAuroraLines(payload);
      this.overlayObjects['spaceWeatherAuroraLinesNorth'] = lines.north;
      this.overlayObjects['spaceWeatherAuroraLinesSouth'] = lines.south;
      this.overlayObjects['spaceWeatherAuroraBlackout'] = createAuroraBlackoutMesh(payload);
      logVertexCount('Aurora lines north', lines.north);
      logVertexCount('Aurora lines south', lines.south);
      logVertexCount('Aurora blackout band', this.overlayObjects['spaceWeatherAuroraBlackout']!);
    }

    this.emit('overlayDataUpdated', { overlay, data });
  }

  /**
   * Retrieve overlay THREE object(s) if available
   */
  getOverlayObject(overlay: string): THREE.Object3D | undefined {
    return this.overlayObjects[overlay];
  }

  /**
   * Register event handler (see globe-engine-api.artifact)
   */
  on(event: string, handler: (event: GlobeEvent) => void): void {
    if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
    this.eventHandlers[event].push(handler);
  }

  /**
   * Emit event (see globe-engine-api.artifact)
   */
  emit(event: string, payload: unknown): void {
    (this.eventHandlers[event] || []).forEach(fn => fn({ type: event, payload }));
  }

  /**
   * Get current globe material (see globe-shaders.artifact)
   */
  getMaterial(): THREE.Material | null {
    return this.material;
  }
  // ...other API methods as defined in globe-engine-api.artifact
}
// Artifact references:
// - Overlay logic and periodic updates: globe-overlays.artifact
// - API/events: globe-engine-api.artifact

// AI-NOTE: Overlays for intelligence markers (SIGINT/HUMINT) are currently mocked.
// Per artifact-driven migration, overlays will fetch live data from Solana or secure backend only.
// See artifacts/intel-report-overlays.artifact for overlay types, data sources, and migration plan.

export const intelMarkersOverlay = {
  markers: [] as IntelReportOverlayMarker[],
  
  // Utility method to refresh markers from centralized service
  async refreshMarkers(): Promise<IntelReportOverlayMarker[]> {
    try {
      const { IntelReportVisualizationService } = await import('../services/IntelReportVisualizationService');
      const viz = new IntelReportVisualizationService();
      this.markers = await viz.getIntelReportMarkers();
      return this.markers;
    } catch (error) {
      console.error('Failed to refresh intel markers:', error);
      return [];
    }
  }
};
