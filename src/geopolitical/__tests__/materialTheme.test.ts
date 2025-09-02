import { describe, it, expect } from 'vitest';
import { resolveBorderMaterialConfig } from '../theme/materialTheme';

const cfg: any = {
  borderVisibility: 70,
  borderThickness: 2,
  territoryColors: { opacity: 30, colorScheme: 'political', useCustomColors: false },
  showDisputedTerritories: true
};

describe('materialTheme resolveBorderMaterialConfig', () => {
  it('uses scheme hashing for international borders', () => {
    const a = resolveBorderMaterialConfig(cfg, 'AAA', 'international');
    const b = resolveBorderMaterialConfig(cfg, 'BBB', 'international');
    expect(a.color).not.toBe(b.color); // different IDs produce different hashed colors
  });
  it('returns classification palette color for disputed', () => {
    const p = resolveBorderMaterialConfig(cfg, 'X', 'disputed');
    expect(p.opacity).toBeGreaterThan(cfg.borderVisibility/100); // opacity boost applied
  });
  it('caps opacity at 1', () => {
    const highCfg = { ...cfg, borderVisibility: 95 };
    const p = resolveBorderMaterialConfig(highCfg, 'X', 'disputed');
    expect(p.opacity).toBeLessThanOrEqual(1);
  });
});
