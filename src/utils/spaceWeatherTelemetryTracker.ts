type SamplingStrategy = 'legacy-topN' | 'grid-binning';

type GatingReason = null | 'inactiveLayer' | 'disabled' | 'noData';

export interface SpaceWeatherTelemetrySnapshot {
  timestamp: number;
  provider: string;
  activeLayer: string;
  samplingStrategy: SamplingStrategy;
  raw: {
    intermag: number;
    usCanada: number;
    pipeline: number;
    combined: number;
  };
  sampled: number;
  rendered: number;
  gatingReason: GatingReason;
  datasetFlags: {
    intermag: boolean;
    usCanada: boolean;
    pipeline: boolean;
  };
  pipeline?: {
    totalVectors: number | null;
    failures: number | null;
    lastFetch: number | null;
    active: boolean;
  };
  degradationStages: number[];
}

declare global {
  interface Window {
    __STARCOM_SPACE_WEATHER_TELEMETRY__?: {
      history: SpaceWeatherTelemetrySnapshot[];
      last?: SpaceWeatherTelemetrySnapshot;
      export: () => SpaceWeatherTelemetrySnapshot[];
    };
  }
}

interface SnapshotInput {
  provider: string;
  activeLayer: string;
  samplingStrategy: SamplingStrategy;
  rawInterMag: number;
  rawUSCanada: number;
  rawPipeline: number;
  combinedRaw: number;
  sampled: number;
  rendered: number;
  gatingReason: GatingReason;
  datasetFlags: {
    intermag: boolean;
    usCanada: boolean;
    pipeline: boolean;
  };
  pipeline?: {
    totalVectors: number | null;
    failures: number | null;
    lastFetch: number | null;
    active: boolean;
  };
  degradationStages: number[];
}

const MAX_HISTORY = 20;

class SpaceWeatherTelemetryTracker {
  private history: SpaceWeatherTelemetrySnapshot[] = [];

  record(input: SnapshotInput) {
    const snapshot: SpaceWeatherTelemetrySnapshot = {
      timestamp: Date.now(),
      provider: input.provider,
      activeLayer: input.activeLayer,
      samplingStrategy: input.samplingStrategy,
      raw: {
        intermag: input.rawInterMag,
        usCanada: input.rawUSCanada,
        pipeline: input.rawPipeline,
        combined: input.combinedRaw
      },
      sampled: input.sampled,
      rendered: input.rendered,
      gatingReason: input.gatingReason,
      datasetFlags: input.datasetFlags,
      pipeline: input.pipeline,
      degradationStages: input.degradationStages
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history.pop();
    }

    this.updateGlobal(snapshot);
    this.emitRegressionWarning(snapshot);
  }

  getHistory() {
    return [...this.history];
  }

  private updateGlobal(snapshot: SpaceWeatherTelemetrySnapshot) {
    if (typeof window === 'undefined') return;
    window.__STARCOM_SPACE_WEATHER_TELEMETRY__ = {
      history: this.getHistory(),
      last: snapshot,
      export: () => this.getHistory().map(entry => ({ ...entry, degradationStages: [...entry.degradationStages] }))
    };
  }

  private emitRegressionWarning(current: SpaceWeatherTelemetrySnapshot) {
    const previous = this.history[1];
    if (!previous) return;
    if (previous.raw.combined === 0) return;

    const rawDelta = Math.abs(current.raw.combined - previous.raw.combined) / previous.raw.combined;
    if (rawDelta > 0.1) return; // raw inputs changed significantly; skip warning

    if (previous.sampled === 0) return;
    const sampledDrop = (previous.sampled - current.sampled) / previous.sampled;
    if (sampledDrop > 0.4) {
      // eslint-disable-next-line no-console
      console.warn(
        'SpaceWeather telemetry regression detected',
        {
          previousSampled: previous.sampled,
          currentSampled: current.sampled,
          provider: current.provider,
          activeLayer: current.activeLayer
        }
      );
    }
  }
}

const tracker = new SpaceWeatherTelemetryTracker();

export const recordSpaceWeatherTelemetrySnapshot = (input: SnapshotInput) => {
  tracker.record(input);
};

export const getSpaceWeatherTelemetryHistory = () => tracker.getHistory();

export {}; // ensure this file is treated as a module
