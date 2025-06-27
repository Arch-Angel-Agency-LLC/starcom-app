// src/components/Globe/Handlers/GlobeLayerManager.tsx
//import { create } from 'zustand';

// Define the Zustand store for managing layer states
// export const useGlobeLayers = create((set) => ({
//   showGeoMarkers: true,
//   showGeoOverlays: true,
//   showGeoEvents: true,
//   showGeoWeather: true,
//   showGeoHeatmap: true,
//   showIntelNodes: true,
//   showSpaceEntities: true,
//   showSpaceAssets: true,
//   showSpacecraft: true,

//   toggleLayer: (layer: string) =>
//     set((state) => ({ [layer]: !state[layer] })),
// }));

// Component to toggle layers dynamically
export function GlobeLayerManager() {
  //const layers = useGlobeLayers();

  return (
    <div className="globe-layer-manager">
      {/* {Object.keys(layers)
        .filter((key) => key.startsWith('show'))
        .map((layer) => (
          <button key={layer} onClick={() => layers.toggleLayer(layer)}>
            {layers[layer] ? `Hide ${layer}` : `Show ${layer}`}
          </button>
        ))} */}
    </div>
  );
}