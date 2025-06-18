import { describe, it, expect } from 'vitest';
import { fetch } from 'undici';
import { 
  extractLatestFilename, 
  fetchLatestElectricFieldData,
  transformNOAAToIntelMarkers,
  generateSpaceWeatherAlerts,
  analyzeRegionalElectricFields
} from './noaaSpaceWeather';
import { NOAAElectricFieldData } from '../types/spaceWeather';

// TDD Step 1: Write a failing test that explores the real NOAA API
// AI-NOTE: Starting with integration test to understand actual NOAA API behavior

describe('NOAA Electric Field Data - Real API Discovery', () => {
  it('should discover what the NOAA InterMag directory actually contains', async () => {
    // This test will fail initially - we're using it to explore the real API
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    expect(response.ok).toBe(true);
    
    const html = await response.text();
    console.log('NOAA Directory Response (first 500 chars):', html.substring(0, 500));
    
    // Let's see what files are actually there
    const fileLinks = html.match(/href="[^"]*\.json"/g) || [];
    console.log('JSON files found:', fileLinks.slice(0, 5)); // First 5 files
    
    expect(fileLinks.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for real API call

  it('should discover what the NOAA US-Canada directory actually contains', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    expect(response.ok).toBe(true);
    
    const html = await response.text();
    console.log('US-Canada Directory Response (first 500 chars):', html.substring(0, 500));
    
    const fileLinks = html.match(/href="[^"]*\.json"/g) || [];
    console.log('US-Canada JSON files found:', fileLinks.slice(0, 5));
    
    expect(fileLinks.length).toBeGreaterThan(0);
  }, 30000);

  // TDD Step 2: Now let's fetch actual electric field data (RED - this will fail without implementation)
  it('should fetch and parse actual InterMag electric field data', async () => {
    // Get the latest file from directory
    const dirResponse = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    const html = await dirResponse.text();
    
    // Extract the latest filename based on real pattern we discovered
    const fileLinks = html.match(/href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
    
    // Get the latest file (they appear to be in chronological order)
    const latestFileMatch = fileLinks[fileLinks.length - 1].match(/href="([^"]+)"/);
    expect(latestFileMatch).toBeTruthy();
    
    const latestFilename = latestFileMatch![1];
    console.log('Latest InterMag file:', latestFilename);
    
    // Fetch the actual electric field data
    const dataResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/${latestFilename}`);
    expect(dataResponse.ok).toBe(true);
    
    const electricFieldData = await dataResponse.json() as NOAAElectricFieldData;
    console.log('Electric field data structure:', {
      type: electricFieldData.type,
      time_tag: electricFieldData.time_tag,
      cadence: electricFieldData.cadence,
      product_version: electricFieldData.product_version,
      featuresCount: electricFieldData.features?.length
    });
    
    // Validate the data structure we discovered
    expect(electricFieldData.type).toBe('FeatureCollection');
    expect(electricFieldData.features).toBeInstanceOf(Array);
    expect(electricFieldData.features.length).toBeGreaterThan(0);
    
    // Check the first feature structure
    const firstFeature = electricFieldData.features[0];
    console.log('First feature sample:', {
      type: firstFeature.type,
      coordinates: firstFeature.geometry?.coordinates,
      properties: Object.keys(firstFeature.properties || {})
    });
    
    expect(firstFeature.type).toBe('Feature');
    expect(firstFeature.geometry.type).toBe('Point');
    expect(firstFeature.geometry.coordinates).toBeInstanceOf(Array);
    expect(firstFeature.properties).toHaveProperty('Ex');
    expect(firstFeature.properties).toHaveProperty('Ey');
  }, 30000);

  it('should fetch and parse actual US-Canada electric field data', async () => {
    // Get the latest file from US-Canada directory
    const dirResponse = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    const html = await dirResponse.text();
    
    // Extract US-Canada filename pattern
    const fileLinks = html.match(/href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
    
    const latestFileMatch = fileLinks[fileLinks.length - 1].match(/href="([^"]+)"/);
    const latestFilename = latestFileMatch![1];
    console.log('Latest US-Canada file:', latestFilename);
    
    // Fetch the actual data
    const dataResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/${latestFilename}`);
    expect(dataResponse.ok).toBe(true);
    
    const electricFieldData = await dataResponse.json() as NOAAElectricFieldData;
    console.log('US-Canada data structure:', {
      type: electricFieldData.type,
      time_tag: electricFieldData.time_tag,
      product_version: electricFieldData.product_version,
      featuresCount: electricFieldData.features?.length
    });
    
    // Same validation as InterMag
    expect(electricFieldData.type).toBe('FeatureCollection');
    expect(electricFieldData.features).toBeInstanceOf(Array);
    expect(electricFieldData.features.length).toBeGreaterThan(0);
    
    const firstFeature = electricFieldData.features[0];
    expect(firstFeature.type).toBe('Feature');
    expect(firstFeature.properties).toHaveProperty('Ex');
    expect(firstFeature.properties).toHaveProperty('Ey');
  }, 30000);
});

// TDD Step 4: Test individual functions (RED phase - this will fail)
describe('NOAA Filename Extraction', () => {
  it('should extract latest InterMag filename from real directory HTML', async () => {
    // Get real HTML from NOAA
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    const html = await response.text();
    
    // This should extract the latest filename
    const filename = extractLatestFilename(html, 'InterMag');
    
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json/);
    
    // Verify it's actually the latest by checking it exists
    const testResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/${filename}`);
    expect(testResponse.ok).toBe(true);
  }, 30000);

  it('should extract latest US-Canada filename from real directory HTML', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    const html = await response.text();
    
    const filename = extractLatestFilename(html, 'US-Canada');
    
    expect(filename).toBeTruthy();
    expect(filename).toMatch(/\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json/);
    
    // Verify it exists
    const testResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/${filename}`);
    expect(testResponse.ok).toBe(true);
  }, 30000);
});

