import type { ComposeInput } from '../../exchange/types';
import type { IntelReportUI } from '../../../types/intel/IntelReportUI';

export function composeInputFromDraft(report: IntelReportUI): ComposeInput {
  return {
    name: report.title || `Draft ${report.id}`,
    description: report.summary || 'Draft exported from IntelAnalyzer',
    classification: report.classification,
    license: 'OPEN',
    author: report.author || 'Analyst',
    reports: [{ id: report.id, title: report.title || report.id, content: report.content }],
    intel: [],
    assets: [],
  analysisDeepLink: report.analysisDeepLink,
  };
}
