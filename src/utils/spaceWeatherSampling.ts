// Utility for sampling space weather electric field vectors (Phase 0)
// Provides both legacy top-N biased sampling and provisional grid-binning strategy.

export interface BasicVector {
  latitude: number;
  longitude: number;
  magnitude: number;
  quality: number;
}

export interface SamplingResult<T extends BasicVector> {
  sampled: T[];
  strategy: 'legacy-topN' | 'grid-binning';
  stats: {
    inputCount: number;
    outputCount: number;
    binCount?: number;
  };
}

export interface SamplingOptions {
  strategy: 'legacy-topN' | 'grid-binning';
  topNCap?: number;          // only used by legacy-topN
  minQuality?: number;       // default 3
  binSizeDeg?: number;       // only used by grid-binning, default 5
}

export function sampleSpaceWeatherVectors<T extends BasicVector>(
  vectors: T[],
  options: SamplingOptions
): SamplingResult<T> {
  const { strategy } = options;
  if (strategy === 'legacy-topN') {
    const topNCap = options.topNCap ?? 500;
    const minQuality = options.minQuality ?? 3;
    let working = vectors.filter(v => v.quality >= minQuality);
    if (working.length > topNCap) {
      working = working
        .sort((a, b) => (b.magnitude * b.quality) - (a.magnitude * a.quality))
        .slice(0, topNCap);
    }
    return {
      sampled: working,
      strategy,
      stats: { inputCount: vectors.length, outputCount: working.length }
    };
  }

  // grid-binning strategy
  const binSizeDeg = options.binSizeDeg ?? 5;
  const minQuality = options.minQuality ?? 3;
  const bins = new Map<string, T>();
  for (const v of vectors) {
    if (v.quality < minQuality) continue;
    const latBin = Math.floor((v.latitude + 90) / binSizeDeg);
    const lonBin = Math.floor((v.longitude + 180) / binSizeDeg);
    const key = `${latBin}:${lonBin}`;
    const existing = bins.get(key);
    if (!existing) {
      bins.set(key, v);
    } else {
      const scoreNew = v.magnitude * v.quality;
      const scoreOld = existing.magnitude * existing.quality;
      if (scoreNew > scoreOld) bins.set(key, v);
    }
  }
  const sampled = Array.from(bins.values());
  return {
    sampled,
    strategy,
    stats: { inputCount: vectors.length, outputCount: sampled.length, binCount: bins.size }
  };
}
