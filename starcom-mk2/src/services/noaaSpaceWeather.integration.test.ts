import { describe, it, expect } from 'vitest';
// AI-NOTE: Using global fetch instead of undici for browser compatibility
import type { NOAAElectricFieldData } from '../types';

// Integration tests for real NOAA API endpoints

describe('NOAA Electric Field Data - Real API Integration', () => {
  it('should discover what the NOAA InterMag directory actually contains', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    expect(response.ok).toBe(true);
    const html = await response.text();
    const fileLinks = html.match(/href="[^"]*\.json"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
  }, 30000);

  it('should discover what the NOAA US-Canada directory actually contains', async () => {
    const response = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    expect(response.ok).toBe(true);
    const html = await response.text();
    const fileLinks = html.match(/href="[^"]*\.json"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
  }, 30000);

  it('should fetch and parse actual InterMag electric field data', async () => {
    const dirResponse = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/');
    const html = await dirResponse.text();
    const fileLinks = html.match(/href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
    const latestFileMatch = fileLinks[fileLinks.length - 1].match(/href="([^"]+)"/);
    expect(latestFileMatch).toBeTruthy();
    const latestFilename = latestFileMatch![1];
    const dataResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/${latestFilename}`);
    expect(dataResponse.ok).toBe(true);
    const electricFieldData = await dataResponse.json() as NOAAElectricFieldData;
    expect(electricFieldData.type).toBe('FeatureCollection');
    expect(electricFieldData.features).toBeInstanceOf(Array);
    expect(electricFieldData.features.length).toBeGreaterThan(0);
  }, 30000);

  it('should fetch and parse actual US-Canada electric field data', async () => {
    const dirResponse = await fetch('https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/');
    const html = await dirResponse.text();
    const fileLinks = html.match(/href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g) || [];
    expect(fileLinks.length).toBeGreaterThan(0);
    const latestFileMatch = fileLinks[fileLinks.length - 1].match(/href="([^"]+)"/);
    const latestFilename = latestFileMatch![1];
    const dataResponse = await fetch(`https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/${latestFilename}`);
    expect(dataResponse.ok).toBe(true);
    const electricFieldData = await dataResponse.json() as NOAAElectricFieldData;
    expect(electricFieldData.type).toBe('FeatureCollection');
    expect(electricFieldData.features).toBeInstanceOf(Array);
    expect(electricFieldData.features.length).toBeGreaterThan(0);
  }, 30000);
});
