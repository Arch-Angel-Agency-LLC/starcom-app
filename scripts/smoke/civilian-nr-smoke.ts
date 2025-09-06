#!/usr/bin/env tsx
/**
 * Civilian NetRunner smoke test
 * Verifies key declassified paths run at runtime without classification/clearance.
 */
import { ModelTransformers } from '../../src/applications/netrunner/models/ModelUtils';
import { IntelType, SourceType, OSINTDataItem } from '../../src/applications/netrunner/models/OSINTDataModels';
import { IntelReportBuilder } from '../../src/applications/netrunner/models/IntelReport';
import { basicIntelWorkflows, createWorkflowFromTemplate, createIntelReportFromWorkflow } from '../../src/applications/netrunner/integration/IntelAnalyzerIntegration';

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`[SMOKE] Assertion failed: ${msg}`);
}

(async () => {
  console.log('[SMOKE] Starting Civilian NetRunner smoke test');

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

  // 3) Integration workflow -> IntelReport
  const template = basicIntelWorkflows[0];
  const wf = createWorkflowFromTemplate(template, 'WF Smoke', 'WF description');
  const fromWorkflow = createIntelReportFromWorkflow(wf, 'tester', 'Tester');
  assert(fromWorkflow.id && fromWorkflow.status === 'draft', 'Workflow-generated report OK');
  assert(!('classification' in (fromWorkflow as any)), 'Workflow report has no classification');

  console.log('[SMOKE] PASS: Civilian NetRunner basic runtime checks succeeded');
})();
