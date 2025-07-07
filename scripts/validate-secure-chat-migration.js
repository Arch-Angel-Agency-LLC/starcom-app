/**
 * validate-secure-chat-migration.js
 * 
 * This script validates the migration of secure chat components to the unified chat system.
 * It checks for any remaining references to legacy secure chat code and reports them.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Patterns to identify legacy chat code
const LEGACY_PATTERNS = [
  { pattern: /useSecureChat/, description: 'Legacy SecureChat hook' },
  { pattern: /SecureChatContext/, description: 'Legacy SecureChat context' },
  { pattern: /secureChatIntegration/, description: 'Direct reference to secureChatIntegration service' },
  { pattern: /import.*SecureChatWindow[^-]/, description: 'Legacy SecureChatWindow component' },
  { pattern: /import.*SecureChatContactList[^-]/, description: 'Legacy SecureChatContactList component' },
  { pattern: /import.*SecureChatManager[^-]/, description: 'Legacy SecureChatManager component' },
  { pattern: /SecureChatIntegrationService/, description: 'Direct reference to SecureChatIntegrationService' },
];

// Patterns for unified code (these are good!)
const UNIFIED_PATTERNS = [
  { pattern: /useChat/, description: 'Unified chat hook' },
  { pattern: /ChatContext/, description: 'Unified chat context' },
  { pattern: /ChatProvider/, description: 'Unified ChatProvider interface' },
  { pattern: /ChatProviderFactory/, description: 'Unified ChatProviderFactory' },
  { pattern: /.*-unified\.tsx$/, description: 'Unified component file' },
];

// Source directories to check
const SRC_DIRS = [
  'src/components',
  'src/pages',
  'src/views',
  'src/layout',
  'src/communication',
  'src/context',
  'src/services',
  'src/hooks',
];

// Files to ignore
const IGNORE_FILES = [
  '.DS_Store',
  '.gitkeep',
  'node_modules',
  'test',
  'tests',
  '__tests__',
  'SecureChatManager-unified.tsx',
  'SecureChatWindow-unified.tsx',
  'SecureChatContactList-unified.tsx',
];

// Results tracking
const results = {
  scanned: 0,
  withLegacy: 0,
  withUnified: 0,
  needsMigration: [],
  fullyMigrated: [],
  migrationInProgress: [],
  byComponent: {
    'SecureChatWindow': { total: 0, migrated: 0, usages: [] },
    'SecureChatContactList': { total: 0, migrated: 0, usages: [] },
    'SecureChatManager': { total: 0, migrated: 0, usages: [] },
    'useSecureChat': { total: 0, migrated: 0, usages: [] },
    'SecureChatContext': { total: 0, migrated: 0, usages: [] },
    'SecureChatIntegrationService': { total: 0, migrated: 0, usages: [] },
  }
};

/**
 * Recursively scan directories for files to check
 */
