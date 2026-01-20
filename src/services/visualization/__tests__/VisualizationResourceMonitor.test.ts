import { describe, it, expect } from 'vitest';
import { visualizationResourceMonitor } from '../VisualizationResourceMonitor';

const MODE = 'EcoNatural.EcologicalDisasters';

describe('VisualizationResourceMonitor', () => {
  it('clears snapshots to avoid orphaned resource entries', () => {
    visualizationResourceMonitor.setBudgets(MODE, { maxVectors: 1 });
    visualizationResourceMonitor.recordVectors(MODE, { count: 2 });
    const snapBefore = visualizationResourceMonitor.getSnapshot(MODE);
    expect(Array.isArray(snapBefore)).toBe(false);
    if (!Array.isArray(snapBefore)) {
      expect(snapBefore.vectors?.count).toBe(2);
      expect(snapBefore.warnings).toContain('vectors>1');
    }

    visualizationResourceMonitor.clearMode(MODE);
    const snapAfter = visualizationResourceMonitor.getSnapshot(MODE);
    if (!Array.isArray(snapAfter)) {
      expect(snapAfter.vectors).toBeUndefined();
      expect(snapAfter.warnings).toHaveLength(0);
    }
  });
});
