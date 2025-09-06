// src/services/GeoEventsService.ts
// Artifact-driven: Provides real-time natural event data for overlays (see globe-overlays.artifact)
import axios from 'axios';

const GEO_EVENTS_API_URL = String(import.meta.env.VITE_GEO_EVENTS_API_URL || 'https://api.starcom.app/natural-events');

export interface NaturalEvent {
  id: string | number;
  lat: number;
  lng: number;
  type: string; // e.g., 'earthquake', 'volcano'
  magnitude?: number;
  status?: string;
  timestamp?: string;
}

export const fetchNaturalEvents = async (): Promise<NaturalEvent[]> => {
  try {
    const response = await axios.get(GEO_EVENTS_API_URL);
    // Defensive: ensure array of events
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.events)) return response.data.events;
    return [];
  } catch (error) {
    console.error('Error fetching natural events:', error);
    return [];
  }
};