// TDD Step 5: Test the main function (RED phase)
describe('NOAA Electric Field Data Fetcher', () => {
  it('should fetch latest InterMag electric field data', async () => {
    // This will fail because the function doesn't exist yet
    const data = await fetchLatestElectricFieldData('InterMag');
    
    expect(data).toBeTruthy();
    expect(data.type).toBe('FeatureCollection');
    expect(data.product_version).toBe('InterMagEarthScope');
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
    
    // Check first feature structure
    const firstFeature = data.features[0];
    expect(firstFeature.type).toBe('Feature');
    expect(firstFeature.properties).toHaveProperty('Ex');
    expect(firstFeature.properties).toHaveProperty('Ey');
  }, 30000);

  it('should fetch latest US-Canada electric field data', async () => {
    const data = await fetchLatestElectricFieldData('US-Canada');
    
    expect(data).toBeTruthy();
    expect(data.type).toBe('FeatureCollection');
    expect(data.product_version).toBe('US-Canada-1D');
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
  }, 30000);
});

// TDD Step 6: Add error handling tests (RED phase)
describe('NOAA Electric Field Data Error Handling', () => {
  it('should throw error for invalid dataset type', async () => {
    // @ts-expect-error Testing invalid input
    await expect(fetchLatestElectricFieldData('InvalidDataset')).rejects.toThrow();
  });

  it('should handle network errors gracefully', async () => {
    // We can't easily mock network failures in integration tests,
    // but we can test with a malformed URL scenario
    // This will be handled by our function's error checking
    
    // For now, let's test that our function handles unexpected responses
    // by testing the extractLatestFilename with malformed HTML
    const malformedHtml = '<html><body>No JSON files here</body></html>';
    
    const interMagResult = extractLatestFilename(malformedHtml, 'InterMag');
    const usCandadaResult = extractLatestFilename(malformedHtml, 'US-Canada');
    
    expect(interMagResult).toBeNull();
    expect(usCandadaResult).toBeNull();
  });

  it('should handle empty directory listings', async () => {
    const emptyDirHtml = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
 <head>
  <title>Index of /json/lists/rgeojson/InterMagEarthScope</title>
 </head>
 <body>
<h1>Index of /json/lists/rgeojson/InterMagEarthScope</h1>
<pre><a href="?C=N;O=D">Name</a>
<hr><a href="/json/lists/rgeojson/">Parent Directory</a>
</pre>
 </body>
</html>`;
    
    const result = extractLatestFilename(emptyDirHtml, 'InterMag');
    expect(result).toBeNull();
  });
});

// TDD Step 7: Add data quality validation tests (RED phase)
describe('NOAA Electric Field Data Quality', () => {
  it('should validate InterMag data has reasonable electric field values', async () => {
    const data = await fetchLatestElectricFieldData('InterMag');
    
    // Check that electric field values are within reasonable ranges
    // Based on geophysical understanding: typical values are -1000 to +1000 mV/km
    const sampleFeatures = data.features.slice(0, 10); // Check first 10 features
    
    for (const feature of sampleFeatures) {
      const { Ex, Ey } = feature.properties;
      
      expect(typeof Ex).toBe('number');
      expect(typeof Ey).toBe('number');
      expect(Ex).toBeGreaterThan(-10000); // Reasonable bounds
      expect(Ex).toBeLessThan(10000);
      expect(Ey).toBeGreaterThan(-10000);
      expect(Ey).toBeLessThan(10000);
      
      // Should have valid coordinates
      expect(feature.geometry.coordinates).toHaveLength(2);
      const [lon, lat] = feature.geometry.coordinates;
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    }
  }, 30000);

  it('should validate US-Canada data has reasonable electric field values', async () => {
    const data = await fetchLatestElectricFieldData('US-Canada');
    
    const sampleFeatures = data.features.slice(0, 10);
    
    for (const feature of sampleFeatures) {
      const { Ex, Ey } = feature.properties;
      
      expect(typeof Ex).toBe('number');
      expect(typeof Ey).toBe('number');
      expect(Ex).toBeGreaterThan(-10000);
      expect(Ex).toBeLessThan(10000);
      expect(Ey).toBeGreaterThan(-10000);
      expect(Ey).toBeLessThan(10000);
      
      // Coordinates should be within North America bounds roughly
      const [lon, lat] = feature.geometry.coordinates;
      expect(lon).toBeGreaterThan(-170); // Alaska
      expect(lon).toBeLessThan(-50);     // Eastern Canada
      expect(lat).toBeGreaterThan(40);   // Southern US
      expect(lat).toBeLessThan(85);      // Northern Canada
    }
  }, 30000);

  it('should have recent time_tag data', async () => {
    const interMagData = await fetchLatestElectricFieldData('InterMag');
    const usCandadaData = await fetchLatestElectricFieldData('US-Canada');
    
    // Data should be from within the last few days (NOAA updates regularly)
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    if (interMagData.time_tag) {
      const interMagDate = new Date(interMagData.time_tag);
      expect(interMagDate.getTime()).toBeGreaterThan(threeDaysAgo.getTime());
    }
    
    if (usCandadaData.time_tag) {
      const usCandadaDate = new Date(usCandadaData.time_tag);
      expect(usCandadaDate.getTime()).toBeGreaterThan(threeDaysAgo.getTime());
    }
  }, 30000);
});

// TDD Step 8: Integration with Starcom Intelligence System (RED phase)
describe('NOAA to Starcom Intelligence Integration', () => {
  it('should transform NOAA electric field data into intelligence overlay markers', async () => {
    // Fetch real NOAA data
    const noaaData = await fetchLatestElectricFieldData('InterMag');
    
    // This will fail - we need to implement the transformation function
    const intelMarkers = transformNOAAToIntelMarkers(noaaData, 'space-weather');
    
    // Validate the transformed data matches Starcom's intelligence interface
    expect(intelMarkers).toBeInstanceOf(Array);
    expect(intelMarkers.length).toBeGreaterThan(0);
    
    // Check first marker matches IntelReportOverlayMarker interface
    const firstMarker = intelMarkers[0];
    expect(firstMarker).toHaveProperty('pubkey');
    expect(firstMarker).toHaveProperty('title');
    expect(firstMarker).toHaveProperty('content');
    expect(firstMarker).toHaveProperty('tags');
    expect(firstMarker).toHaveProperty('latitude');
    expect(firstMarker).toHaveProperty('longitude');
    expect(firstMarker).toHaveProperty('timestamp');
    expect(firstMarker).toHaveProperty('author');
    
    // Validate specific space weather intel properties
    expect(firstMarker.tags).toContain('SIGINT');
    expect(firstMarker.tags).toContain('space-weather');
    expect(firstMarker.title).toContain('Electric Field');
    expect(typeof firstMarker.latitude).toBe('number');
    expect(typeof firstMarker.longitude).toBe('number');
    expect(firstMarker.latitude).toBeGreaterThan(-90);
    expect(firstMarker.latitude).toBeLessThan(90);
    expect(firstMarker.longitude).toBeGreaterThan(-180);
    expect(firstMarker.longitude).toBeLessThan(180);
  }, 30000);

  it('should create space weather alerts from high electric field values', async () => {
    const noaaData = await fetchLatestElectricFieldData('US-Canada');
    
    // This will fail - we need to implement alert generation
    const alerts = generateSpaceWeatherAlerts(noaaData);
    
    expect(alerts).toBeInstanceOf(Array);
    
    // If there are any alerts, validate their structure
    if (alerts.length > 0) {
      const firstAlert = alerts[0];
      expect(firstAlert).toHaveProperty('id');
      expect(firstAlert).toHaveProperty('alertType');
      expect(firstAlert).toHaveProperty('severity');
      expect(firstAlert).toHaveProperty('message');
      expect(['low', 'moderate', 'high', 'extreme']).toContain(firstAlert.severity);
      expect(['geomagnetic_storm', 'electric_field_anomaly', 'infrastructure_risk']).toContain(firstAlert.alertType);
    }
  }, 30000);

  it('should provide regional electric field analysis for intelligence', async () => {
    const interMagData = await fetchLatestElectricFieldData('InterMag');
    const usCandadaData = await fetchLatestElectricFieldData('US-Canada');
    
    // This will fail - we need to implement regional analysis
    const regionalAnalysis = analyzeRegionalElectricFields({
      global: interMagData,
      northAmerica: usCandadaData
    });
    
    expect(regionalAnalysis).toHaveProperty('summary');
    expect(regionalAnalysis).toHaveProperty('hotspots');
    expect(regionalAnalysis).toHaveProperty('averageFieldStrength');
    expect(regionalAnalysis.hotspots).toBeInstanceOf(Array);
    
    // Hotspots should be geographic regions with high electric field activity
    if (regionalAnalysis.hotspots.length > 0) {
      const firstHotspot = regionalAnalysis.hotspots[0];
      expect(firstHotspot).toHaveProperty('latitude');
      expect(firstHotspot).toHaveProperty('longitude');
      expect(firstHotspot).toHaveProperty('fieldStrength');
      expect(firstHotspot).toHaveProperty('region');
    }
  }, 30000);
});
