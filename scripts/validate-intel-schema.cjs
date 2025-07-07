#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sync: globSync } = require('glob');
const matter = require('gray-matter');
const Ajv = require('ajv');

// Load canonical schema
const schemaPath = path.resolve(__dirname, '../docs/audit/INTEL-REPORT-SCHEMA.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
let hasErrors = false;

function validateObject(obj, source) {
  const valid = validate(obj);
  if (!valid && validate.errors) {
    console.error(`\n[ERROR] Validation failed for ${source}:`);
    validate.errors.forEach(err => {
      const instPath = err.instancePath || err.dataPath || '';
      console.error(`  - ${instPath} ${err.message}`);
    });
    hasErrors = true;
  } else {
    console.log(`[OK] ${source}`);
  }
}

// 1. Validate Markdown front-matter in archived reports
const mdPattern = path.resolve(__dirname, '../docs/archived/*intel*-*.md');
const mdFiles = globSync(mdPattern);
console.log(`\nValidating ${mdFiles.length} Markdown report(s)...`);
mdFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);
    validateObject(data, `Markdown front-matter in ${path.basename(file)}`);
  } catch (err) {
    console.error(`[ERROR] Failed to process ${file}: ${err.message}`);
    hasErrors = true;
  }
});

// 2. Validate JSON artifacts in cache directory
const summaryPath = path.resolve(__dirname, '../cache/code-summary.json');
if (fs.existsSync(summaryPath)) {
  console.log(`\nValidating JSON artifact: code-summary.json`);
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    if (Array.isArray(summary.intelReports)) {
      summary.intelReports.forEach((report, idx) => {
        validateObject(report, `cache/code-summary.json [intelReports][${idx}]`);
      });
    } else {
      console.warn('[WARN] No intelReports array found in code-summary.json');
    }
  } catch (err) {
    console.error(`[ERROR] Failed to parse code-summary.json: ${err.message}`);
    hasErrors = true;
  }
}

// Exit code
if (hasErrors) {
  console.error('\nIntel report schema validation completed with errors.');
  process.exit(1);
} else {
  console.log('\nIntel report schema validation completed successfully.');
  process.exit(0);
}
