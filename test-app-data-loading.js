// Browser console test to verify satellite data loading in the actual application
// Run this in the browser console when the satellite mode is active

(async function testSatelliteDataInApp() {
  console.log('🔍 Testing Satellite Data Loading in Starcom App...\n');
  
  try {
    // Import the satellite service
    const { satelliteVisualizationService } = await import('./src/services/Satellites/SatelliteVisualizationService.js');
    
    console.log('📊 Getting service statistics...');
    const stats = satelliteVisualizationService.getStats();
    console.log('Service Stats:', stats);
    
    console.log('\n🛰️ Getting satellite data...');
    const satellites = await satelliteVisualizationService.getSatelliteData();
    
    console.log(`✅ Loaded ${satellites.length} satellites for visualization`);
    
    // Analyze the data
    const typeBreakdown = {};
    const countries = new Set();
    let minAltitude = Infinity;
    let maxAltitude = -Infinity;
    
    satellites.forEach(sat => {
      typeBreakdown[sat.type] = (typeBreakdown[sat.type] || 0) + 1;
      if (sat.country) countries.add(sat.country);
      minAltitude = Math.min(minAltitude, sat.altitude);
      maxAltitude = Math.max(maxAltitude, sat.altitude);
    });
    
    console.log('\n📈 Data Analysis:');
    console.log('Type Breakdown:', typeBreakdown);
    console.log('Countries Represented:', Array.from(countries).sort());
    console.log(`Altitude Range: ${minAltitude.toFixed(0)} - ${maxAltitude.toFixed(0)} km`);
    
    // Show some sample satellites
    console.log('\n🔍 Sample Satellites:');
    satellites.slice(0, 5).forEach(sat => {
      console.log(`   ${sat.name} (${sat.type}) - ${sat.altitude}km - ${sat.country}`);
    });
    
    // Check for high-priority satellites
    const highPrioritySats = satellites.filter(sat => 
      sat.name.includes('ISS') || 
      sat.name.includes('HUBBLE') || 
      sat.name.includes('TIANGONG')
    );
    
    console.log('\n⭐ High-Priority Satellites Found:');
    highPrioritySats.forEach(sat => {
      console.log(`   ✅ ${sat.name} - ${sat.type} - ${sat.altitude}km`);
    });
    
    // Verify data freshness
    if (stats.lastUpdate) {
      const ageMinutes = (Date.now() - new Date(stats.lastUpdate).getTime()) / (1000 * 60);
      console.log(`\n⏰ Data Age: ${ageMinutes.toFixed(1)} minutes`);
      if (ageMinutes < 60) {
        console.log('   ✅ Data is fresh (less than 1 hour old)');
      } else {
        console.log('   ⚠️  Data is older than 1 hour');
      }
    }
    
    // Test if this is fallback data
    if (satellites.length === 3 && 
        satellites.some(s => s.id === 'iss') && 
        satellites.some(s => s.id === 'css') && 
        satellites.some(s => s.id === 'hubble')) {
      console.log('\n❌ WARNING: Using fallback data (only 3 hardcoded satellites)');
      return { usingRealData: false, dataSource: 'fallback' };
    } else {
      console.log('\n✅ CONFIRMED: Using real CelesTrak data');
      return { 
        usingRealData: true, 
        dataSource: 'CelesTrak',
        satelliteCount: satellites.length,
        cacheSize: stats.totalInCache
      };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { usingRealData: false, error: error.message };
  }
})();
