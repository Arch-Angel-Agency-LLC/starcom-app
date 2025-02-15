// src/context/GlobeContext.tsx
import { create } from "zustand";

export const useGlobeContext = create((set) => ({
  geoMarkers: [],
  spaceEntities: [],
  fetchGlobeData: async () => {
    const res = await fetch("/api/globe-data");
    const data = await res.json();
    set({ geoMarkers: data.markers, spaceEntities: data.space });
  },
}));