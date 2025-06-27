// Shared visualization config for Globe and TinyGlobe
export interface VisualizationConfig {
  globeImageUrl: string;
  eventData: object[];
}

const visualizationConfig: Record<string, Record<string, VisualizationConfig>> = {
  CyberCommand: {
    IntelReports: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [],
    },
    Timelines: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [],
    },
    CrisisZones: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [],
    },
  },
  GeoPolitical: {
    NationalTerritories: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [],
    },
    DiplomaticEvents: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [],
    },
    ResourceZones: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [],
    },
  },
  EcoNatural: {
    SpaceWeather: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [],
    },
    EcologicalDisasters: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [],
    },
    EarthWeather: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [],
    },
  },
};

export default visualizationConfig;
