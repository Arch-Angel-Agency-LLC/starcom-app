// Dedicated hook export to satisfy fast refresh constraints
import { useContext } from 'react';
import SpaceWeatherProvider from './SpaceWeatherContext';
import type { VisualizationVector } from './SpaceWeatherContext';

// Re-export context type by importing the context from original file
import { } from './SpaceWeatherContext';

// NOTE: The actual context object is not exported separately previously; adjust to export from original if needed.
// To keep minimal change, we'll import the default provider and rely on internal module augmentation.
// If the context itself needs external usage, consider exporting it explicitly.

// Placeholder to avoid unused import warnings
void VisualizationVector;

export const useSpaceWeatherContext = () => {
  // Since the context isn't exported, this is a temporary shim until refactor exposes it.
  // Throw to highlight if inadvertently used without updated export design.
  throw new Error('useSpaceWeatherContext temporary shim: context object not exported. Refactor required.');
};
