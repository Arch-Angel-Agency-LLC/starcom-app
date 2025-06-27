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

function getDirectoryStats(dirPath, warningThresholdMB = 50) {
  if (!existsSync(dirPath)) {
    return {
      path: dirPath,
      exists: false,
      size: '0B',
      fileCount: 0,
      warning: false
    };
  }

  try {
    const sizeOutput = execSync(`du -sh "${dirPath}"`, { encoding: 'utf8' }).trim();
    const size = sizeOutput.split('\t')[0];
    
    const files = readdirSync(dirPath);
    const fileCount = files.filter(f => !f.startsWith('.')).length;
    
    // Extract numeric value for warning check
    const sizeNum = parseFloat(size);
    const isWarning = size.includes('M') && sizeNum > warningThresholdMB;
    
    return {
      path: dirPath,
      exists: true,
      size,
      fileCount,
      warning: isWarning
    };
  } catch (error) {
    return {
      path: dirPath,
      exists: true,
      size: 'Error',
      fileCount: 0,
      warning: false
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
    }
    
    console.log('');
  });
  
  if (totalWarnings > 0) {
    console.log(`⚠️  ${totalWarnings} directories exceed size limits!`);
    console.log('Consider running cleanup commands from ONBOARDING.md');
  } else {
    console.log('✅ All directories within acceptable size limits');
  }
  
  // Check for specific file patterns
  if (existsSync(NOAA_DATA_DIR)) {
    const noaaFiles = readdirSync(NOAA_DATA_DIR).filter(f => f.endsWith('.json'));
    if (noaaFiles.length > 20) {
      console.log(`\n🚨 NOAA Data Alert: ${noaaFiles.length} JSON files detected`);
      console.log('   Consider running: rm -f technical_reference_code_samples/NOAA_directory_scan/noaa_data/*.json');
    }
  }
}

function main() {
  console.log('Checking Starcom project storage usage...');
  
  const directories = [
    getDirectoryStats(NOAA_DATA_DIR, 20), // 20MB warning for NOAA data
    getDirectoryStats(CACHE_DIR, 100),    // 100MB warning for cache
    getDirectoryStats(DIST_DIR, 50),      // 50MB warning for dist
  ];
  
  formatReport(directories);
  
  // Additional node_modules check
  try {
    const nodeModulesSize = execSync('du -sh node_modules', { encoding: 'utf8' }).trim();
    const size = nodeModulesSize.split('\t')[0];
    console.log(`\nℹ️  node_modules: ${size} (normal for this project)`);
  } catch {
    console.log('\nℹ️  node_modules: Not found or inaccessible');
  }
}

// Run the main function
main();
