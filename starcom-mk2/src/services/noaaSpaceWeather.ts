// TDD Step 3: Minimal implementation to make tests pass
// AI-NOTE: Building up functionality test by test

import type { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import type { SpaceWeatherAlert, NOAAElectricFieldData } from '../types/spaceWeather';

// AI-NOTE: Import fetch conditionally for different environments
const getFetch = async () => {
  if (typeof globalThis !== 'undefined' && globalThis.fetch) {
    return globalThis.fetch;
  }
  // In test environment, import from undici
  const { fetch } = await import('undici');
  return fetch;
};

// Additional interfaces for integration functions
interface RegionalElectricFieldAnalysis {
  summary: string;
  hotspots: Array<{
    latitude: number;
    longitude: number;
    fieldStrength: number;
    region: string;
  }>;
  averageFieldStrength: number;
}

interface RegionalDataset {
  global: NOAAElectricFieldData;
  northAmerica: NOAAElectricFieldData;
}

/**
 * Extract the latest electric field filename from NOAA directory HTML
 * Based on actual NOAA API patterns discovered through TDD
 */
export function extractLatestFilename(html: string, dataset: 'InterMag' | 'US-Canada'): string | null {
  // Based on real data patterns discovered in tests
  let pattern: RegExp;
  
  if (dataset === 'InterMag') {
    pattern = /href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g;
  } else {
    pattern = /href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g;
  }
  
  const matches = Array.from(html.matchAll(pattern));
  
  if (matches.length === 0) {
    return null;
  }
  
  // Files appear to be in chronological order, get the latest (last one)
  const filenames = matches.map(match => match[1]);
  return filenames[filenames.length - 1];
}

/**
 * Fetch the latest electric field data for a dataset
 * TDD Step 5: GREEN phase - implementation to make tests pass
 */
export async function fetchLatestElectricFieldData(dataset: 'InterMag' | 'US-Canada'): Promise<NOAAElectricFieldData> {
  // Get the appropriate fetch function for the environment
  const fetchFn = await getFetch();
  
  // Determine the correct directory URL based on dataset
  const baseUrl = dataset === 'InterMag' 
    ? 'https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/'
    : 'https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/';
  
  // Get the directory listing
  const dirResponse = await fetchFn(baseUrl);
  if (!dirResponse.ok) {
    throw new Error(`Failed to fetch directory listing: ${dirResponse.status}`);
  }
  
  const html = await dirResponse.text();
  
  // Extract the latest filename
  const latestFilename = extractLatestFilename(html, dataset);
  if (!latestFilename) {
    throw new Error(`No electric field files found for dataset: ${dataset}`);
  }
  
  // Fetch the actual data file
  const dataUrl = `${baseUrl}${latestFilename}`;
  const dataResponse = await fetchFn(dataUrl);
  if (!dataResponse.ok) {
    throw new Error(`Failed to fetch electric field data: ${dataResponse.status}`);
  }
  
  const data = await dataResponse.json() as NOAAElectricFieldData;
  return data;
}

/**
 * Transform NOAA electric field data into Starcom intelligence overlay markers
 * TDD Step 8: Stub function - will be implemented to make failing test pass
 */
export function transformNOAAToIntelMarkers(
  data: NOAAElectricFieldData, 
  category: string
): IntelReportOverlayMarker[] {
  // Use a deterministic pubkey/author for now (could be replaced with real user/session info)
  const pubkey = 'NOAA_FAKE_PUBKEY';
  const author = 'NOAA_FAKE_AUTHOR';
  const timestamp = data.time_tag ? Date.parse(data.time_tag) / 1000 : Math.floor(Date.now() / 1000);
  
  return data.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const { Ex, Ey } = feature.properties;
    return {
      pubkey,
      title: `Electric Field @ (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      content: `NOAA Electric Field\nEx: ${Ex} V/m\nEy: ${Ey} V/m` + (category ? `\nCategory: ${category}` : ''),
      tags: ['SIGINT', 'space-weather', category],
      latitude: lat,
      longitude: lon,
      timestamp,
      author
    };
  });
}

/**
 * Generate space weather alerts from NOAA electric field data
 * TDD Step 8: GREEN phase - implementation to make tests pass
 */
export function generateSpaceWeatherAlerts(
  data: NOAAElectricFieldData
): SpaceWeatherAlert[] {
  const alerts: SpaceWeatherAlert[] = [];
  const timestamp = new Date().toISOString();
  
  // Calculate electric field magnitudes and identify anomalies
  const highFieldFeatures = data.features.filter(feature => {
    const { Ex, Ey } = feature.properties;
    const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);
    return magnitude > 1000; // Threshold for high electric field (mV/km)
  });
  
  if (highFieldFeatures.length > 0) {
    // Determine severity based on number of high field points and max magnitude
    const maxMagnitude = Math.max(...highFieldFeatures.map(f => {
      const { Ex, Ey } = f.properties;
      return Math.sqrt(Ex * Ex + Ey * Ey);
    }));
    
    let severity: "low" | "moderate" | "high" | "extreme";
    let alertType: "geomagnetic_storm" | "electric_field_anomaly" | "infrastructure_risk";
    
    if (maxMagnitude > 5000) {
      severity = "extreme";
      alertType = "geomagnetic_storm";
    } else if (maxMagnitude > 3000) {
      severity = "high";
      alertType = "infrastructure_risk";
    } else if (maxMagnitude > 2000) {
      severity = "moderate";
      alertType = "electric_field_anomaly";
    } else {
      severity = "low";
      alertType = "electric_field_anomaly";
    }
    
    // Determine affected regions
    const regions = data.product_version === "US-Canada-1D" 
      ? ["North America", "US", "Canada"] 
      : ["Global", "InterMag Network"];
    
    alerts.push({
      id: `noaa-efield-${Date.now()}`,
      timestamp,
      alertType,
      severity,
      regions,
      message: `Electric field anomaly detected: ${highFieldFeatures.length} locations with elevated field strength (max: ${maxMagnitude.toFixed(1)} mV/km)`
    });
  }
  
  return alerts;
}

/**
 * Analyze regional electric field patterns
 * TDD Step 8: GREEN phase - implementation for regional analysis
 */
export function analyzeRegionalElectricFields(
  datasets: RegionalDataset
): RegionalElectricFieldAnalysis {
  const { global, northAmerica } = datasets;
  
  // Calculate average field strength for each dataset
  const calculateAverageFieldStrength = (data: NOAAElectricFieldData): number => {
    const total = data.features.reduce((sum, feature) => {
      const { Ex, Ey } = feature.properties;
      return sum + Math.sqrt(Ex * Ex + Ey * Ey);
    }, 0);
    return total / data.features.length;
  };
  
  const globalAvg = calculateAverageFieldStrength(global);
  const northAmericaAvg = calculateAverageFieldStrength(northAmerica);
  const overallAvg = (globalAvg + northAmericaAvg) / 2;
  
  // Identify hotspots (areas with field strength > 150% of average)
  const hotspotThreshold = overallAvg * 1.5;
  const hotspots: Array<{
    latitude: number;
    longitude: number;
    fieldStrength: number;
    region: string;
  }> = [];
  
  // Add hotspots from global data
  global.features.forEach(feature => {
    const { Ex, Ey } = feature.properties;
    const fieldStrength = Math.sqrt(Ex * Ex + Ey * Ey);
    if (fieldStrength > hotspotThreshold) {
      const [lon, lat] = feature.geometry.coordinates;
      hotspots.push({
        latitude: lat,
        longitude: lon,
        fieldStrength,
        region: "Global-InterMag"
      });
    }
  });
  
  // Add hotspots from North America data
  northAmerica.features.forEach(feature => {
    const { Ex, Ey } = feature.properties;
    const fieldStrength = Math.sqrt(Ex * Ex + Ey * Ey);
    if (fieldStrength > hotspotThreshold) {
      const [lon, lat] = feature.geometry.coordinates;
      hotspots.push({
        latitude: lat,
        longitude: lon,
        fieldStrength,
        region: "North-America"
      });
    }
  });
  
  // Sort hotspots by field strength (highest first)
  hotspots.sort((a, b) => b.fieldStrength - a.fieldStrength);
  
  // Generate summary
  const summary = `Regional electric field analysis: ${hotspots.length} hotspots identified. ` +
    `Global average: ${globalAvg.toFixed(1)} mV/km, North America average: ${northAmericaAvg.toFixed(1)} mV/km. ` +
    `Strongest hotspot: ${hotspots.length > 0 ? hotspots[0].fieldStrength.toFixed(1) : 'N/A'} mV/km.`;
  
  return {
    summary,
    hotspots,
    averageFieldStrength: overallAvg
  };
}
