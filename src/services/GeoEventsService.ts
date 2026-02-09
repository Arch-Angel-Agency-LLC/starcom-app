// src/services/GeoEventsService.ts
// Artifact-driven: Provides real-time natural event data for overlays (see globe-overlays.artifact)
import axios from 'axios';
import { DataManagerHelpers, createConfiguredDataManager } from './data-management/providerRegistry';
import { GeoEventsDataProvider, type USGSEarthquakeData, type VolcanicEvent } from './data-management/providers/GeoEventsDataProvider';

const GEO_EVENTS_API_URL = String(import.meta.env.VITE_GEO_EVENTS_API_URL || 'https://api.starcom.app/natural-events');
const DEFAULT_TIMEOUT_MS = 12000;
const CACHE_TTL_MS = 45_000; // prevent rapid re-fetch when multiple consumers poll

export interface NaturalEvent {
  id: string | number;
  lat: number;
  lng: number;
  type: string; // e.g., 'earthquake', 'volcano'
  magnitude?: number;
  status?: string;
  timestamp?: string;
  description?: string;
  source?: string;
  intensity?: number;
  isMock?: boolean;
}

export interface FetchNaturalEventsOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

type NaturalEventsPayload = {
  earthquakes?: unknown;
  wildfires?: unknown;
  volcanoes?: unknown;
};

let helpersPromise: Promise<DataManagerHelpers> | null = null;
let lastResultCache: { data: NaturalEvent[]; timestamp: number } | null = null;
let inFlight: { startedAt: number; promise: Promise<NaturalEvent[]> } | null = null;

const getHelpers = async () => {
  if (!helpersPromise) {
    helpersPromise = createConfiguredDataManager().then((manager) => new DataManagerHelpers(manager));
  }
  return helpersPromise;
};

const fetchLegacyNaturalEvents = async (): Promise<NaturalEvent[]> => {
  try {
    const response = await axios.get(GEO_EVENTS_API_URL);
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.events)) return response.data.events;
    return [];
  } catch (error) {
    console.error('Error fetching natural events:', error);
    return [];
  }
};

let volcanoWarningEmitted = false;

const normalizeVolcanoEvents = (events: unknown): NaturalEvent[] => {
  if (events === undefined || events === null) return [];

  // If we accidentally received a GeoJSON FeatureCollection, treat as non-volcano payload and skip quietly.
  const looksLikeGeoJson = typeof events === 'object' && events !== null && 'type' in (events as Record<string, unknown>) && 'features' in (events as Record<string, unknown>);
  if (looksLikeGeoJson) {
    if (!volcanoWarningEmitted) {
      volcanoWarningEmitted = true;
      console.warn('Dropping non-volcano payload assigned to volcanoes (looks like GeoJSON); skipping.', {
        receivedType: typeof events,
        sampleKeys: Object.keys(events as Record<string, unknown>).slice(0, 5)
      });
    }
    return [];
  }

  if (!Array.isArray(events)) {
    if (!volcanoWarningEmitted) {
      volcanoWarningEmitted = true;
      console.warn('Invalid volcano payload; expected array.', {
        receivedType: typeof events,
        sampleKeys: typeof events === 'object' && events ? Object.keys(events as Record<string, unknown>).slice(0, 5) : []
      });
    }
    return [];
  }
  return (events as VolcanicEvent[]).map((volcano) => ({
    id: volcano.id,
    lat: volcano.lat,
    lng: volcano.lng,
    type: 'volcano',
    status: volcano.status,
    timestamp: volcano.last_eruption ? new Date(volcano.last_eruption).toISOString() : undefined,
    description: volcano.name,
    source: 'volcano-mock',
    isMock: true
  }));
};

const normalizeWildfireEvents = (events: unknown): NaturalEvent[] => {
  if (events !== undefined && !Array.isArray(events)) {
    console.warn('Invalid wildfire payload; expected array.', {
      receivedType: typeof events,
      sampleKeys: typeof events === 'object' && events ? Object.keys(events as Record<string, unknown>).slice(0, 5) : []
    });
    return [];
  }
  if (!Array.isArray(events)) return [];
  return (events as NaturalEvent[]).filter(
    (e) => typeof e.lat === 'number' && Number.isFinite(e.lat) && typeof e.lng === 'number' && Number.isFinite(e.lng)
  );
};

