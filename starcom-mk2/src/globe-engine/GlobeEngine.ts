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
  private mode: string;
  private overlays: string[];
  private material: THREE.Material | null = null;
  private eventHandlers: Record<string, ((event: GlobeEvent) => void)[]> = {};
  private overlayData: Record<string, unknown> = {};
  // Overlay data cache (see globe-overlays.artifact, UI/UX guidelines)
  private overlayDataCache: Record<string, unknown> = {};
  private spaceAssetsInterval: NodeJS.Timeout | null = null; // For periodic updates

  constructor(config: GlobeEngineConfig) {
    this.mode = config.mode;
    this.overlays = config.overlays || [];
    if (config.onEvent) this.on('event', config.onEvent);
    // Async init
    this.init();
  }

  private async init() {
    // AI-NOTE: See globe-mode-mapping-reference.artifact, globe-modes.artifact, globe-shaders.artifact, globe-textures.artifact
    const renderConfig = GlobeModeMapping.getRenderConfigForMode(this.mode);
    const textureNames = [renderConfig.texture, 'blueMarble', 'earthDay', 'earthDark'];
    const textures: Record<string, THREE.Texture> = {};
    for (const name of textureNames) {
      textures[`${name}Texture`] = await GlobeTextureLoader.loadTexture(name);
    }
    this.material = GlobeMaterialManager.getMaterialForMode(renderConfig.shader, textures);
    // TODO: Initialize overlays
    // If spaceAssets overlay is active, start periodic updates (artifact-driven, see globe-overlays.artifact)
    if (this.overlays.includes('spaceAssets')) {
      this.startSpaceAssetsUpdates();
    } else {
      this.stopSpaceAssetsUpdates();
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

  /**
   * Switch globe mode (see globe-modes.artifact)
   */
  setMode(mode: string): void {
    this.mode = mode;
    // Artifact-driven: Reset overlays to mode defaults (see globe-modes.artifact, globe-mode-mapping-reference.artifact)
    const modeDefaults: Record<string, string[]> = {
      CyberCommand: ['alerts', 'intelMarkers', 'markers'],
      EcoNatural: ['weather', 'naturalEvents', 'markers'],
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
        // Start/stop periodic updates for spaceAssets
        if (overlay === 'spaceAssets') this.startSpaceAssetsUpdates();
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
        // Mock: fetch intel markers from API (see globe-overlays.artifact)
        setTimeout(() => {
          const data = [
            { id: 1, lat: 48.85, lng: 2.35, type: 'intel', label: 'SIGINT Report' },
            { id: 2, lat: 34.05, lng: -118.25, type: 'intel', label: 'HUMINT Source' }
          ];
          this.overlayDataCache['intelMarkers'] = data;
          this.setOverlayData('intelMarkers', data);
        }, 500);
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
    // Stop periodic updates for spaceAssets
    if (overlay === 'spaceAssets') this.stopSpaceAssetsUpdates();
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

  /**
   * Set overlay data (see globe-overlays.artifact)
   */
  setOverlayData(overlay: string, data: unknown): void {
    // AI-NOTE: Overlay data update mechanism should be defined in globe-overlays.artifact
    this.overlayData[overlay] = data;
    this.emit('overlayDataUpdated', { overlay, data });
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
