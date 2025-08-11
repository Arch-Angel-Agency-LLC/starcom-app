import { describe, it, expect } from 'vitest';
import { sampleSpaceWeatherVectors } from './spaceWeatherSampling';

interface TestVector {
  latitude: number;
  longitude: number;
  magnitude: number;
  quality: number;
}

// Generate a pseudo uniform distribution plus clusters
function generateSyntheticVectors(): TestVector[] {
  const vectors: TestVector[] = [];
  for (let lat = -45; lat <= 45; lat += 10) {
    for (let lon = -170; lon <= 170; lon += 20) {
      vectors.push({ latitude: lat + Math.random()*0.5, longitude: lon + Math.random()*0.5, magnitude: 50 + Math.random()*20, quality: 4 });
    }
  }
  for (let i = 0; i < 300; i++) {
    vectors.push({ latitude: 60 + Math.random()*2, longitude: -50 + Math.random()*2, magnitude: 400 + Math.random()*200, quality: 5 });
  }
  for (let i = 0; i < 300; i++) {
    vectors.push({ latitude: 5 + Math.random()*2, longitude: 120 + Math.random()*2, magnitude: 300 + Math.random()*150, quality: 5 });
  }
  return vectors;
}

describe('spaceWeatherSampling', () => {
  const data = generateSyntheticVectors();

  it('legacy-topN biases toward high magnitude/quality clusters', () => {
    const result = sampleSpaceWeatherVectors(data, { strategy: 'legacy-topN', topNCap: 200 });
    expect(result.sampled.length).toBeLessThanOrEqual(200);
    const polarRatio = result.sampled.filter(v => v.latitude > 55).length / result.sampled.length;
    expect(polarRatio).toBeGreaterThan(0.3);
  });

  it('grid-binning improves spatial coverage', () => {
    const legacy = sampleSpaceWeatherVectors(data, { strategy: 'legacy-topN', topNCap: 200 });
    const grid = sampleSpaceWeatherVectors(data, { strategy: 'grid-binning', binSizeDeg: 10 });

    const legacyLatBins = new Set(legacy.sampled.map(v => Math.floor((v.latitude + 90)/10)));
    const gridLatBins = new Set(grid.sampled.map(v => Math.floor((v.latitude + 90)/10)));
    expect(gridLatBins.size).toBeGreaterThanOrEqual(legacyLatBins.size);

    const legacyPolarRatio = legacy.sampled.filter(v => v.latitude > 55).length / legacy.sampled.length;
    const gridPolarRatio = grid.sampled.filter(v => v.latitude > 55).length / grid.sampled.length;
    expect(gridPolarRatio).toBeLessThanOrEqual(legacyPolarRatio);
  });
});
