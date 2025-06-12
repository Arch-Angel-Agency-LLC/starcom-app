# 📜 Globe System Managers & Handlers - Explanation for Copilot

(This file explains the role of GlobeDataProvider, GlobeEventHandler, and GlobeLayerManager in the Starcom App’s 3D Globe interface.)

## 🛰️ Overview

The 3D Globe interface in Starcom is a real-time, interactive visualization system built using react-globe.gl. It displays geospatial intelligence, space assets, and global events.

To ensure the system is scalable, modular, and efficient, we implement three key management components:

Component	Purpose
GlobeDataProvider	Manages data fetching, caching, and subscriptions for globe-related data.
GlobeEventHandler	Handles user interactions (clicks, hover, selections) and updates UI accordingly.
GlobeLayerManager	Controls which layers are visible on the globe dynamically.

These three components ensure that data, events, and visibility settings are handled separately, improving performance and maintainability.

## 📂 GlobeDataProvider - Centralized Data Handling

📌 Purpose:
	•	Acts as the single source of truth for all globe-related data.
	•	Manages API requests, caching, and real-time updates for markers, overlays, space objects, etc.
	•	Ensures all components use the same data set, avoiding redundant API calls.

🔹 Why We Need This:

✔ Prevents duplicate data requests across different components.
✔ Ensures all globe elements stay in sync (e.g., when crisis zones update).
✔ Supports lazy-loading for performance optimization.

🛠️ How It Works:
	•	Provides global state using Zustand or React Context.
	•	Fetches data from APIs only when necessary.
	•	Supports real-time updates when intelligence events change.

```tsx
// GlobeDataProvider.tsx (Example using Zustand)
import { create } from 'zustand';

export const useGlobeData = create((set) => ({
  geoMarkers: [],
  geoOverlays: [],
  spaceEntities: [],
  fetchData: async () => {
    const res = await fetch('/api/globe-data');
    const data = await res.json();
    set({ geoMarkers: data.markers, geoOverlays: data.overlays, spaceEntities: data.space });
  },
}));
```

## 📂 GlobeEventHandler - User Interaction Manager

📌 Purpose:
	•	Handles all user interactions with the 3D globe.
	•	Detects clicks, hovers, zooms, drags, and relays this data to other components.
	•	Ensures intelligence reports, HUD updates, and UI changes trigger correctly when interacting with the globe.

🔹 Why We Need This:

✔ Allows users to click on a marker, overlay, or space object and receive real-time data.
✔ Prevents duplicated event listeners inside individual components.
✔ Improves responsiveness by debouncing interactions.

🛠️ How It Works:
	•	Listens for clicks, hovers, and other input events on the globe.
	•	Passes interaction details to the HUD, Sidebars, and Data Layers.
	•	Uses event delegation to handle multiple globe elements efficiently.

```tsx
// GlobeEventHandler.tsx
export function GlobeEventHandler({ globeRef }) {
  const handleClick = (event) => {
    if (event.type === 'marker') {
      console.log(`Marker clicked: ${event.name}`);
      // Trigger UI updates (HUD, Sidebar)
    }
  };

  return <Globe ref={globeRef} onClick={handleClick} />;
}
```

## 📂 GlobeLayerManager - Visibility Control for Data Layers

📌 Purpose:
	•	Manages which data layers are visible or hidden.
	•	Allows users to toggle geopolitical overlays, markers, heatmaps, and space assets dynamically.
	•	Prevents unnecessary rendering of hidden layers, improving performance.

🔹 Why We Need This:

✔ Helps users focus on specific intelligence layers (e.g., only show crisis zones).
✔ Reduces unnecessary rendering (improving FPS & performance).
✔ Supports dynamic filtering (e.g., show only “high-risk” markers).

🛠️ How It Works:
	•	Uses Zustand or React Context to store layer visibility state.
	•	Components subscribe to the layer manager instead of manually toggling visibility.

```tsx
// GlobeLayerManager.tsx (Zustand Store)
export const useGlobeLayers = create((set) => ({
  showHeatmap: true,
  showMarkers: true,
  showSpaceEntities: true,
  toggleLayer: (layer) => set((state) => ({ [layer]: !state[layer] })),
}));

// Example Toggle Component
export function LayerToggle() {
  const { showHeatmap, toggleLayer } = useGlobeLayers();

  return <button onClick={() => toggleLayer('showHeatmap')}>{showHeatmap ? 'Hide' : 'Show'} Heatmap</button>;
}
```

## 🚀 Summary of Responsibilities

**Component	Primary Role	Key Benefits**
GlobeDataProvider	Centralized data fetching, caching, and distribution.	✅ Prevents duplicate API calls ✅ Keeps all components in sync ✅ Supports real-time updates.
GlobeEventHandler	Manages user interactions (clicks, hovers, selections).	✅ Ensures UI updates correctly ✅ Avoids event duplication ✅ Supports intelligent interaction flow.
GlobeLayerManager	Handles visibility toggles for data layers.	✅ Improves rendering performance ✅ Allows dynamic filtering ✅ Prevents excessive DOM updates.

## 🚀 Why This Architecture Makes Development Easier

✅ Encapsulates Responsibilities – No component does too much, making maintenance easier.
✅ Improves Scalability – New features can be plugged into the existing system without breaking it.
✅ Boosts Performance – Lazy loads & caches data instead of constantly fetching.
✅ Enhances User Experience – Users can interact smoothly, with minimal lag.