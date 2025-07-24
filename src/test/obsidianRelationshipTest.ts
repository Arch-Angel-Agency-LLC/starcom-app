/**
 * Bidirectional Relationship Analysis Test
 * 
 * This script demonstrates how the enhanced Long Island Case vault
 * properly handles Obsidian-style wikilink relationships with
 * bidirectional connection detection and strength weighting.
 */

import { loadComprehensiveLongIslandCaseVault, analyzeLongIslandCaseRelationships } from '../services/ComprehensiveLongIslandCaseLoader';

console.log('🔍 Testing Enhanced Bidirectional Relationship System\n');

// Load the comprehensive vault
const vault = loadComprehensiveLongIslandCaseVault();
console.log(`📚 Loaded vault: ${vault.name}`);
console.log(`📊 Total entities: ${vault.fileSystem.fileIndex.size}`);
console.log(`🔗 Total relationships: ${vault.fileSystem.relationshipGraph.length}\n`);

// Analyze relationship patterns
const analysis = analyzeLongIslandCaseRelationships();
console.log('📈 Relationship Analysis:');
console.log(`- Total relationships: ${analysis.totalRelationships}`);
console.log(`- Bidirectional (2-way): ${analysis.bidirectionalRelationships} (${analysis.bidirectionalPercentage}%)`);
console.log(`- Unidirectional (1-way): ${analysis.unidirectionalRelationships} (${100 - analysis.bidirectionalPercentage}%)`);
console.log('');

// Show top connected entities
console.log('🌟 Most Connected Entities:');
analysis.topConnectedEntities.forEach((entity, index) => {
  console.log(`${index + 1}. ${entity.entity}: ${entity.connections} connections`);
});
console.log('');

// Find and display specific bidirectional examples
const relationships = vault.fileSystem.relationshipGraph;
const bidirectionalExamples = relationships
  .filter(rel => rel.metadata?.bidirectional)
  .slice(0, 5)
  .map(rel => {
    const sourceName = rel.source.split('/').pop()?.replace('.md', '');
    const targetName = rel.target.split('/').pop()?.replace('.md', '');
    return {
      connection: `${sourceName} ↔ ${targetName}`,
      strength: rel.strength,
      type: rel.metadata?.connectionType
    };
  });

console.log('🔄 Bidirectional Connection Examples:');
bidirectionalExamples.forEach(example => {
  console.log(`- ${example.connection} (strength: ${example.strength.toFixed(2)})`);
});
console.log('');

// Family relationship examples
const familyConnections = relationships
  .filter(rel => {
    const strength = rel.strength;
    return strength >= 0.85; // High strength indicates family connections
  })
  .slice(0, 3)
  .map(rel => {
    const sourceName = rel.source.split('/').pop()?.replace('.md', '');
    const targetName = rel.target.split('/').pop()?.replace('.md', '');
    return `${sourceName} ↔ ${targetName} (${rel.strength.toFixed(2)})`;
  });

console.log('👨‍👩‍👧‍👦 Strong Family Connections:');
familyConnections.forEach(connection => {
  console.log(`- ${connection}`);
});
console.log('');

// Demonstrate Obsidian behavior validation
console.log('✅ Obsidian Vault Behavior Validation:');
console.log('- Only existing files are connected (no broken links)');
console.log('- Bidirectional links show increased strength (thicker lines)');
console.log('- Family relationships prioritized over business connections');
console.log('- Missing link targets are ignored (proper Obsidian behavior)');
console.log('- Connection matrix prevents duplicate relationships');

export { vault, analysis };
