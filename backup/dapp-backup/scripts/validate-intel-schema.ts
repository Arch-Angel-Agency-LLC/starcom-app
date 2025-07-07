#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { sync as globSync } from 'glob';
import * as matter from 'gray-matter'; // @ts-ignore: no type declarations for gray-matter
import Ajv, { ValidateFunction } from 'ajv';

// Load canonical schema
const schemaPath = path.resolve(__dirname, '../docs/audit/INTEL-REPORT-SCHEMA.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true });
const validate: ValidateFunction = ajv.compile(schema);
let hasErrors = false;

function validateObject(obj: any, source: string) {
  const valid = validate(obj);
  if (!valid && validate.errors) {
    console.error(`\n[ERROR] Validation failed for ${source}:`);
    for (const err of validate.errors) {
      const instPath = ((err as any).instancePath as string) || ((err as any).dataPath as string) || '';
      console.error(`  - ${instPath} ${err.message}`);
    }
    hasErrors = true;
  } else {
    console.log(`[OK] ${source}`);
  }
}

// 1. Validate Markdown front-matter in archived reports
const mdPattern = path.resolve(__dirname, '../docs/archived/*intel*-*.md');
const mdFiles = globSync(mdPattern);
console.log(`\nValidating ${mdFiles.length} Markdown report(s)...`);
for (const file of mdFiles) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);
    validateObject(data, `Markdown front-matter in ${path.basename(file)}`);
  } catch (err) {
    console.error(`[ERROR] Failed to process ${file}: ${(err as Error).message}`);
    hasErrors = true;
  }
}

// 2. Validate JSON artifacts in cache directory
const jsonPattern = path.resolve(__dirname, '../cache/code-summary.json');
if (fs.existsSync(jsonPattern)) {
  console.log(`\nValidating JSON artifact: code-summary.json`);
  try {
    const summary = JSON.parse(fs.readFileSync(jsonPattern, 'utf-8'));
    if (Array.isArray(summary.intelReports)) {
      summary.intelReports.forEach((report: any, idx: number) => {
        validateObject(report, `cache/code-summary.json [intelReports][${idx}]`);
      });
    } else {
      console.warn('[WARN] No intelReports array found in code-summary.json');
    }
  } catch (err) {
    console.error(`[ERROR] Failed to parse code-summary.json: ${(err as Error).message}`);
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
