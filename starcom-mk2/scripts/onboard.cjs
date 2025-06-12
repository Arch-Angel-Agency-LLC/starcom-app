#!/usr/bin/env node
// Onboarding script for Copilot: generates code-summary.json and code-health.json
// Usage: node scripts/onboard.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ARTIFACTS = path.join(ROOT, 'artifacts');
const DOCS = path.join(ROOT, 'docs');
const CACHE = path.join(ROOT, 'cache');

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function extractComments(file, patterns) {
  const content = fs.readFileSync(file, 'utf8');
  const results = {};
  for (const key in patterns) {
    results[key] = [];
    const regex = new RegExp(patterns[key], 'g');
    let match;
    while ((match = regex.exec(content))) {
      results[key].push({ line: content.substr(0, match.index).split('\n').length, text: match[0] });
    }
  }
  return results;
}

// Utility to get immediate subfolders (not files) of a directory
function getImmediateSubfolders(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => {
    const full = path.join(dir, f);
    return fs.statSync(full).isDirectory() && !f.startsWith('.');
  });
}

// Utility to get immediate subfolders/files of a directory
function getImmediateChildren(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
}

// Utility to get immediate files of a directory
function getImmediateFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => {
    const full = path.join(dir, f);
    return fs.statSync(full).isFile() && !f.startsWith('.');
  });
}

function summarizeStructure() {
  const files = walk(SRC);
  const summary = files.map(f => path.relative(ROOT, f));
  return { files: summary };
}

function summarizeStructureV2() {
  // Only top-level folders and their immediate subfolders/files
  const structure = {};
  // src
  structure.src = getImmediateChildren(SRC);
  // scripts
  structure.scripts = getImmediateChildren(path.join(ROOT, 'scripts'));
  // docs
  structure.docs = getImmediateChildren(path.join(ROOT, 'docs'));
  // public
  structure.public = getImmediateChildren(path.join(ROOT, 'public'));
  // rust (list only top-level folders)
  const rustDir = path.join(ROOT, 'rust');
  structure.rust = getImmediateChildren(rustDir);
  return structure;
}

function summarizeStructureV3() {
  const structure = {};
  structure.src = getImmediateSubfolders(SRC);
  structure.scripts = getImmediateChildren(path.join(ROOT, 'scripts'));
  structure.docs = getImmediateChildren(path.join(ROOT, 'docs'));
  structure.public = getImmediateChildren(path.join(ROOT, 'public'));
  structure.rust = getImmediateSubfolders(path.join(ROOT, 'rust'));
  return structure;
}

function summarizeStructureV4() {
  const structure = {};
  // Only include non-empty subfolder arrays
  const src = getImmediateSubfolders(SRC);
  if (src.length) structure.src = src;
  const scripts = getImmediateSubfolders(path.join(ROOT, 'scripts'));
  if (scripts.length) structure.scripts = scripts;
  const docs = getImmediateSubfolders(path.join(ROOT, 'docs'));
  if (docs.length) structure.docs = docs;
  const publicDir = getImmediateSubfolders(path.join(ROOT, 'public'));
  if (publicDir.length) structure.public = publicDir;
  const rust = getImmediateSubfolders(path.join(ROOT, 'rust'));
  if (rust.length) structure.rust = rust;
  return structure;
}

function truncateList(arr, max = 10) {
  if (arr.length > max) return arr.slice(0, max).concat('...truncated');
  return arr;
}

function summarizeStructureFinal() {
  const structure = {};
  // src: only subfolders, truncated
  const src = truncateList(getImmediateSubfolders(SRC), 10);
  if (src.length) structure.src = src;
  // scripts: only files
  const scripts = getImmediateFiles(path.join(ROOT, 'scripts'));
  if (scripts.length) structure.scripts = scripts;
  // docs: only files
  const docs = getImmediateFiles(path.join(ROOT, 'docs'));
  if (docs.length) structure.docs = docs;
  // public: only files
  const publicDir = getImmediateFiles(path.join(ROOT, 'public'));
  if (publicDir.length) structure.public = publicDir;
  // rust: only subfolders, truncated
  const rust = truncateList(getImmediateSubfolders(path.join(ROOT, 'rust')), 10);
  if (rust.length) structure.rust = rust;
  return structure;
}

