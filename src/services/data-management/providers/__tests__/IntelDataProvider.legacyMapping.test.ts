import { describe, it, expect } from 'vitest';
import { IntelDataProvider } from '../IntelDataProvider';

describe('IntelDataProvider legacy → UI mapping', () => {
  it('maps placeholder Solana legacy reports into IntelReportUI with correct aliases', async () => {
    const provider = new IntelDataProvider(); // no connection/programId => placeholder path

    const result = await provider.fetchData('solana-intel-reports');

    expect(Array.isArray(result)).toBe(true);
    const reports = result as any[];
    expect(reports.length).toBeGreaterThan(0);

    const r = reports[0];
    // Core IntelReportUI shape
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('title');
    expect(r).toHaveProperty('content');
    expect(r).toHaveProperty('author');
    expect(r).toHaveProperty('tags');
    expect(r).toHaveProperty('classification');
    expect(r).toHaveProperty('status', 'DRAFT');
    expect(r.createdAt instanceof Date).toBe(true);
    expect(r.updatedAt instanceof Date).toBe(true);

    // Alias handling: legacy UNCLASS -> UNCLASSIFIED (if present in placeholder, others pass-through)
    expect(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']).toContain(r.classification);

    // Lat/Lon alias becomes latitude/longitude in UI
    expect(typeof r.latitude).toBe('number');
    expect(typeof r.longitude).toBe('number');
  });
});
