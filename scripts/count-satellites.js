#!/usr/bin/env node

// Script to count actual satellites from CelesTrak API endpoints
const endpoints = {
  'active': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
  'starlink': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
  'stations': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
  'gps-ops': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json',
  'debris': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json',
  'intelsat': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=json',
  'planet': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=planet&FORMAT=json',
  'spire': 'https://celestrak.com/NORAD/elements/gp.php?GROUP=spire&FORMAT=json'
};

async function countSatellites() {
  console.log('🛰️  Counting REAL Satellite Data from CelesTrak APIs...\n');
  
  let totalCount = 0;
  const results = {};

  for (const [category, url] of Object.entries(endpoints)) {
    try {
      console.log(`Fetching ${category}...`);
      const response = await fetch(url);
      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;
      
      results[category] = count;
      totalCount += count;
      
      console.log(`  ✅ ${category}: ${count.toLocaleString()} objects`);
    } catch (error) {
      console.log(`  ❌ ${category}: Error - ${error.message}`);
      results[category] = 0;
    }
  }

  console.log('\n📊 REAL SATELLITE COUNT SUMMARY:');
  console.log('═'.repeat(50));
  
  Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
      console.log(`${category.padEnd(15)} ${count.toString().padStart(8)} (${percentage}%)`);
    });
  
  console.log('═'.repeat(50));
  console.log(`TOTAL OBJECTS: ${totalCount.toLocaleString()}`);
  
  console.log('\n🎯 REALITY CHECK:');
  console.log(`• We are NOT "ramping up to 8,000" satellites`);
  console.log(`• The data sources provide ${totalCount.toLocaleString()} objects by default`);
  console.log(`• This is the ACTUAL scale we need to handle`);
  
  if (totalCount > 10000) {
    console.log(`• ${totalCount.toLocaleString()} objects is ${Math.floor(totalCount / 1000)}x larger than our assumed 8K limit`);
  }
  
  console.log('\n💡 IMPLICATIONS:');
  console.log('• Performance optimization is MANDATORY, not optional');
  console.log('• LOD (Level of Detail) systems are essential');
  console.log('• GPU instancing and culling are required');
  console.log('• Real-time filtering/grouping is necessary');
}

// Run the count
countSatellites().catch(console.error);
