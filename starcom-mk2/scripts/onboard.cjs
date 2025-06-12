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

function summarizeStructure() {
  const files = walk(SRC);
  const summary = files.map(f => path.relative(ROOT, f));
  return { files: summary };
}

function summarizeArtifacts() {
  if (!fs.existsSync(ARTIFACTS)) return [];
  return walk(ARTIFACTS).map(f => path.relative(ROOT, f));
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

function main() {
  if (process.env.AI_AGENT === '1') {
    // AI agent mode: force non-interactive, no prompts, no confirmations
    // (No prompts exist, but this is a future-proof hook)
  }
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);
  // code-summary.json
  const codeSummary = {
    structure: summarizeStructure(),
    artifacts: summarizeArtifacts(),
    docs: summarizeDocs(),
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(CACHE, 'code-summary.json'), JSON.stringify(codeSummary, null, 2));

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
