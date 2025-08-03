#!/usr/bin/env node

/**
 * Type Hierarchy Validation Script - Phase 3 Step 3.1.4
 * 
 * This script validates the clean type hierarchy implementation:
 * - Checks for circular dependencies
 * - Validates layer separation
 * - Ensures consistent data flow patterns
 * - Reports hierarchy violations
 * 
 * Usage: node validate-type-hierarchy.js
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// HIERARCHY DEFINITION
// =============================================================================

const TYPE_HIERARCHY = {
  foundation: ['Intel', 'IntelEnums', 'IntelLocation', 'IntelClassification', 'Sources', 'Classification'],
  data: ['IntelData', 'IntelReportMetaData'],
  processing: ['IntelReport', 'IntelReportData', 'Intelligence', 'IntelligenceFlowchart'],
  visualization: ['IntelVisualization3D', 'IntelReport3DData', 'Intel3DAdapter'],
  container: ['DataPack', 'IntelReportDataPack', 'IntelReportPackage', 'IntelPackage'],
  utilities: ['IntelFusion', 'Transformers', 'Validators', 'TypeHierarchy']
};

const ALLOWED_DEPENDENCIES = {
  foundation: [],
  data: ['foundation'],
  processing: ['foundation', 'data'],
  visualization: ['foundation', 'data', 'processing'],
  container: ['foundation', 'data', 'processing'],
  utilities: ['foundation', 'data', 'processing', 'visualization']
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Extract imports from a TypeScript file
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}`);
    return [];
  }
}

/**
 * Determine which layer a type belongs to
 */
function getTypeLayer(typeName) {
  for (const [layer, types] of Object.entries(TYPE_HIERARCHY)) {
    if (types.some(type => typeName.includes(type))) {
      return layer;
    }
  }
  return 'unknown';
}

/**
 * Check if a dependency is allowed based on hierarchy rules
 */
function isDependencyAllowed(fromLayer, toLayer) {
  if (fromLayer === toLayer) return true;
  if (fromLayer === 'unknown' || toLayer === 'unknown') return true;
  
  const allowedLayers = ALLOWED_DEPENDENCIES[fromLayer] || [];
  return allowedLayers.includes(toLayer);
}

/**
 * Validate type hierarchy for Intel models
 */
function validateIntelHierarchy() {
  const intelModelsPath = path.join(__dirname, 'src', 'models', 'Intel');
  const violations = [];
  const stats = {
    filesChecked: 0,
    importsAnalyzed: 0,
    violationsFound: 0,
    circularDependencies: 0
  };

  if (!fs.existsSync(intelModelsPath)) {
    console.error('Error: Intel models directory not found');
    return { success: false, violations, stats };
  }

  const files = fs.readdirSync(intelModelsPath).filter(file => file.endsWith('.ts'));

  files.forEach(file => {
    const filePath = path.join(intelModelsPath, file);
    const typeName = path.basename(file, '.ts');
    const fromLayer = getTypeLayer(typeName);
    
    if (fromLayer === 'unknown') return;
    
    stats.filesChecked++;
    const imports = extractImports(filePath);
    
    imports.forEach(importPath => {
      stats.importsAnalyzed++;
      
      // Check for local Intel model imports
      if (importPath.startsWith('./')) {
        const importedType = importPath.substring(2);
        const toLayer = getTypeLayer(importedType);
        
        if (!isDependencyAllowed(fromLayer, toLayer)) {
          violations.push({
            type: 'HIERARCHY_VIOLATION',
            file: file,
            fromLayer,
            toLayer,
            importPath,
            message: `${fromLayer} layer cannot depend on ${toLayer} layer`
          });
          stats.violationsFound++;
        }
        
        // Check for potential circular dependencies
        if (fromLayer === toLayer && typeName !== importedType) {
          violations.push({
            type: 'POTENTIAL_CIRCULAR',
            file: file,
            fromType: typeName,
            toType: importedType,
            message: `Potential circular dependency within ${fromLayer} layer`
          });
          stats.circularDependencies++;
        }
      }
    });
  });

  return { 
    success: violations.length === 0, 
    violations, 
    stats,
    hierarchy: TYPE_HIERARCHY,
    rules: ALLOWED_DEPENDENCIES
  };
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate hierarchy validation report
 */
function generateReport(validationResult) {
  const { success, violations, stats, hierarchy } = validationResult;
  
  console.log('\n' + '='.repeat(70));
  console.log('INTEL TYPE HIERARCHY VALIDATION REPORT');
  console.log('='.repeat(70));
  
  console.log('\n📊 VALIDATION STATISTICS:');
  console.log(`✅ Files Checked: ${stats.filesChecked}`);
  console.log(`🔍 Imports Analyzed: ${stats.importsAnalyzed}`);
  console.log(`❌ Violations Found: ${stats.violationsFound}`);
  console.log(`🔄 Circular Dependencies: ${stats.circularDependencies}`);
  
  console.log('\n🏗️ HIERARCHY STRUCTURE:');
  Object.entries(hierarchy).forEach(([layer, types]) => {
    console.log(`  ${layer.toUpperCase()}: ${types.join(', ')}`);
  });
  
  if (success) {
    console.log('\n✅ TYPE HIERARCHY VALIDATION: PASSED');
    console.log('   All types follow clean hierarchy principles');
    console.log('   No circular dependencies detected');
    console.log('   Layer separation properly maintained');
  } else {
    console.log('\n❌ TYPE HIERARCHY VALIDATION: FAILED');
    console.log(`   Found ${violations.length} violation(s):`);
    
    violations.forEach((violation, index) => {
      console.log(`\n   ${index + 1}. ${violation.type}:`);
      console.log(`      File: ${violation.file}`);
      console.log(`      Issue: ${violation.message}`);
      if (violation.fromLayer) {
        console.log(`      From: ${violation.fromLayer} → To: ${violation.toLayer}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  return success;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (require.main === module) {
  console.log('🔍 Starting Intel Type Hierarchy Validation...');
  
  const result = validateIntelHierarchy();
  const success = generateReport(result);
  
  if (success) {
    console.log('\n🎉 Phase 3 Step 3.1 Type Hierarchy Definition: COMPLETED ✅');
    process.exit(0);
  } else {
    console.log('\n💥 Phase 3 Step 3.1 Type Hierarchy Definition: FAILED ❌');
    console.log('   Please fix violations before proceeding to Step 3.2');
    process.exit(1);
  }
}

module.exports = { validateIntelHierarchy, generateReport };
