#!/usr/bin/env node

// Simple test runner for NOAA space weather functions
// AI-NOTE: This bypasses the complex test suite to verify basic functionality

import { fetchLatestElectricFieldData, transformNOAAToIntelMarkers, generateSpaceWeatherAlerts, analyzeRegionalElectricFields } from './noaaSpaceWeather.js';

async function testNOAAFunctions() {
  console.log('🌍 Testing NOAA Space Weather Functions...\n');
  
  try {
    // Test 1: Fetch InterMag data
    console.log('1. Fetching InterMag electric field data...');
    const interMagData = await fetchLatestElectricFieldData('InterMag');
    console.log(`✅ InterMag data: ${interMagData.features.length} features, product: ${interMagData.product_version}`);
    
    // Test 2: Fetch US-Canada data
    console.log('2. Fetching US-Canada electric field data...');
    const usCandadaData = await fetchLatestElectricFieldData('US-Canada');
    console.log(`✅ US-Canada data: ${usCandadaData.features.length} features, product: ${usCandadaData.product_version}`);
    
    // Test 3: Transform to intelligence markers
    console.log('3. Transforming to intelligence markers...');
    const intelMarkers = transformNOAAToIntelMarkers(interMagData, 'space-weather');
    console.log(`✅ Generated ${intelMarkers.length} intelligence markers`);
    console.log(`   First marker: ${intelMarkers[0].title} at (${intelMarkers[0].latitude}, ${intelMarkers[0].longitude})`);
    
    // Test 4: Generate alerts
    console.log('4. Generating space weather alerts...');
    const alerts = generateSpaceWeatherAlerts(interMagData);
    console.log(`✅ Generated ${alerts.length} alerts`);
    if (alerts.length > 0) {
      console.log(`   First alert: ${alerts[0].severity} ${alerts[0].alertType} - ${alerts[0].message}`);
    }
    
    // Test 5: Regional analysis
    console.log('5. Performing regional analysis...');
    const regionalAnalysis = analyzeRegionalElectricFields({
      global: interMagData,
      northAmerica: usCandadaData
    });
    console.log(`✅ Regional analysis: ${regionalAnalysis.hotspots.length} hotspots, avg field: ${regionalAnalysis.averageFieldStrength.toFixed(1)} mV/km`);
    console.log(`   Summary: ${regionalAnalysis.summary}`);
    
    console.log('\n🎉 All tests passed! NOAA space weather integration is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNOAAFunctions();
