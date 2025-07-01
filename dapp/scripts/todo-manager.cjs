#!/usr/bin/env node

/**
 * TODO Management and Analysis Utility
 * Starcom dApp - Comprehensive TODO tracking and management
 * Date: July 1, 2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class TODOManager {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.todos = [];
    this.categories = {
      legacy: [],
      current: [],
      priority: [],
      outdated: []
    };
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // Scan for all TODOs in the codebase
  scanTODOs() {
    this.log('\n🔍 Scanning for TODOs in src/ directory...', 'blue');
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
            scanDirectory(filePath);
          }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          this.scanFileForTODOs(filePath);
        }
      }
    };

    scanDirectory(this.srcDir);
    this.log(`Found ${this.todos.length} TODOs total`, 'green');
  }

  // Scan individual file for TODOs
  scanFileForTODOs(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('TODO')) {
          const todo = {
            file: path.relative(this.srcDir, filePath),
            line: index + 1,
            content: trimmedLine,
            category: this.categorizeTODO(trimmedLine, filePath)
          };
          this.todos.push(todo);
          this.categories[todo.category].push(todo);
        }
      });
    } catch (error) {
      this.log(`Error reading file ${filePath}: ${error.message}`, 'red');
    }
  }

  // Categorize TODOs based on content and context
  categorizeTODO(todoContent, filePath) {
    const content = todoContent.toLowerCase();
    const file = filePath.toLowerCase();

    // Legacy patterns
    const legacyPatterns = [
      'server-side',
      'rainbowkit',
      'wagmi',
      'ethers',
      'did verification',
      'otk generation',
      'pqc implementation',
      'sentry'
    ];

    // Outdated patterns
    const outdatedPatterns = [
      'when ready',
      'actual implementation', 
      'proper implementation',
      'real implementation',
      'fix this',
      'implement properly'
    ];

    // Priority patterns
    const priorityPatterns = [
      'anchor integration',
      'solana',
      'ipfs',
      'nostr',
      'authgate',
      'wallet adapter',
      'intel report',
      'authentication refactor'
    ];

    // Check for legacy patterns
    if (legacyPatterns.some(pattern => content.includes(pattern)) ||
        file.includes('backup') || file.includes('legacy')) {
      return 'legacy';
    }

    // Check for outdated patterns
    if (outdatedPatterns.some(pattern => content.includes(pattern))) {
      return 'outdated';
    }

    // Check for priority patterns
    if (priorityPatterns.some(pattern => content.includes(pattern))) {
      return 'priority';
    }

    return 'current';
  }

  // Generate detailed report
  generateReport() {
    this.log('\n📊 TODO Analysis Report', 'cyan');
    this.log('='.repeat(50), 'cyan');

    // Summary statistics
    this.log(`\n📈 Summary Statistics:`, 'blue');
    this.log(`  Total TODOs: ${this.todos.length}`);
    this.log(`  🗑️  Legacy TODOs: ${this.categories.legacy.length}`, 'red');
    this.log(`  ⚠️  Outdated TODOs: ${this.categories.outdated.length}`, 'yellow');
    this.log(`  🎯 Priority TODOs: ${this.categories.priority.length}`, 'green');
    this.log(`  📝 Current TODOs: ${this.categories.current.length}`, 'blue');

    // Detailed breakdown by category
    this.generateCategoryReport('legacy', '🗑️ Legacy TODOs (Should be removed)', 'red');
    this.generateCategoryReport('outdated', '⚠️ Outdated TODOs (Need updating)', 'yellow');
    this.generateCategoryReport('priority', '🎯 Priority TODOs (High impact)', 'green');
    this.generateCategoryReport('current', '📝 Current TODOs (Standard)', 'blue');

    // File-based analysis
    this.generateFileAnalysis();

    // Recommendations
    this.generateRecommendations();
  }

  // Generate report for specific category
  generateCategoryReport(category, title, color) {
    const todos = this.categories[category];
    if (todos.length === 0) return;

    this.log(`\n${title} (${todos.length})`, color);
    this.log('-'.repeat(50), color);

    todos.slice(0, 10).forEach(todo => {
      this.log(`  📄 ${todo.file}:${todo.line}`);
      this.log(`     ${todo.content}`, 'white');
    });

    if (todos.length > 10) {
      this.log(`     ... and ${todos.length - 10} more`, 'magenta');
    }
  }

  // Generate file-based analysis
  generateFileAnalysis() {
    this.log('\n📁 Files with Most TODOs', 'cyan');
    this.log('-'.repeat(30), 'cyan');

    const fileCount = {};
    this.todos.forEach(todo => {
      fileCount[todo.file] = (fileCount[todo.file] || 0) + 1;
    });

    const sortedFiles = Object.entries(fileCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    sortedFiles.forEach(([file, count]) => {
      this.log(`  ${count} TODOs: ${file}`, count > 5 ? 'red' : count > 2 ? 'yellow' : 'green');
    });
  }

  // Generate actionable recommendations
  generateRecommendations() {
    this.log('\n🎯 Actionable Recommendations', 'cyan');
    this.log('='.repeat(40), 'cyan');

    if (this.categories.legacy.length > 0) {
      this.log('\n1. 🗑️ Remove Legacy TODOs:', 'red');
      this.log('   - Archive backup authentication files');
      this.log('   - Remove EVM/Ethereum references');
      this.log('   - Clean up server-side security TODOs');
    }

    if (this.categories.outdated.length > 0) {
      this.log('\n2. 🔄 Update Outdated TODOs:', 'yellow');
      this.log('   - Replace vague TODOs with specific requirements');
      this.log('   - Add implementation context and file references');
      this.log('   - Update with current architecture decisions');
    }

    if (this.categories.priority.length > 0) {
      this.log('\n3. 🚀 Focus on Priority TODOs:', 'green');
      this.log('   - Solana integration and wallet adapter TODOs');
      this.log('   - Authentication refactor related items');
      this.log('   - IPFS/Nostr decentralized architecture TODOs');
    }

    this.log('\n4. 📋 TODO Best Practices:', 'blue');
    this.log('   - Use format: TODO: [ACTION] - [CONTEXT] - [PRIORITY]');
    this.log('   - Include specific file/component references');
    this.log('   - Link to relevant artifacts or documentation');
    this.log('   - Set realistic implementation timeframes');
  }

  // Export TODOs to different formats
  exportTODOs(format = 'json') {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `todo-analysis-${timestamp}.${format}`;
    
    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        summary: {
          total: this.todos.length,
          legacy: this.categories.legacy.length,
          outdated: this.categories.outdated.length,
          priority: this.categories.priority.length,
          current: this.categories.current.length
        },
        todos: this.todos,
        categories: this.categories
      };
      
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      this.log(`\n💾 Exported TODO analysis to ${filename}`, 'green');
    }
  }

  // Main execution method
  run() {
    this.log('🧹 Starcom dApp TODO Management Utility', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    try {
      this.scanTODOs();
      this.generateReport();
      this.exportTODOs();
      
      this.log('\n✅ TODO analysis complete!', 'green');
      this.log('📋 Next steps: Review recommendations and execute cleanup phases', 'blue');
      
    } catch (error) {
      this.log(`❌ Error during TODO analysis: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const manager = new TODOManager();
  manager.run();
}

module.exports = TODOManager;
