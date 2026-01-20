// src/services/GeoEventsService.ts
// Artifact-driven: Provides real-time natural event data for overlays (see globe-overlays.artifact)
import axios from 'axios';
import { DataManagerHelpers, createConfiguredDataManager } from './data-management/providerRegistry';
import { GeoEventsDataProvider, type USGSEarthquakeData, type VolcanicEvent } from './data-management/providers/GeoEventsDataProvider';

const GEO_EVENTS_API_URL = String(import.meta.env.VITE_GEO_EVENTS_API_URL || 'https://api.starcom.app/natural-events');
const DEFAULT_TIMEOUT_MS = 12000;

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

const normalizeVolcanoEvents = (events: unknown): NaturalEvent[] => {
  if (events !== undefined && !Array.isArray(events)) {
    console.error('Invalid volcano payload; expected array.');
    return [];
  }
  if (!Array.isArray(events)) return [];
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
    console.error('Invalid wildfire payload; expected array.');
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

const fetchFromDataManager = async (): Promise<NaturalEvent[]> => {
  const helpers = await getHelpers();
  const payload = await helpers.getNaturalEventsData();
  return normalizeNaturalEvents(payload as NaturalEventsPayload);
};

export const fetchNaturalEvents = async (options: FetchNaturalEventsOptions = {}): Promise<NaturalEvent[]> => {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
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
      return await fetchFromDataManager();
    } catch (error) {
      console.error('DataManager natural events fetch failed, falling back to legacy endpoint', error);
      return fetchLegacyNaturalEvents();
    }
  })();

  try {
    const contenders = [fetchPromise, abortPromise, timeoutPromise].filter(Boolean) as Promise<NaturalEvent[]>[];
    const result = await Promise.race(contenders);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
