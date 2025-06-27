// src/context/IntelContext.tsx
import { create } from "zustand";

export const useIntelContext = create((set) => ({
  threatReports: [],
  cyberAlerts: [],
  fetchIntelData: async () => {
    const res = await fetch("/api/intelligence");
    const data = await res.json();
    set({ threatReports: data.reports, cyberAlerts: data.cyber });
  },
}));