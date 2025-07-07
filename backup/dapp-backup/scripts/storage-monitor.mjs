#!/usr/bin/env node
// Storage monitoring script for Starcom project
// AI-NOTE: Quick check for data accumulation that could cause system bloat

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const NOAA_DATA_DIR = join(ROOT, 'technical_reference_code_samples/NOAA_directory_scan/noaa_data');
const CACHE_DIR = join(ROOT, 'cache');
const DIST_DIR = join(ROOT, 'dist');
const TARGET_DIR = join(ROOT, 'target');
const NODE_MODULES_DIR = join(ROOT, 'node_modules');

function getDirectoryStats(dirPath, warningThresholdMB = 50) {
  if (!existsSync(dirPath)) {
    return {
      path: dirPath,
      exists: false,
      size: '0B',
      fileCount: 0,
      warning: false,
      recommendation: null
    };
  }

  try {
    const sizeOutput = execSync(`du -sh "${dirPath}"`, { encoding: 'utf8' }).trim();
    const size = sizeOutput.split('\t')[0];
    
    const files = readdirSync(dirPath);
    const fileCount = files.filter(f => !f.startsWith('.')).length;
    
    // Extract numeric value for warning check
    const sizeNum = parseFloat(size);
    let isWarning = false;
    let recommendation = null;
    
    if (size.includes('G')) {
      // Gigabytes - always a warning
      isWarning = true;
      if (dirPath.includes('target')) {
        recommendation = 'Run "npm run cleanup:rust" to clean Rust build cache';
      }
    } else if (size.includes('M') && sizeNum > warningThresholdMB) {
      isWarning = true;
      if (dirPath.includes('noaa_data')) {
        recommendation = 'Run "npm run cleanup" to clean NOAA data files';
      } else if (dirPath.includes('cache')) {
        recommendation = 'Consider clearing build cache';
      }
    }
    
    return {
      path: dirPath,
      exists: true,
      size,
      fileCount,
      warning: isWarning,
      recommendation
    };
  } catch (error) {
    return {
      path: dirPath,
      exists: true,
      size: 'Error',
      fileCount: 0,
      warning: false,
      recommendation: null
    };
  }
}

function formatReport(stats) {
  console.log('\n🔍 Starcom Storage Usage Report');
  console.log('=' .repeat(50));
  
  let totalWarnings = 0;
  
  stats.forEach(stat => {
    const status = stat.warning ? '⚠️  WARNING' : stat.exists ? '✅ OK' : '❌ Missing';
    const fileInfo = stat.exists ? ` (${stat.fileCount} files)` : '';
    
    console.log(`${status} ${stat.path}`);
    console.log(`   Size: ${stat.size}${fileInfo}`);
    
    if (stat.warning) {
      totalWarnings++;
      console.log(`   🚨 Size exceeds recommended limit!`);
      if (stat.recommendation) {
        console.log(`   💡 Recommendation: ${stat.recommendation}`);
      }
    }
    
    console.log('');
  });
  
  if (totalWarnings > 0) {
    console.log(`⚠️  ${totalWarnings} directories exceed size limits!`);
    console.log('Consider running the recommended cleanup commands above.');
    console.log('You can also run "npm run cleanup:all" for comprehensive cleanup.');
  } else {
    console.log('✅ All directories within acceptable size limits');
  }
  
  // Check for specific file patterns
  if (existsSync(NOAA_DATA_DIR)) {
    const noaaFiles = readdirSync(NOAA_DATA_DIR).filter(f => f.endsWith('.json'));
    if (noaaFiles.length > 20) {
      console.log(`\n🚨 NOAA Data Alert: ${noaaFiles.length} JSON files detected`);
      console.log('   Consider running: npm run cleanup');
    }
  }
}

function main() {
  console.log('Checking Starcom project storage usage...');
  
  const directories = [
    getDirectoryStats(NOAA_DATA_DIR, 20),    // 20MB warning for NOAA data
    getDirectoryStats(CACHE_DIR, 100),       // 100MB warning for cache
    getDirectoryStats(DIST_DIR, 50),         // 50MB warning for dist
    getDirectoryStats(TARGET_DIR, 100),      // 100MB warning for Rust target (GB = auto-warning)
  ];
  
  formatReport(directories);
  
  // Additional node_modules check with enhanced reporting
  try {
    const nodeModulesStats = getDirectoryStats(NODE_MODULES_DIR, 500); // 500MB warning for node_modules
    console.log(`\nℹ️  node_modules: ${nodeModulesStats.size} (${nodeModulesStats.fileCount} items)`);
    if (nodeModulesStats.warning) {
      console.log('   💡 If unusually large, try: rm -rf node_modules && npm install');
    }
  } catch {
    console.log('\nℹ️  node_modules: Not found or inaccessible');
  }
  
  // Summary with cleanup recommendations
  console.log('\n📝 Quick Cleanup Commands:');
  console.log('   npm run cleanup        # Clean NOAA data files');
  console.log('   npm run cleanup:rust   # Clean Rust build cache');
  console.log('   npm run cleanup:all    # Full cleanup');
  console.log('   npm run storage-check  # Re-run this check');
}

// Run the main function
main();
