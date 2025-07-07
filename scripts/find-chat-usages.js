/**
 * find-chat-usages.js
 * 
 * Script to find all components still using legacy chat services or hooks.
 * This helps identify remaining migration tasks.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Legacy chat patterns to search for
const patterns = [
  { pattern: 'import.*useDecentralizedChat', description: 'Legacy useDecentralizedChat hook' },
  { pattern: 'import.*DecentralizedChatWindow', description: 'Legacy DecentralizedChatWindow component' },
  { pattern: 'import.*nostrService', description: 'Direct NostrService import' },
  { pattern: 'import.*SecureChatIntegrationService', description: 'Direct SecureChatIntegrationService import' },
  { pattern: 'import.*SecureChatContext', description: 'Legacy SecureChatContext' },
  { pattern: 'import.*useSecureChat', description: 'Legacy useSecureChat hook' },
  { pattern: 'gun\\.get\\([\'"]starcom-chat', description: 'Direct Gun.js chat access' },
];

// Files/directories to exclude
const excludes = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'target',
  'lib/chat', // Exclude the new chat system itself
  'find-chat-usages.js',
];

// File extensions to check
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

async function isDirectory(filepath) {
  try {
    const stats = await stat(filepath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

async function findFiles(dir, results = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filepath = path.join(dir, file);
    
    // Skip excluded directories
    if (excludes.some(exclude => filepath.includes(exclude))) {
      continue;
    }
    
    if (await isDirectory(filepath)) {
      // Recursively scan subdirectories
      await findFiles(filepath, results);
    } else if (extensions.includes(path.extname(file))) {
      // Add matching files
      results.push(filepath);
    }
  }
  
  return results;
}

async function checkFile(filepath, results) {
  try {
    const content = await readFile(filepath, 'utf8');
    
    for (const { pattern, description } of patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(content)) {
        results.push({
          file: filepath,
          pattern: description
        });
      }
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err.message);
  }
}

async function main() {
  try {
    // Get the src directory
    const srcDir = path.resolve(process.cwd(), 'src');
    
    console.log(`Scanning for legacy chat usage in ${srcDir}...`);
    
    // Find all files
    const files = await findFiles(srcDir);
    const results = [];
    
    // Check each file
    for (const file of files) {
      await checkFile(file, results);
    }
    
    // Group results by file
    const groupedResults = {};
    for (const { file, pattern } of results) {
      if (!groupedResults[file]) {
        groupedResults[file] = [];
      }
      if (!groupedResults[file].includes(pattern)) {
        groupedResults[file].push(pattern);
      }
    }
    
    // Print results
    console.log('\nComponents still using legacy chat code:');
    console.log('=======================================\n');
    
    Object.entries(groupedResults).forEach(([file, patterns]) => {
      console.log(`File: ${file.replace(process.cwd(), '')}`);
      patterns.forEach(pattern => {
        console.log(`  - ${pattern}`);
      });
      console.log('');
    });
    
    console.log(`Found ${Object.keys(groupedResults).length} files with legacy chat usage.`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

// Run the script
main();