async function scanDirectory(dir) {
  try {
    const entries = await fs.promises.readdir(dir);
    
    for (const entry of entries) {
      if (IGNORE_FILES.some(ignore => entry.includes(ignore))) continue;
      
      const fullPath = path.join(dir, entry);
      const stats = await fs.promises.stat(fullPath);
      
      if (stats.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (stats.isFile() && 
                (entry.endsWith('.js') || 
                entry.endsWith('.jsx') || 
                entry.endsWith('.ts') || 
                entry.endsWith('.tsx'))) {
        await checkFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Check a file for legacy and unified chat code
 */
async function checkFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    results.scanned++;
    
    // Count and track component usages
    for (const component of Object.keys(results.byComponent)) {
      const regex = new RegExp(component, 'g');
      const matches = content.match(regex);
      
      if (matches) {
        results.byComponent[component].total += matches.length;
        results.byComponent[component].usages.push({
          file: filePath,
          count: matches.length
        });
      }
      
      // Check for unified versions
      const unifiedRegex = new RegExp(`${component}-unified`, 'g');
      const unifiedMatches = content.match(unifiedRegex);
      
      if (unifiedMatches) {
        results.byComponent[component].migrated += unifiedMatches.length;
      }
    }
    
    // Check for legacy patterns
    let hasLegacy = false;
    const legacyMatches = [];
    
    for (const { pattern, description } of LEGACY_PATTERNS) {
      if (pattern.test(content)) {
        hasLegacy = true;
        legacyMatches.push(description);
      }
    }
    
    // Check for unified patterns
    let hasUnified = false;
    const unifiedMatches = [];
    
    for (const { pattern, description } of UNIFIED_PATTERNS) {
      if (pattern.test(content) || pattern.test(filePath)) {
        hasUnified = true;
        unifiedMatches.push(description);
      }
    }
    
    // Categorize the file
    if (hasLegacy) {
      results.withLegacy++;
      
      if (hasUnified) {
        results.migrationInProgress.push({
          file: filePath,
          legacy: legacyMatches,
          unified: unifiedMatches
        });
      } else {
        results.needsMigration.push({
          file: filePath,
          legacy: legacyMatches
        });
      }
    } else if (hasUnified) {
      results.withUnified++;
      results.fullyMigrated.push({
        file: filePath,
        unified: unifiedMatches
      });
    }
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }
}

/**
 * Generate a report of the scan results
 */
function generateReport() {
  console.log('\n=== SECURE CHAT MIGRATION VALIDATION REPORT ===\n');
  console.log(`Files scanned: ${results.scanned}`);
  console.log(`Files with legacy code: ${results.withLegacy}`);
  console.log(`Files with unified code: ${results.withUnified}`);
  console.log(`Files fully migrated: ${results.fullyMigrated.length}`);
  console.log(`Files with migration in progress: ${results.migrationInProgress.length}`);
  console.log(`Files needing migration: ${results.needsMigration.length}`);
  
  console.log('\n--- COMPONENT MIGRATION STATUS ---\n');
  for (const [component, stats] of Object.entries(results.byComponent)) {
    const migrationPercent = stats.total > 0 
      ? Math.round((stats.migrated / stats.total) * 100) 
      : 0;
    
    console.log(`${component}:`);
    console.log(`  Total usages: ${stats.total}`);
    console.log(`  Migrated: ${stats.migrated} (${migrationPercent}%)`);
    console.log(`  Remaining: ${stats.total - stats.migrated}`);
    console.log('');
  }
  
  if (results.needsMigration.length > 0) {
    console.log('\n--- FILES NEEDING MIGRATION ---\n');
    for (const { file, legacy } of results.needsMigration) {
      console.log(`${file}:`);
      for (const item of legacy) {
        console.log(`  - ${item}`);
      }
      console.log('');
    }
  }
  
  if (results.migrationInProgress.length > 0) {
    console.log('\n--- FILES WITH MIGRATION IN PROGRESS ---\n');
    for (const { file, legacy, unified } of results.migrationInProgress) {
      console.log(`${file}:`);
      console.log('  Legacy:');
      for (const item of legacy) {
        console.log(`    - ${item}`);
      }
      console.log('  Unified:');
      for (const item of unified) {
        console.log(`    - ${item}`);
      }
      console.log('');
    }
  }
  
  if (results.fullyMigrated.length > 0) {
    console.log('\n--- FULLY MIGRATED FILES ---\n');
    for (const { file, unified } of results.fullyMigrated) {
      console.log(`${file}:`);
      for (const item of unified) {
        console.log(`  - ${item}`);
      }
      console.log('');
    }
  }
  
  console.log('\n=== NEXT STEPS ===\n');
  
  if (results.needsMigration.length > 0) {
    console.log('1. Focus on migrating the following components first:');
    const componentPriority = Object.entries(results.byComponent)
      .sort((a, b) => (b[1].total - b[1].migrated) - (a[1].total - a[1].migrated))
      .filter(([_, stats]) => stats.total > stats.migrated);
    
    for (const [component, stats] of componentPriority) {
      console.log(`   - ${component}: ${stats.total - stats.migrated} usages remaining`);
    }
  } else {
    console.log('All components have been migrated! 🎉');
  }
  
  console.log('\n2. Update imports in all files to use unified components');
  console.log('3. Remove or deprecate legacy components once all references are migrated');
  console.log('4. Run comprehensive tests to ensure functionality is preserved');
  
  console.log('\n=== END OF REPORT ===\n');
}

/**
 * Main function to run the validation
 */
async function main() {
  console.log('Starting secure chat migration validation...');
  
  // Get the current working directory
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const workingDir = path.resolve(__dirname, '..');
  
  for (const dir of SRC_DIRS) {
    const fullPath = path.join(workingDir, dir);
    if (fs.existsSync(fullPath)) {
      await scanDirectory(fullPath);
    }
  }
  
  generateReport();
}

main().catch(console.error);
