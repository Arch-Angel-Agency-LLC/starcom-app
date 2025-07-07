#!/usr/bin/env node
/**
 * 🔍 Code Quality & Confusion Detector
 * Identifies potentially confusing code patterns and legacy remnants
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

console.log('🔍 Starcom Code Quality Analysis');
console.log('======================================\n');

// Check for multiple implementations of same functionality
function findDuplicateImplementations() {
  console.log('📁 Checking for duplicate implementations...');
  
  const authContextFiles = [];
  const findFiles = (dir, filename) => {
    try {
      const files = execSync(`find ${dir} -name "${filename}" -type f`, { encoding: 'utf8' }).trim().split('\n').filter(f => f);
      return files;
    } catch {
      return [];
    }
  };

  const authFiles = findFiles('.', 'AuthContext.tsx');
  if (authFiles.length > 1) {
    console.log('⚠️  Multiple AuthContext implementations found:');
    authFiles.forEach(file => {
      const isActive = file.includes('src/security/context/');
      const status = isActive ? '✅ ACTIVE' : '❌ LEGACY';
      console.log(`   ${status} ${file}`);
    });
  }

  // Check for API implementations
  const apiFiles = findFiles('.', 'investigation_api.rs');
  if (apiFiles.length > 1) {
    console.log('\n⚠️  Multiple API implementations found:');
    apiFiles.forEach(file => {
      const isActive = file.includes('ai-security-relaynode/src/');
      const status = isActive ? '✅ ACTIVE' : '❌ LEGACY';
      console.log(`   ${status} ${file}`);
    });
  }
}

// Check for confusing TODO comments
function scanTODOComments() {
  console.log('\n📝 Scanning for confusing TODO comments...');
  
  try {
    const todoResults = execSync(
      `grep -r "TODO.*CRITICAL\\|TODO.*URGENT\\|TODO.*SECURITY" src/ --include="*.ts" --include="*.tsx" --include="*.rs" | head -10`,
      { encoding: 'utf8' }
    ).trim();
    
    if (todoResults) {
      console.log('🚨 High-priority TODOs found:');
      todoResults.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      });
    } else {
      console.log('✅ No urgent TODOs found');
    }
  } catch {
    console.log('✅ No urgent TODOs found');
  }
}

// Check for mock/fake implementations in production code
function scanMockImplementations() {
  console.log('\n🎭 Scanning for mock/fake implementations...');
  
  const patterns = [
    'mock',
    'fake',
    'placeholder',
    'TODO.*implement',
    'temporarily',
    'hardcoded'
  ];

  let foundIssues = false;
  
  patterns.forEach(pattern => {
    try {
      const results = execSync(
        `grep -ri "${pattern}" src/ --include="*.ts" --include="*.tsx" | head -5`,
        { encoding: 'utf8' }
      ).trim();
      
      if (results) {
        if (!foundIssues) {
          console.log('⚠️  Potential production code issues:');
          foundIssues = true;
        }
        results.split('\n').forEach(line => {
          if (line.trim()) {
            console.log(`   ${line.substring(0, 100)}...`);
          }
        });
      }
    } catch {
      // Pattern not found
    }
  });
  
  if (!foundIssues) {
    console.log('✅ No obvious mock implementations in production code');
  }
}

// Check for legacy directories
function scanLegacyDirectories() {
  console.log('\n📂 Checking for legacy/backup directories...');
  
  const suspiciousNames = [
    'backup',
    'old',
    'legacy',
    'deprecated',
    'archive',
    'mk2',
    'excluded'
  ];
  
  const foundDirs = [];
  
  suspiciousNames.forEach(name => {
    try {
      const dirs = execSync(`find . -name "*${name}*" -type d | head -5`, { encoding: 'utf8' }).trim().split('\n').filter(d => d && d !== '.');
      foundDirs.push(...dirs);
    } catch {
      // No directories found
    }
  });
  
  if (foundDirs.length > 0) {
    console.log('📁 Legacy/backup directories found:');
    foundDirs.forEach(dir => {
      const size = execSync(`du -sh "${dir}"`, { encoding: 'utf8' }).split('\t')[0];
      console.log(`   ${dir} (${size})`);
    });
  } else {
    console.log('✅ No obvious legacy directories found');
  }
}

// Check for inconsistent imports
function scanInconsistentImports() {
  console.log('\n🔗 Checking for potentially confusing import patterns...');
  
  try {
    // Look for imports from multiple auth contexts
    const authImports = execSync(
      `grep -r "import.*AuthContext" src/ --include="*.ts" --include="*.tsx" | head -10`,
      { encoding: 'utf8' }
    ).trim();
    
    if (authImports) {
      const importPaths = new Set();
      authImports.split('\n').forEach(line => {
        const match = line.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          importPaths.add(match[1]);
        }
      });
      
      if (importPaths.size > 1) {
        console.log('⚠️  Multiple AuthContext import paths found:');
        importPaths.forEach(path => console.log(`   ${path}`));
      } else {
        console.log('✅ Consistent AuthContext imports');
      }
    }
  } catch {
    console.log('✅ No AuthContext imports found to analyze');
  }
}

// Main execution
function main() {
  findDuplicateImplementations();
  scanTODOComments();
  scanMockImplementations();
  scanLegacyDirectories();
  scanInconsistentImports();
  
  console.log('\n🎯 Summary:');
  console.log('- Check any LEGACY files marked above');
  console.log('- Review high-priority TODOs');
  console.log('- Consider archiving backup directories');
  console.log('- Ensure production code has no mock implementations');
  
  console.log('\n💡 For detailed analysis, run:');
  console.log('   npm run storage-check    # Storage health');
  console.log('   npm run build           # Build verification');
  console.log('   npm test                # Test execution');
}

main();
