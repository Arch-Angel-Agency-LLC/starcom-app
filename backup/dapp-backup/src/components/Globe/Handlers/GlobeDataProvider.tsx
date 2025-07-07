// src/components/Globe/Handlers/GlobeDataProvider.tsx
import { create } from 'zustand';

// Define Zustand store for managing globe-related data
export const useGlobeData = create((set) => ({
  geoMarkers: [],
  geoOverlays: [],
  spaceEntities: [],

  fetchGeoMarkers: async () => {
    const res = await fetch('/api/geo-markers');
    const data = await res.json();
    set({ geoMarkers: data });
  },

  fetchGeoOverlays: async () => {
    const res = await fetch('/api/geo-overlays');
    const data = await res.json();
    set({ geoOverlays: data });
  },

  fetchSpaceEntities: async () => {
    const res = await fetch('/api/space-entities');
    const data = await res.json();
    set({ spaceEntities: data });
  },

  // selectGeoMarker: (marker) => set({ selectedGeoMarker: marker }),
  // selectSpaceEntity: (entity) => set({ selectedSpaceEntity: entity }),
}));