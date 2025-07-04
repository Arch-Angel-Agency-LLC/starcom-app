/**
 * validate-chat-migration.js
 * 
 * Script to validate the chat consolidation migration progress.
 * Performs checks on unified components and adapters to ensure they're
 * properly implemented and following best practices.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Components that should be using the unified chat system
const unifiedComponentPaths = [
  'src/components/Collaboration/CollaborationPanel-unified.tsx',
  'src/components/Collaboration/GroupChatPanel-unified.tsx',
  'src/components/Collaboration/CommunicationPanel-unified.tsx',
  'src/components/Collaboration/EarthAllianceCommunicationPanel-unified.tsx',
  'src/components/SecureChat/SecureChatWindow-unified.tsx',
  'src/components/Integration/IPFSNostrDashboard-unified.tsx',
  'src/components/Teams/DecentralizedCollabPanel.tsx'
];

// Required imports for unified components
const requiredImports = [
  { pattern: 'import.*useChat.*from.*\\/context\\/ChatContext', description: 'useChat hook' },
  { pattern: 'const.*chat.*=.*useChat\\(\\)', description: 'useChat initialization' }
];

// Best practices patterns to check for
const bestPractices = [
  { 
    pattern: 'chat\\.connect\\(', 
    description: 'Using chat.connect() method' 
  },
  { 
    pattern: 'chat\\.setCurrentChannel\\(', 
    description: 'Using chat.setCurrentChannel() method' 
  },
  { 
    pattern: 'chat\\.sendMessage\\(', 
    description: 'Using chat.sendMessage() method' 
  },
  { 
    pattern: 'chat\\.isConnected', 
    description: 'Checking chat.isConnected state' 
  },
  { 
    pattern: 'useMemo\\(\\s*\\(\\)\\s*=>\\s*{[\\s\\S]*?return[\\s\\S]*?}\\s*,\\s*\\[[^\\]]*\\]\\)', 
    description: 'Using useMemo for derived values' 
  },
  { 
    pattern: 'typeof\\s+[a-zA-Z0-9]+\\.[a-zA-Z0-9]+\\s*===\\s*[\'"]function[\'"]', 
    description: 'Using feature detection for optional methods' 
  }
];

// Files to analyze for adapter quality
const adapterFiles = [
  'src/lib/chat/adapters/GunChatAdapter.ts',
  'src/lib/chat/adapters/NostrChatAdapter.ts',
  'src/lib/chat/adapters/SecureChatAdapter.ts'
];

// Adapter code quality checks
const adapterQualityChecks = [
  { 
    pattern: 'implements\\s+ChatProvider', 
    description: 'Properly implements ChatProvider interface' 
  },
  { 
    pattern: 'console\\.warn\\([\'"].*method\\s+not\\s+available[\'"]\\)', 
    description: 'Provides warnings for unavailable methods' 
  },
  { 
    pattern: 'try\\s*{[\\s\\S]*?}\\s*catch\\s*\\(error\\)\\s*{', 
    description: 'Uses proper error handling' 
  },
  {
    pattern: 'typeof\\s+[a-zA-Z0-9]+\\.[a-zA-Z0-9]+\\s*===\\s*[\'"]function[\'"]', 
    description: 'Uses feature detection for optional methods'
  }
];

async function validateFile(filepath, patterns) {
  try {
    const content = await readFile(filepath, 'utf8');
    const results = [];
    
    for (const { pattern, description } of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(content)) {
        results.push({
          pattern: description,
          found: true
        });
      } else {
        results.push({
          pattern: description,
          found: false
        });
      }
    }
    
    return results;
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err.message);
    return [];
  }
}

async function main() {
  try {
    console.log('======= Chat Consolidation Migration Validation =======\n');
    
    // Validate unified components
    console.log('Checking unified components...\n');
    
    for (const componentPath of unifiedComponentPaths) {
      const fullPath = path.resolve(process.cwd(), componentPath);
      
      console.log(`Component: ${componentPath}`);
      
      try {
        if (fs.existsSync(fullPath)) {
          // Check required imports
          const importResults = await validateFile(fullPath, requiredImports);
          console.log('  Required imports:');
          for (const result of importResults) {
            console.log(`    ${result.found ? '✅' : '❌'} ${result.pattern}`);
          }
          
          // Check best practices
          const practiceResults = await validateFile(fullPath, bestPractices);
          console.log('  Best practices:');
          for (const result of practiceResults) {
            console.log(`    ${result.found ? '✅' : '⚠️'} ${result.pattern}`);
          }
        } else {
          console.log('  ❌ File not found');
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
      
      console.log('');
    }
    
    // Validate adapters
    console.log('Checking adapters...\n');
    
    for (const adapterPath of adapterFiles) {
      const fullPath = path.resolve(process.cwd(), adapterPath);
      
      console.log(`Adapter: ${adapterPath}`);
      
      try {
        if (fs.existsSync(fullPath)) {
          const adapterResults = await validateFile(fullPath, adapterQualityChecks);
          for (const result of adapterResults) {
            console.log(`  ${result.found ? '✅' : '❌'} ${result.pattern}`);
          }
        } else {
          console.log('  ❌ File not found');
        }
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
      
      console.log('');
    }
    
    console.log('Validation complete!');
    
  } catch (err) {
    console.error('Error during validation:', err);
  }
}

main();