function summarizeArtifacts() {
  if (!fs.existsSync(ARTIFACTS)) return [];
  return walk(ARTIFACTS).map(f => path.relative(ROOT, f));
}

function summarizeArtifactsV2() {
  // Only top-level artifacts
  return getImmediateChildren(ARTIFACTS).filter(f => f.endsWith('.artifact'));
}

function summarizeDocs() {
  if (!fs.existsSync(DOCS)) return [];
  return walk(DOCS).map(f => path.relative(ROOT, f));
}

function collectTodosAndNotes() {
  const files = walk(SRC);
  const todos = [];
  const aiNotes = [];
  files.forEach(f => {
    const comments = extractComments(f, {
      TODO: 'TODO:.*',
      AI_NOTE: 'AI-NOTE:.*'
    });
    comments.TODO.forEach(c => todos.push({ file: path.relative(ROOT, f), ...c }));
    comments.AI_NOTE.forEach(c => aiNotes.push({ file: path.relative(ROOT, f), ...c }));
  });
  return { todos, aiNotes };
}

function runLint() {
  try {
    execSync('npx eslint src --format json -o cache/eslint-report.json', { cwd: ROOT, stdio: 'ignore' });
    const report = JSON.parse(fs.readFileSync(path.join(CACHE, 'eslint-report.json'), 'utf8'));
    return { success: true, errorCount: report.reduce((a, f) => a + f.errorCount, 0) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function runTests() {
  try {
    execSync('npx vitest run --reporter=json --outputFile=cache/vitest-report.json', { cwd: ROOT, stdio: 'ignore' });
    const report = JSON.parse(fs.readFileSync(path.join(CACHE, 'vitest-report.json'), 'utf8'));
    return { success: true, numFailed: report.numFailedTests || 0 };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getAiHints() {
  return {
    mainAppDir: 'src',
    contractsDir: 'src/contracts',
    docsDir: 'docs',
    entryPoints: ['src/App.tsx', 'src/main.tsx']
  };
}

function main() {
  if (process.env.AI_AGENT === '1') {
    // AI agent mode: force non-interactive, no prompts, no confirmations
    // (No prompts exist, but this is a future-proof hook)
  }
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);
  // code-summary.json (improved, folders only)
  const codeSummary = {
    version: '1.0.0',
    structure: summarizeStructureFinal(),
    artifacts: summarizeArtifactsV2(),
    aiHints: getAiHints(),
    generatedAt: new Date().toISOString()
  };
  const summaryStr = JSON.stringify(codeSummary, null, 2);
  // Enforce size limit: 50 lines or 4KB
  const lineCount = summaryStr.split('\n').length;
  const byteSize = Buffer.byteLength(summaryStr, 'utf8');
  if (lineCount > 50 || byteSize > 4096) {
    throw new Error(`code-summary.json exceeds size limit: ${lineCount} lines, ${byteSize} bytes. Reduce detail.`);
  }
  fs.writeFileSync(path.join(CACHE, 'code-summary.json'), summaryStr);

  // code-health.json
  const { todos, aiNotes } = collectTodosAndNotes();
  const lint = runLint();
  const test = runTests();
  const codeHealth = {
    lint,
    test,
    todos,
    aiNotes,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(CACHE, 'code-health.json'), JSON.stringify(codeHealth, null, 2));

  // Print summary
  console.log('Onboarding complete!');
  console.log('- cache/code-summary.json generated');
  console.log('- cache/code-health.json generated');
  if (!lint.success) console.log('Lint failed:', lint.error);
  if (!test.success) console.log('Tests failed:', test.error);
}

main();
