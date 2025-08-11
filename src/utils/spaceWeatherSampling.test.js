const { sampleSpaceWeatherVectors } = require('./spaceWeatherSampling.js');

// Deterministic synthetic dataset to avoid flaky tests.
// Pattern:
//  - Uniform mid-latitude grid (-45..45 every 10°, lon -170..170 every 20°)
//  - High magnitude polar cluster (lat 60, lon -50) 300 duplicate points
//  - High magnitude equatorial-ish cluster (lat 5, lon 120) 300 duplicate points
// Legacy top-N should over-select the two dense clusters; grid-binning should retain broad coverage.

describe('spaceWeatherSampling (deterministic)', () => {
  function buildDataset() {
    const vectors = [];
    // Uniform grid
    for (let lat = -45; lat <= 45; lat += 10) {
      for (let lon = -170; lon <= 170; lon += 20) {
        vectors.push({ latitude: lat, longitude: lon, magnitude: 60, quality: 4 });
      }
    }
    // Polar cluster (extreme values)
    for (let i = 0; i < 300; i++) {
      vectors.push({ latitude: 60, longitude: -50, magnitude: 500, quality: 5 });
    }
    // Secondary cluster
    for (let i = 0; i < 300; i++) {
      vectors.push({ latitude: 5, longitude: 120, magnitude: 400, quality: 5 });
    }
    return vectors;
  }

  const data = buildDataset();

  test('legacy-topN biases toward dense high-magnitude clusters (high polar ratio)', () => {
    const result = sampleSpaceWeatherVectors(data, { strategy: 'legacy-topN', topNCap: 200 });
    expect(result.sampled.length).toBeLessThanOrEqual(200);
    const polarRatio = result.sampled.filter(v => v.latitude > 55).length / result.sampled.length;
    expect(polarRatio).toBeGreaterThan(0.35); // Biased toward polar cluster
  });

  test('grid-binning improves spatial coverage & reduces polar dominance', () => {
    const legacy = sampleSpaceWeatherVectors(data, { strategy: 'legacy-topN', topNCap: 200 });
    const grid = sampleSpaceWeatherVectors(data, { strategy: 'grid-binning', binSizeDeg: 10 });

    const legacyLatBins = new Set(legacy.sampled.map(v => Math.floor((v.latitude + 90)/10)));
    const gridLatBins = new Set(grid.sampled.map(v => Math.floor((v.latitude + 90)/10)));
    expect(gridLatBins.size).toBeGreaterThanOrEqual(legacyLatBins.size);

    const legacyPolarRatio = legacy.sampled.filter(v => v.latitude > 55).length / legacy.sampled.length;
    const gridPolarRatio = grid.sampled.filter(v => v.latitude > 55).length / grid.sampled.length;
    expect(gridPolarRatio).toBeLessThan(legacyPolarRatio);
  });
});
