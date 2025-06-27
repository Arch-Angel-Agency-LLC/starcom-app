// src/services/AlertsService.ts
// Artifact-driven: Provides real-time or recent alert data for overlays (see globe-overlays.artifact)
import axios from 'axios';

const ALERTS_API_URL = import.meta.env.VITE_ALERTS_API_URL || 'https://api.starcom.app/alerts';

export interface Alert {
  id: string | number;
  lat: number;
  lng: number;
  type: string;
  message: string;
  timestamp?: string;
}

export const fetchAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await axios.get(ALERTS_API_URL);
    // Defensive: ensure array of alerts
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data.alerts)) return response.data.alerts;
    return [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};
