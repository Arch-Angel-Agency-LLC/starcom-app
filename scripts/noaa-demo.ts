// NOAA Visualization Controls Demo Script
// Run this in the browser console to demonstrate the visualization controls

console.log('🛰️ NOAA Visualization Controls Demo');
console.log('=====================================');

// Import the visualization configuration
import { 
  NOAA_VISUALIZATIONS, 
  VISUALIZATION_PRESETS,
  NOAAVisualizationManager 
} from './src/components/HUD/Bars/RightSideBar/NOAAVisualizationConfig.ts';

// Demo 1: Show all available datasets
console.log('\n📊 Available NOAA Datasets:');
NOAA_VISUALIZATIONS.forEach(dataset => {
  console.log(`${dataset.icon} ${dataset.name} (${dataset.category})`);
  console.log(`   Visualizations: ${dataset.visualizations.length}`);
  dataset.visualizations.forEach(viz => {
    console.log(`   - ${viz.name}: ${viz.enabled ? '✅' : '❌'}`);
  });
});

// Demo 2: Apply space weather overview preset
console.log('\n🌍 Applying Space Weather Overview Preset...');
NOAAVisualizationManager.applyPreset('space-weather-overview');
console.log('Active visualizations:', NOAAVisualizationManager.getVisualizationCount());

// Demo 3: Show active visualizations by category
console.log('\n🔍 Active Visualizations by Category:');
['solar', 'geomagnetic', 'radiation', 'cosmic'].forEach(category => {
  const datasets = NOAAVisualizationManager.getVisualizationsByCategory(category);
  const activeCount = datasets.reduce((sum, dataset) => 
    sum + dataset.visualizations.filter(viz => viz.enabled).length, 0);
  console.log(`${category}: ${activeCount} active`);
});

// Demo 4: Toggle specific visualizations
console.log('\n⚡ Toggling Aurora Visualization...');
const auroraEnabled = NOAAVisualizationManager.toggleVisualization(
  'geomagnetic-kp-index', 
  'aurora-oval'
);
console.log(`Aurora visualization is now: ${auroraEnabled ? 'ON' : 'OFF'}`);

// Demo 5: Export current configuration
console.log('\n💾 Current Configuration:');
const config = NOAAVisualizationManager.exportConfiguration();
console.log('Configuration exported (JSON format ready for saving)');

// Demo 6: Show preset information
console.log('\n📋 Available Presets:');
Object.entries(VISUALIZATION_PRESETS).forEach(([id, preset]) => {
  console.log(`${preset.name}: ${preset.description}`);
  console.log(`   Visualizations: ${Object.values(preset.datasets).flat().length}`);
});

console.log('\n✨ Demo complete! Check the RightSideBar in the app for interactive controls.');

export {
  NOAA_VISUALIZATIONS,
  VISUALIZATION_PRESETS,
  NOAAVisualizationManager
};