const normalizeEarthquakeEvents = (events: unknown): NaturalEvent[] => {
  if (!events) return [];
  if (Array.isArray(events)) return events as NaturalEvent[];

  const geoJson = events as USGSEarthquakeData;
  if (geoJson?.type === 'FeatureCollection' && Array.isArray(geoJson.features)) {
    const provider = new GeoEventsDataProvider();
    return provider.transformUSGSToNaturalEvents(geoJson);
  }

  console.error('Invalid earthquake payload; expected USGS FeatureCollection.');

  return [];
};

const normalizeNaturalEvents = (payload: NaturalEventsPayload): NaturalEvent[] => {
  if (!payload || typeof payload !== 'object') {
    console.error('Invalid natural events payload received; expected object payload.');
    return [];
  }

  const { earthquakes, volcanoes, wildfires, ...unsupported } = payload as Record<string, unknown>;
  const unsupportedKeys = Object.keys(unsupported);
  if (unsupportedKeys.length) {
    console.warn('Dropping unsupported hazard types', unsupportedKeys);
  }

  const normalized: NaturalEvent[] = [];
  normalized.push(...normalizeEarthquakeEvents(earthquakes));
  normalized.push(...normalizeVolcanoEvents(volcanoes));
  normalized.push(...normalizeWildfireEvents(wildfires));
  return normalized;
};

const fetchFromDataManager = async (): Promise<NaturalEventsPayload> => {
  const helpers = await getHelpers();
  return helpers.getNaturalEventsData() as unknown as NaturalEventsPayload;
};

export const fetchNaturalEvents = async (options: FetchNaturalEventsOptions = {}): Promise<NaturalEvent[]> => {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const now = Date.now();

  if (lastResultCache && now - lastResultCache.timestamp < CACHE_TTL_MS) {
    return lastResultCache.data;
  }

  if (inFlight) {
    return inFlight.promise;
  }
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      })
    : null;

  const timeoutPromise = timeoutMs
    ? new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Natural events fetch timed out')), timeoutMs);
      })
    : null;

  const fetchPromise = (async () => {
    try {
      const payload = await fetchFromDataManager();
      const summary = Array.isArray(payload)
        ? {
            totalEvents: payload.length,
            volcanoes: payload.filter((e) => (e as NaturalEvent)?.type === 'volcano').length,
            earthquakes: payload.filter((e) => (e as NaturalEvent)?.type === 'earthquake').length,
            wildfires: payload.filter((e) => (e as NaturalEvent)?.type === 'wildfire').length
          }
        : {
            earthquakes: Array.isArray((payload as any)?.earthquakes?.features) ? (payload as any).earthquakes.features.length : 0,
            volcanoes: Array.isArray((payload as any)?.volcanoes) ? (payload as any).volcanoes.length : 0,
            wildfires: Array.isArray((payload as any)?.wildfires) ? (payload as any).wildfires.length : 0
          };
      console.info('[GeoEvents] Normalizing payload', summary);
      const normalized = Array.isArray(payload) ? (payload as NaturalEvent[]) : normalizeNaturalEvents(payload as NaturalEventsPayload);
      lastResultCache = { data: normalized, timestamp: Date.now() };
      return normalized;
    } catch (error) {
      console.error('DataManager natural events fetch failed, falling back to legacy endpoint', error);
      const legacy = await fetchLegacyNaturalEvents();
      lastResultCache = { data: legacy, timestamp: Date.now() };
      return legacy;
    }
  })();

  inFlight = { startedAt: now, promise: fetchPromise.finally(() => { inFlight = null; }) as Promise<NaturalEvent[]> };

  try {
    const contenders = [fetchPromise, abortPromise, timeoutPromise].filter(Boolean) as Promise<NaturalEvent[]>[];
    const result = await Promise.race(contenders);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    inFlight = null;
  }
};
