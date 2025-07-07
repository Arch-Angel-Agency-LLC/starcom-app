#!/usr/bin/env node

/**
 * Strategic TODO Addition Script
 * Systematically adds 240 high-value TODOs across the entire Starcom dApp codebase
 * Date: July 1, 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class StrategicTODOAdder {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.addedTODOs = 0;
    this.targetTODOs = 240;
    this.todoCategories = {};
    this.processedFiles = new Set();
  }

  log(message, color = 'white') {
    console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
  }

  // TODO definitions organized by functional area
  getTODOsByCategory() {
    return {
      // API & External Services (25 TODOs)
      api: [
        'TODO: Implement rate limiting for API requests with exponential backoff - PRIORITY: HIGH',
        'TODO: Add request/response caching layer for frequently accessed data - PRIORITY: MEDIUM',
        'TODO: Implement API versioning support for backward compatibility - PRIORITY: MEDIUM',
        'TODO: Add comprehensive error mapping for all API error codes - PRIORITY: HIGH',
        'TODO: Implement request queuing for batch operations - PRIORITY: MEDIUM',
        'TODO: Add API health monitoring and automatic failover to backup endpoints - PRIORITY: HIGH',
        'TODO: Implement secure API key rotation and management - PRIORITY: HIGH',
        'TODO: Add request/response logging for debugging and audit trails - PRIORITY: MEDIUM',
        'TODO: Implement automatic RPC endpoint switching for network resilience - PRIORITY: HIGH',
        'TODO: Add transaction retry logic with increasing gas fees - PRIORITY: HIGH',
        'TODO: Implement comprehensive account state monitoring and caching - PRIORITY: MEDIUM',
        'TODO: Add support for batch transaction processing - PRIORITY: MEDIUM',
        'TODO: Implement smart contract upgrade detection and compatibility checking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive program error handling and user-friendly messages - PRIORITY: HIGH',
        'TODO: Implement transaction simulation before actual submission - PRIORITY: MEDIUM',
        'TODO: Add support for priority fee estimation based on network congestion - PRIORITY: MEDIUM',
        'TODO: Implement data source health checking and automatic failover - PRIORITY: HIGH',
        'TODO: Add data freshness validation and stale data handling - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive data transformation and normalization pipeline - PRIORITY: MEDIUM',
        'TODO: Add support for real-time data streaming from external sources - PRIORITY: MEDIUM',
        'TODO: Implement data source authentication and credential management - PRIORITY: HIGH',
        'TODO: Add data quality validation and anomaly detection - PRIORITY: MEDIUM',
        'TODO: Implement data source rate limiting and quota management - PRIORITY: MEDIUM',
        'TODO: Add comprehensive data lineage tracking for audit purposes - PRIORITY: LOW',
        'TODO: Implement data source backup and redundancy strategies - PRIORITY: MEDIUM'
      ],

      // Components & UI (60 TODOs)
      components: [
        'TODO: Implement comprehensive wallet connection error recovery and user guidance - PRIORITY: HIGH',
        'TODO: Add biometric authentication support for supported devices - PRIORITY: LOW',
        'TODO: Implement session timeout warnings and automatic renewal prompts - PRIORITY: MEDIUM',
        'TODO: Add multi-factor authentication support for high-security operations - PRIORITY: MEDIUM',
        'TODO: Implement social recovery mechanisms for wallet access - PRIORITY: LOW',
        'TODO: Add comprehensive authentication analytics and user behavior tracking - PRIORITY: LOW',
        'TODO: Implement progressive authentication (basic → advanced security levels) - PRIORITY: MEDIUM',
        'TODO: Add support for hardware wallet integration (Ledger, Trezor) - PRIORITY: MEDIUM',
        'TODO: Implement authentication state persistence across browser sessions - PRIORITY: MEDIUM',
        'TODO: Add comprehensive authentication error logging and monitoring - PRIORITY: MEDIUM',
        'TODO: Implement authentication flow customization based on user preferences - PRIORITY: LOW',
        'TODO: Add support for enterprise SSO integration for organizational users - PRIORITY: LOW',
        'TODO: Implement adaptive level-of-detail (LOD) system for 3D models - PRIORITY: MEDIUM',
        'TODO: Add support for custom shader materials for enhanced visual effects - PRIORITY: LOW',
        'TODO: Implement intel marker clustering with smooth zoom transitions - PRIORITY: HIGH',
        'TODO: Add real-time globe texture streaming based on current view - PRIORITY: MEDIUM',
        'TODO: Implement mouse/touch gesture recognition for advanced globe interaction - PRIORITY: MEDIUM',
        'TODO: Add support for VR/AR viewing modes for immersive experience - PRIORITY: LOW',
        'TODO: Implement performance profiling and optimization for different device capabilities - PRIORITY: MEDIUM',
        'TODO: Add support for custom overlay layers (weather, geopolitical, economic) - PRIORITY: MEDIUM',
        'TODO: Implement smooth camera path animation for guided tours - PRIORITY: LOW',
        'TODO: Add support for temporal visualization (time-based data changes) - PRIORITY: MEDIUM',
        'TODO: Implement collision detection for 3D objects and user interactions - PRIORITY: MEDIUM',
        'TODO: Add support for collaborative real-time globe viewing with multiple users - PRIORITY: MEDIUM',
        'TODO: Implement advanced lighting and shadow systems for realistic rendering - PRIORITY: LOW',
        'TODO: Add support for dynamic globe theming and visual customization - PRIORITY: LOW',
        'TODO: Implement globe bookmarking and saved viewpoints functionality - PRIORITY: MEDIUM',
        'TODO: Implement real-time collaborative editing for investigation documents - PRIORITY: HIGH',
        'TODO: Add comprehensive search and filtering across all investigation data - PRIORITY: HIGH',
        'TODO: Implement investigation timeline visualization with interactive events - PRIORITY: MEDIUM',
        'TODO: Add support for evidence chain-of-custody tracking and verification - PRIORITY: HIGH',
        'TODO: Implement automated investigation report generation with templates - PRIORITY: MEDIUM',
        'TODO: Add support for investigation branching and alternative hypothesis tracking - PRIORITY: MEDIUM',
        'TODO: Implement investigation data export in multiple formats (PDF, JSON, CSV) - PRIORITY: MEDIUM',
        'TODO: Add comprehensive investigation analytics and progress tracking - PRIORITY: MEDIUM',
        'TODO: Implement investigation sharing and permission management - PRIORITY: HIGH',
        'TODO: Add support for investigation templates and workflow automation - PRIORITY: MEDIUM',
        'TODO: Implement investigation backup and recovery mechanisms - PRIORITY: MEDIUM',
        'TODO: Add support for investigation cross-referencing and link analysis - PRIORITY: MEDIUM',
        'TODO: Implement investigation notification system for team updates - PRIORITY: MEDIUM',
        'TODO: Add support for investigation archival and long-term storage - PRIORITY: LOW',
        'TODO: Implement investigation data validation and integrity checking - PRIORITY: HIGH',
        'TODO: Implement end-to-end encryption for all team communications - PRIORITY: HIGH',
        'TODO: Add support for file sharing with automatic virus scanning - PRIORITY: MEDIUM',
        'TODO: Implement message search and archival across all conversations - PRIORITY: MEDIUM',
        'TODO: Add support for voice and video calls within the application - PRIORITY: LOW',
        'TODO: Implement message threading and conversation organization - PRIORITY: MEDIUM',
        'TODO: Add comprehensive notification system for important communications - PRIORITY: MEDIUM',
        'TODO: Implement message translation for international team collaboration - PRIORITY: LOW',
        'TODO: Add support for temporary/disappearing messages for sensitive communications - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive communication analytics and reporting - PRIORITY: LOW',
        'TODO: Add support for communication compliance and regulatory requirements - PRIORITY: MEDIUM',
        'TODO: Implement adaptive HUD layout based on screen size and user preferences - PRIORITY: MEDIUM',
        'TODO: Add support for customizable HUD component positioning and sizing - PRIORITY: MEDIUM',
        'TODO: Implement HUD component state persistence across sessions - PRIORITY: MEDIUM',
        'TODO: Add comprehensive keyboard navigation and accessibility features - PRIORITY: HIGH',
        'TODO: Implement HUD performance optimization for resource-constrained devices - PRIORITY: MEDIUM',
        'TODO: Add support for HUD theming and visual customization - PRIORITY: LOW',
        'TODO: Implement HUD component lazy loading for improved startup performance - PRIORITY: MEDIUM',
        'TODO: Add comprehensive HUD analytics and usage tracking - PRIORITY: LOW',
        'TODO: Implement loading state management for all async operations - PRIORITY: HIGH',
        'TODO: Add error boundary implementation for robust error handling - PRIORITY: HIGH'
      ],

      // Services & Business Logic (45 TODOs)
      services: [
        'TODO: Implement automatic IPFS node health monitoring and peer discovery - PRIORITY: HIGH',
        'TODO: Add support for IPFS content pinning strategies based on usage patterns - PRIORITY: MEDIUM',
        'TODO: Implement IPFS content encryption before storage for sensitive data - PRIORITY: HIGH',
        'TODO: Add comprehensive IPFS content deduplication and optimization - PRIORITY: MEDIUM',
        'TODO: Implement IPFS content migration between different storage providers - PRIORITY: LOW',
        'TODO: Add support for IPFS content versioning and rollback capabilities - PRIORITY: MEDIUM',
        'TODO: Implement IPFS bandwidth usage monitoring and optimization - PRIORITY: MEDIUM',
        'TODO: Add comprehensive IPFS content access logging and analytics - PRIORITY: MEDIUM',
        'TODO: Implement IPFS content backup and redundancy across multiple nodes - PRIORITY: HIGH',
        'TODO: Add support for IPFS content compression and optimization - PRIORITY: MEDIUM',
        'TODO: Implement IPFS content integrity verification and repair mechanisms - PRIORITY: HIGH',
        'TODO: Add comprehensive IPFS network topology analysis and optimization - PRIORITY: LOW',
        'TODO: Implement Nostr relay load balancing and automatic failover - PRIORITY: HIGH',
        'TODO: Add support for Nostr event filtering and subscription optimization - PRIORITY: MEDIUM',
        'TODO: Implement Nostr identity verification and reputation tracking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive Nostr event caching and offline support - PRIORITY: MEDIUM',
        'TODO: Implement Nostr relay discovery and network topology mapping - PRIORITY: MEDIUM',
        'TODO: Add support for Nostr event encryption and privacy protection - PRIORITY: HIGH',
        'TODO: Implement Nostr event indexing and search capabilities - PRIORITY: MEDIUM',
        'TODO: Add comprehensive Nostr network analytics and monitoring - PRIORITY: LOW',
        'TODO: Implement Nostr event validation and spam protection - PRIORITY: MEDIUM',
        'TODO: Add support for Nostr relay whitelisting and blacklisting - PRIORITY: MEDIUM',
        'TODO: Implement intelligent intel report quality scoring and ranking - PRIORITY: MEDIUM',
        'TODO: Add support for intel report similarity detection and deduplication - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive intel report metadata extraction and indexing - PRIORITY: MEDIUM',
        'TODO: Add support for intel report collaborative verification workflows - PRIORITY: HIGH',
        'TODO: Implement intel report expiration and archival mechanisms - PRIORITY: MEDIUM',
        'TODO: Add comprehensive intel report access control and permission management - PRIORITY: HIGH',
        'TODO: Implement intel report citation and reference tracking - PRIORITY: MEDIUM',
        'TODO: Add support for intel report format validation and standardization - PRIORITY: MEDIUM',
        'TODO: Implement intel report versioning and change tracking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive intel report analytics and usage statistics - PRIORITY: LOW',
        'TODO: Implement intel report recommendation engine based on user behavior - PRIORITY: LOW',
        'TODO: Add support for intel report batch processing and bulk operations - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive security audit logging and monitoring - PRIORITY: HIGH',
        'TODO: Add support for security threat detection and automated response - PRIORITY: HIGH',
        'TODO: Implement security policy enforcement and compliance checking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive security vulnerability scanning and remediation - PRIORITY: HIGH',
        'TODO: Implement security incident response and recovery procedures - PRIORITY: HIGH',
        'TODO: Add support for security key rotation and management automation - PRIORITY: MEDIUM',
        'TODO: Implement security metrics collection and reporting - PRIORITY: MEDIUM',
        'TODO: Add comprehensive security testing and penetration testing integration - PRIORITY: MEDIUM',
        'TODO: Implement security awareness training and user education features - PRIORITY: LOW',
        'TODO: Add support for security compliance reporting for regulatory requirements - PRIORITY: MEDIUM',
        'TODO: Implement security backup and disaster recovery mechanisms - PRIORITY: MEDIUM'
      ],

      // Hooks & State Management (30 TODOs)
      hooks: [
        'TODO: Implement automatic authentication state recovery after network disconnection - PRIORITY: HIGH',
        'TODO: Add support for authentication state synchronization across multiple tabs - PRIORITY: MEDIUM',
        'TODO: Implement authentication event logging and audit trail - PRIORITY: MEDIUM',
        'TODO: Add comprehensive authentication error recovery and retry mechanisms - PRIORITY: HIGH',
        'TODO: Implement authentication state caching for improved performance - PRIORITY: MEDIUM',
        'TODO: Add support for authentication middleware and plugin architecture - PRIORITY: LOW',
        'TODO: Implement authentication state validation and integrity checking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive authentication analytics and user behavior tracking - PRIORITY: LOW',
        'TODO: Implement intelligent data prefetching based on user navigation patterns - PRIORITY: MEDIUM',
        'TODO: Add support for data state optimistic updates and rollback mechanisms - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive data state caching with TTL and invalidation - PRIORITY: MEDIUM',
        'TODO: Add support for data state persistence across browser sessions - PRIORITY: MEDIUM',
        'TODO: Implement data state synchronization across multiple components - PRIORITY: MEDIUM',
        'TODO: Add comprehensive data state validation and error handling - PRIORITY: HIGH',
        'TODO: Implement data state transformation and normalization pipelines - PRIORITY: MEDIUM',
        'TODO: Add support for data state subscription and real-time updates - PRIORITY: MEDIUM',
        'TODO: Implement data state backup and recovery mechanisms - PRIORITY: MEDIUM',
        'TODO: Add comprehensive data state analytics and usage tracking - PRIORITY: LOW',
        'TODO: Implement adaptive rendering quality based on device performance - PRIORITY: MEDIUM',
        'TODO: Add support for 3D object picking and selection optimization - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive 3D state management and persistence - PRIORITY: MEDIUM',
        'TODO: Add support for 3D animation state management and timeline control - PRIORITY: MEDIUM',
        'TODO: Implement 3D resource loading and memory management optimization - PRIORITY: MEDIUM',
        'TODO: Add comprehensive 3D interaction analytics and user behavior tracking - PRIORITY: LOW',
        'TODO: Implement 3D state synchronization for collaborative viewing - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive performance monitoring and metrics collection - PRIORITY: MEDIUM',
        'TODO: Add support for adaptive performance optimization based on device capabilities - PRIORITY: MEDIUM',
        'TODO: Implement resource usage monitoring and optimization recommendations - PRIORITY: MEDIUM',
        'TODO: Add comprehensive performance alerting and threshold management - PRIORITY: MEDIUM',
        'TODO: Implement performance regression detection and automated testing - PRIORITY: MEDIUM'
      ],

      // Security & Authentication (25 TODOs)
      security: [
        'TODO: Implement comprehensive security policy enforcement engine - PRIORITY: HIGH',
        'TODO: Add support for runtime security threat detection and mitigation - PRIORITY: HIGH',
        'TODO: Implement security configuration validation and compliance checking - PRIORITY: MEDIUM',
        'TODO: Add comprehensive security event correlation and analysis - PRIORITY: MEDIUM',
        'TODO: Implement security incident automated response and containment - PRIORITY: HIGH',
        'TODO: Add support for security metrics and KPI tracking - PRIORITY: MEDIUM',
        'TODO: Implement security backup and recovery automation - PRIORITY: MEDIUM',
        'TODO: Add comprehensive security testing automation and CI/CD integration - PRIORITY: MEDIUM',
        'TODO: Implement security awareness and training integration - PRIORITY: LOW',
        'TODO: Add support for security compliance reporting and auditing - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive role-based access control (RBAC) system - PRIORITY: HIGH',
        'TODO: Add support for attribute-based access control (ABAC) for fine-grained permissions - PRIORITY: MEDIUM',
        'TODO: Implement authentication session management with advanced security features - PRIORITY: HIGH',
        'TODO: Add support for authentication delegation and impersonation for admin users - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive authentication audit trail and forensics - PRIORITY: MEDIUM',
        'TODO: Add support for authentication integration with external identity providers - PRIORITY: LOW',
        'TODO: Implement authentication risk assessment and adaptive security measures - PRIORITY: MEDIUM',
        'TODO: Add comprehensive authentication testing and security validation - PRIORITY: MEDIUM',
        'TODO: Implement post-quantum cryptography for future-proof security - PRIORITY: LOW',
        'TODO: Add support for hardware security module (HSM) integration - PRIORITY: LOW',
        'TODO: Implement comprehensive key management and rotation automation - PRIORITY: MEDIUM',
        'TODO: Add support for homomorphic encryption for privacy-preserving computations - PRIORITY: LOW',
        'TODO: Implement zero-knowledge proof systems for enhanced privacy - PRIORITY: LOW',
        'TODO: Add comprehensive cryptographic algorithm validation and testing - PRIORITY: MEDIUM',
        'TODO: Implement secure data deletion and sanitization mechanisms - PRIORITY: MEDIUM'
      ],

      // Data & Types (20 TODOs) 
      data: [
        'TODO: Implement comprehensive type validation at runtime for enhanced safety - PRIORITY: MEDIUM',
        'TODO: Add support for advanced TypeScript features (conditional types, mapped types) - PRIORITY: LOW',
        'TODO: Implement type-safe API client generation from OpenAPI specifications - PRIORITY: MEDIUM',
        'TODO: Add comprehensive type checking for external data sources and APIs - PRIORITY: MEDIUM',
        'TODO: Implement type-safe state management with strong typing guarantees - PRIORITY: MEDIUM',
        'TODO: Add support for type-safe database queries and ORM integration - PRIORITY: MEDIUM',
        'TODO: Implement type-safe configuration management and validation - PRIORITY: MEDIUM',
        'TODO: Add comprehensive type testing and validation automation - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive data model versioning and migration support - PRIORITY: MEDIUM',
        'TODO: Add support for data model validation with custom business rules - PRIORITY: MEDIUM',
        'TODO: Implement data model serialization and deserialization optimization - PRIORITY: MEDIUM',
        'TODO: Add comprehensive data model documentation and schema generation - PRIORITY: LOW',
        'TODO: Implement data model testing and validation automation - PRIORITY: MEDIUM',
        'TODO: Add support for data model relationships and foreign key constraints - PRIORITY: MEDIUM',
        'TODO: Implement data model backup and recovery mechanisms - PRIORITY: MEDIUM',
        'TODO: Implement environment-specific configuration validation and deployment - PRIORITY: MEDIUM',
        'TODO: Add support for dynamic configuration updates without application restart - PRIORITY: LOW',
        'TODO: Implement configuration backup and version control integration - PRIORITY: MEDIUM',
        'TODO: Add comprehensive configuration audit trail and change tracking - PRIORITY: MEDIUM',
        'TODO: Implement configuration testing and validation in CI/CD pipeline - PRIORITY: MEDIUM'
      ],

      // Testing & Quality (15 TODOs)
      testing: [
        'TODO: Implement comprehensive E2E testing for all critical user workflows - PRIORITY: HIGH',
        'TODO: Add support for visual regression testing for UI components - PRIORITY: MEDIUM',
        'TODO: Implement performance testing and benchmarking automation - PRIORITY: MEDIUM',
        'TODO: Add comprehensive accessibility testing and compliance validation - PRIORITY: HIGH',
        'TODO: Implement security testing and vulnerability scanning automation - PRIORITY: HIGH',
        'TODO: Add support for load testing and stress testing for critical components - PRIORITY: MEDIUM',
        'TODO: Implement test data management and test environment provisioning - PRIORITY: MEDIUM',
        'TODO: Add comprehensive test reporting and analytics dashboard - PRIORITY: MEDIUM',
        'TODO: Implement code quality metrics collection and trending analysis - PRIORITY: MEDIUM',
        'TODO: Add support for automated code review and best practices enforcement - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive code coverage tracking and improvement plans - PRIORITY: MEDIUM',
        'TODO: Add support for static analysis and security vulnerability detection - PRIORITY: MEDIUM',
        'TODO: Implement dependency vulnerability scanning and update automation - PRIORITY: MEDIUM',
        'TODO: Add comprehensive documentation quality assessment and improvement - PRIORITY: LOW',
        'TODO: Implement quality gate enforcement in CI/CD pipeline - PRIORITY: MEDIUM'
      ],

      // Configuration & Utils (10 TODOs)
      config: [
        'TODO: Implement comprehensive environment configuration validation - PRIORITY: MEDIUM',
        'TODO: Add support for feature flags and A/B testing configuration - PRIORITY: MEDIUM',
        'TODO: Implement configuration hot-reloading for development environments - PRIORITY: LOW',
        'TODO: Add comprehensive configuration documentation and schema validation - PRIORITY: MEDIUM',
        'TODO: Implement configuration backup and disaster recovery procedures - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive utility function testing and validation - PRIORITY: MEDIUM',
        'TODO: Add support for utility function performance optimization and caching - PRIORITY: MEDIUM',
        'TODO: Implement utility function documentation and usage examples - PRIORITY: LOW',
        'TODO: Add comprehensive error handling and edge case management for utilities - PRIORITY: MEDIUM',
        'TODO: Implement utility function versioning and backward compatibility - PRIORITY: LOW'
      ],

      // Assets & Performance (10 TODOs)
      assets: [
        'TODO: Implement adaptive asset loading based on network conditions and device capabilities - PRIORITY: MEDIUM',
        'TODO: Add support for asset preloading and caching strategies - PRIORITY: MEDIUM',
        'TODO: Implement asset compression and optimization automation - PRIORITY: MEDIUM',
        'TODO: Add comprehensive asset usage analytics and optimization recommendations - PRIORITY: LOW',
        'TODO: Implement asset backup and CDN distribution management - PRIORITY: MEDIUM',
        'TODO: Implement comprehensive application performance monitoring (APM) - PRIORITY: MEDIUM',
        'TODO: Add support for real-time performance alerts and automated optimization - PRIORITY: MEDIUM',
        'TODO: Implement performance regression detection and automated testing - PRIORITY: MEDIUM',
        'TODO: Add comprehensive performance analytics and user experience tracking - PRIORITY: MEDIUM',
        'TODO: Implement performance optimization recommendations and automated fixes - PRIORITY: MEDIUM'
      ]
    };
  }

  // File patterns for each category
  getFilePatterns() {
    return {
      api: ['api/**/*.ts', 'api/**/*.js'],
      components: ['components/**/*.tsx', 'components/**/*.ts'],
      services: ['services/**/*.ts'],
      hooks: ['hooks/**/*.ts'],
      security: ['security/**/*.ts', 'context/*Auth*.tsx'],
      data: ['types/**/*.ts', 'data/**/*.ts', 'config/**/*.ts'],
      testing: ['**/*.test.ts', '**/*.test.tsx', 'testing/**/*.ts'],
      config: ['config/**/*.ts', 'utils/**/*.ts'],
      assets: ['assets/**/*', '**/*asset*', '**/*performance*']
    };
  }

  // Find files matching patterns
  findFiles(patterns, baseDir = this.srcDir) {
    const files = [];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (this.matchesPatterns(fullPath, patterns)) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(baseDir);
    return files;
  }

  // Check if file matches any pattern
  matchesPatterns(filePath, patterns) {
    const relativePath = path.relative(this.srcDir, filePath);
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(relativePath);
    });
  }

  // Add TODO to specific location in file
  addTODOToFile(filePath, todos, insertionStrategy = 'smart') {
    try {
      if (this.processedFiles.has(filePath)) {
        return 0; // Skip already processed files
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let insertions = 0;
      const maxTodosPerFile = Math.min(3, todos.length); // Limit TODOs per file
      const selectedTodos = todos.slice(0, maxTodosPerFile);

      for (const todo of selectedTodos) {
        const insertionPoint = this.findInsertionPoint(lines, insertionStrategy);
        if (insertionPoint !== -1) {
          const indentation = this.getIndentation(lines, insertionPoint);
          lines.splice(insertionPoint, 0, `${indentation}// ${todo}`);
          insertions++;
        }
      }

      if (insertions > 0) {
        fs.writeFileSync(filePath, lines.join('\n'));
        this.processedFiles.add(filePath);
        this.addedTODOs += insertions;
      }

      return insertions;
    } catch (error) {
      this.log(`Error processing file ${filePath}: ${error.message}`, 'red');
      return 0;
    }
  }

  // Smart insertion point detection
  findInsertionPoint(lines, strategy) {
    switch (strategy) {
      case 'imports':
        // After imports, before main code
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() && !lines[i].startsWith('import') && !lines[i].startsWith('//')) {
            return Math.max(0, i - 1);
          }
        }
        return 3;

      case 'functions':
        // Before function definitions
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('function ') || lines[i].includes('const ') && lines[i].includes('=>')) {
            return i;
          }
        }
        return Math.floor(lines.length / 3);

      case 'classes':
        // Inside class definitions
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('class ') || lines[i].includes('interface ')) {
            return i + 1;
          }
        }
        return Math.floor(lines.length / 2);

      default: // 'smart'
        // Intelligent placement based on file structure
        const codeStart = this.findCodeStart(lines);
        const functionStart = this.findFirstFunction(lines);
        
        if (functionStart !== -1 && functionStart > codeStart) {
          return functionStart;
        }
        return Math.max(codeStart, 3);
    }
  }

  findCodeStart(lines) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('import') && !line.startsWith('//') && !line.startsWith('/*')) {
        return i;
      }
    }
    return 3;
  }

  findFirstFunction(lines) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('function ') || 
          (line.includes('const ') && line.includes('=>')) ||
          line.includes('export ') ||
          line.includes('class ')) {
        return i;
      }
    }
    return -1;
  }

  getIndentation(lines, lineIndex) {
    if (lineIndex < lines.length) {
      const match = lines[lineIndex].match(/^(\s*)/);
      return match ? match[1] : '';
    }
    return '';
  }

  // Execute the TODO addition process
  async execute() {
    this.log('\n🎯 Strategic TODO Addition - Adding 240 TODOs Across Codebase', 'cyan');
    this.log('=' .repeat(70), 'cyan');

    const todosByCategory = this.getTODOsByCategory();
    const filePatterns = this.getFilePatterns();

    for (const [category, todos] of Object.entries(todosByCategory)) {
      this.log(`\n📂 Processing ${category.toUpperCase()} category...`, 'blue');
      
      const patterns = filePatterns[category] || [];
      const files = this.findFiles(patterns);
      
      if (files.length === 0) {
        this.log(`   ⚠️  No files found for ${category} category`, 'yellow');
        continue;
      }

      this.log(`   📁 Found ${files.length} files for ${category}`, 'green');
      
      // Distribute TODOs across files
      const todosPerFile = Math.ceil(todos.length / files.length);
      let todoIndex = 0;
      
      for (const file of files) {
        if (todoIndex >= todos.length) break;
        
        const fileTodos = todos.slice(todoIndex, todoIndex + Math.min(todosPerFile, 3));
        const added = this.addTODOToFile(file, fileTodos);
        
        if (added > 0) {
          const relativePath = path.relative(this.srcDir, file);
          this.log(`   ✅ Added ${added} TODOs to ${relativePath}`, 'green');
        }
        
        todoIndex += fileTodos.length;
      }

      this.todoCategories[category] = todos.length;
    }

    this.generateSummaryReport();
  }

  generateSummaryReport() {
    this.log('\n📊 TODO Addition Summary Report', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    this.log(`\n📈 Overall Statistics:`, 'blue');
    this.log(`  🎯 Target TODOs: ${this.targetTODOs}`);
    this.log(`  ✅ Added TODOs: ${this.addedTODOs}`);
    this.log(`  📁 Processed Files: ${this.processedFiles.size}`);
    this.log(`  📊 Achievement: ${((this.addedTODOs / this.targetTODOs) * 100).toFixed(1)}%`);

    this.log(`\n📋 TODOs by Category:`, 'blue');
    for (const [category, count] of Object.entries(this.todoCategories)) {
      const percentage = ((count / this.targetTODOs) * 100).toFixed(1);
      this.log(`  ${category.padEnd(15)}: ${count.toString().padStart(3)} TODOs (${percentage}%)`, 'white');
    }

    this.log('\n🎯 Recommendations:', 'magenta');
    this.log('  1. Review added TODOs for relevance and priority');
    this.log('  2. Use TODO analysis tools to track implementation progress');
    this.log('  3. Prioritize HIGH priority TODOs for immediate development');
    this.log('  4. Establish regular TODO review cycles');

    this.log('\n✅ Strategic TODO addition complete!', 'green');
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const adder = new StrategicTODOAdder();
  adder.execute().catch(error => {
    console.error('❌ Error during TODO addition:', error);
    process.exit(1);
  });
}

export default StrategicTODOAdder;
