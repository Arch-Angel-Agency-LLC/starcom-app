#!/usr/bin/env tsx
/**
 * Civilian NetRunner smoke test
 * Verifies key declassified paths run at runtime without classification/clearance.
 */
import { ModelTransformers } from '../../src/applications/netrunner/models/ModelUtils';
import { IntelType, SourceType, OSINTDataItem } from '../../src/applications/netrunner/models/OSINTDataModels';
import { IntelReportBuilder } from '../../src/applications/netrunner/models/IntelReport';
import { basicIntelWorkflows, createWorkflowFromTemplate } from '../../src/applications/netrunner/integration/IntelAnalyzerIntegration';
import { buildCreateIntelReportInput } from '../../src/applications/netrunner/models/IntelReport';
import { intelReportService } from '../../src/services/intel/IntelReportService';

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`[SMOKE] Assertion failed: ${msg}`);
}

(async () => {
  console.log('[SMOKE] Starting Civilian NetRunner smoke test');

  // Polyfill localStorage for intelWorkspaceManager in Node (non-browser) context
  if (typeof globalThis.localStorage === 'undefined') {
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
      key: (i: number) => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; }
    } as any;
  }

  // 1) Create OSINT item and DTO
  const item: OSINTDataItem = ModelTransformers.createOSINTDataItem({
    type: 'identity' as IntelType,
    sourceType: 'public_web' as SourceType,
    sourceName: 'Example Source',
    collectedBy: 'tester',
    content: { example: true },
    metadata: { confidence: 88, tags: ['demo'] }
  });
  assert(item.id && item.type === 'identity' && item.sourceType === 'public_web', 'OSINTDataItem shape');
  // Ensure no classification field present
  assert(!('classification' in item as any), 'No classification field on OSINTDataItem');

  const dto = ModelTransformers.createTransferDTO([item], 'tool-output', {});
  assert(dto.transferId && dto.data.items.length === 1, 'Transfer DTO basic shape');
  assert(!('security' in dto) || dto.security === undefined || typeof dto.security === 'object', 'DTO optional security ok');

  // 2) Build IntelReport with builder
  const builder = new IntelReportBuilder('Demo Report', 'tester');
  const report = builder
    .setDescription('Demo description')
    .addTag('demo')
    .setConfidence(0.75)
    .setSummary('Summary')
    .setContent('Body')
    .build();
  assert(report.title === 'Demo Report' && report.author === 'tester', 'IntelReport basic fields');
  assert(!('classification' in (report as any)), 'IntelReport has no classification');

  // 3) Integration workflow -> canonical IntelReportUI (service-based)
  const template = basicIntelWorkflows[0];
  const wf = createWorkflowFromTemplate(template, 'WF Smoke', 'WF description');
  // Build CreateIntelReportInput directly (migration away from deprecated createIntelReportFromWorkflow)
  const wfInput = buildCreateIntelReportInput({
    title: wf.name,
    content: '',
    summary: wf.description,
    category: 'general',
    tags: wf.tags,
    confidence: 0
  });
  const createdViaService = await intelReportService.createReport(wfInput, 'Tester');
  assert(createdViaService.id && createdViaService.status === 'DRAFT', 'Workflow-generated UI report OK');
  // Civilian build: classification should default to UNCLASSIFIED
  assert(createdViaService.classification === 'UNCLASSIFIED', 'UI report classification default');

  console.log('[SMOKE] PASS: Civilian NetRunner basic runtime checks succeeded');
})();
