// NOAA Globe Visualization Manager
// Connects NOAA visualization controls to the actual Globe rendering

import React from 'react';
import { NOAA_VISUALIZATIONS } from './NOAAVisualizationConfig';

export interface GlobeVisualizationUpdate {
  type: 'add' | 'remove' | 'update';
  visualizationId: string;
  datasetId: string;
  config: {
    type: 'heatmap' | 'particles' | 'field_lines' | 'markers' | 'atmosphere' | 'rings';
    intensity: 'low' | 'medium' | 'high';
    color: string;
    enabled: boolean;
  };
}

export class NOAAGlobeVisualizationManager {
  private subscribers: ((updates: GlobeVisualizationUpdate[]) => void)[] = [];
  private activeVisualizations: Map<string, GlobeVisualizationUpdate> = new Map();

  constructor() {
    // Initialize with enabled visualizations
    this.syncFromConfig();
  }

  // Subscribe to visualization changes
  subscribe(callback: (updates: GlobeVisualizationUpdate[]) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Sync visualization state from NOAA config
  syncFromConfig() {
    const updates: GlobeVisualizationUpdate[] = [];
    
    NOAA_VISUALIZATIONS.forEach(dataset => {
      dataset.options.forEach(option => {
        const visualizationId = option.id;
        const currentVisualization = this.activeVisualizations.get(visualizationId);
        
        if (option.enabled && !currentVisualization) {
          // Add new visualization
          const update: GlobeVisualizationUpdate = {
            type: 'add',
            visualizationId,
            datasetId: dataset.datasetId,
            config: {
              type: option.type,
              intensity: option.intensity,
              color: option.color,
              enabled: true
            }
          };
          this.activeVisualizations.set(visualizationId, update);
          updates.push(update);
        } else if (!option.enabled && currentVisualization) {
          // Remove visualization
          const update: GlobeVisualizationUpdate = {
            type: 'remove',
            visualizationId,
            datasetId: dataset.datasetId,
            config: {
              type: option.type,
              intensity: option.intensity,
              color: option.color,
              enabled: false
            }
          };
          this.activeVisualizations.delete(visualizationId);
          updates.push(update);
        } else if (option.enabled && currentVisualization) {
          // Check if visualization needs update
          const needsUpdate = 
            currentVisualization.config.type !== option.type ||
            currentVisualization.config.intensity !== option.intensity ||
            currentVisualization.config.color !== option.color;
          
          if (needsUpdate) {
            const update: GlobeVisualizationUpdate = {
              type: 'update',
              visualizationId,
              datasetId: dataset.datasetId,
              config: {
                type: option.type,
                intensity: option.intensity,
                color: option.color,
                enabled: true
              }
            };
            this.activeVisualizations.set(visualizationId, update);
            updates.push(update);
          }
        }
      });
    });

    if (updates.length > 0) {
      this.notifySubscribers(updates);
    }
  }

  // Force sync - useful for external triggers
  forceSync() {
    this.syncFromConfig();
  }

  // Get current active visualizations
  getActiveVisualizations(): GlobeVisualizationUpdate[] {
    return Array.from(this.activeVisualizations.values());
  }

  // Get visualization by ID
  getVisualization(visualizationId: string): GlobeVisualizationUpdate | undefined {
    return this.activeVisualizations.get(visualizationId);
  }

  // Check if visualization is active
  isActive(visualizationId: string): boolean {
    return this.activeVisualizations.has(visualizationId);
  }

  // Get visualizations by dataset
  getVisualizationsByDataset(datasetId: string): GlobeVisualizationUpdate[] {
    return Array.from(this.activeVisualizations.values())
      .filter(viz => viz.datasetId === datasetId);
  }

  // Get visualizations by type
  getVisualizationsByType(type: string): GlobeVisualizationUpdate[] {
    return Array.from(this.activeVisualizations.values())
      .filter(viz => viz.config.type === type);
  }

  // Get performance stats
  getStats() {
    const byType = new Map<string, number>();
    const byIntensity = new Map<string, number>();
    
    this.activeVisualizations.forEach(viz => {
      byType.set(viz.config.type, (byType.get(viz.config.type) || 0) + 1);
      byIntensity.set(viz.config.intensity, (byIntensity.get(viz.config.intensity) || 0) + 1);
    });

    return {
      total: this.activeVisualizations.size,
      byType: Object.fromEntries(byType),
      byIntensity: Object.fromEntries(byIntensity),
      recommendedPerformanceLevel: this.calculatePerformanceLevel()
    };
  }

  private calculatePerformanceLevel(): 'high' | 'medium' | 'low' {
    const totalViz = this.activeVisualizations.size;
    const highIntensityCount = Array.from(this.activeVisualizations.values())
      .filter(viz => viz.config.intensity === 'high').length;
    
    if (totalViz > 20 || highIntensityCount > 8) return 'low';
    if (totalViz > 10 || highIntensityCount > 4) return 'medium';
    return 'high';
  }

  private notifySubscribers(updates: GlobeVisualizationUpdate[]) {
    this.subscribers.forEach(callback => {
      try {
        callback(updates);
      } catch (error) {
        console.error('Error in visualization subscriber:', error);
      }
    });
  }

  // Debug helpers
  debug() {
    console.log('NOAA Globe Visualizations Manager State:');
    console.log('Active visualizations:', this.activeVisualizations.size);
    console.log('Performance stats:', this.getStats());
    console.log('Active visualizations:', Array.from(this.activeVisualizations.entries()));
  }
}

// Create singleton instance
export const globeVisualizationManager = new NOAAGlobeVisualizationManager();

// React hook for subscribing to visualization changes
export const useNOAAGlobeVisualizations = () => {
  const [visualizations, setVisualizations] = React.useState<GlobeVisualizationUpdate[]>([]);
  const [stats, setStats] = React.useState(globeVisualizationManager.getStats());

  React.useEffect(() => {
    // Initial state
    setVisualizations(globeVisualizationManager.getActiveVisualizations());
    setStats(globeVisualizationManager.getStats());

    // Subscribe to changes
    const unsubscribe = globeVisualizationManager.subscribe(() => {
      setVisualizations(globeVisualizationManager.getActiveVisualizations());
      setStats(globeVisualizationManager.getStats());
    });

    return unsubscribe;
  }, []);

  return {
    visualizations,
    stats,
    forceSync: () => globeVisualizationManager.forceSync(),
    isActive: (id: string) => globeVisualizationManager.isActive(id),
    getByDataset: (datasetId: string) => globeVisualizationManager.getVisualizationsByDataset(datasetId),
    getByType: (type: string) => globeVisualizationManager.getVisualizationsByType(type)
  };
};

export default globeVisualizationManager;
