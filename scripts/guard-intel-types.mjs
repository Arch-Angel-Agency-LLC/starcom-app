#!/usr/bin/env node
// Guard script: prevent declaring IntelReport types/interfaces outside canonical folders
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { sync: globSync } = require('glob');

const allowedDirs = [
  'src/types/intel',
  'src/models/Intel',
];

function isAllowed(file) {
  const f = file.replaceAll('\\', '/');
  return allowedDirs.some((dir) => f.startsWith(dir + '/'));
}

const IGNORE = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  'public/**',
  '.git/**',
  'storybook-static/**',
];

// Detect disallowed local intel report interface/type declarations (base names)
const DECL_RE = /\b(?:export\s+)?(?:interface|type)\s+(IntelReport|LegacyIntelReport|NetRunnerIntelReport)\b/;

let violations = [];

const files = globSync('**/*.{ts,tsx}', { ignore: IGNORE });
for (const file of files) {
  if (isAllowed(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (DECL_RE.test(text)) {
    violations.push(file);
  }
}

if (violations.length) {
  console.error('\nIntel guard failed: Found disallowed local Intel report declarations in non-canonical files:');
  for (const v of violations) console.error(' - ' + v);
  console.error('\nAllowed locations:', allowedDirs.join(', '));
  console.error('\nNames flagged:', 'IntelReport, LegacyIntelReport, NetRunnerIntelReport');
  console.error('\nAction: Replace with IntelReportUI import (see docs/intel/systemIntegration/01-integration-cookbook.md)');
  process.exit(1);
} else {
  console.log('Intel guard passed: no local IntelReport declarations found.');
}
