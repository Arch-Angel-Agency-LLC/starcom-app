import { describe, it, expect, beforeEach } from 'vitest';
import { publishBotIntelOutput } from '../IntelReport';
import type { BotIntelOutput } from '../../types/BotMission';
import { intelReportService } from '../../../../services/intel/IntelReportService';

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

describe('publishBotIntelOutput', () => {
  beforeEach(resetWorkspace);

  it('publishes all BotIntelReport entries via intelReportService', async () => {
    const output: BotIntelOutput = {
      missionId: 'm1',
      botId: 'botA',
      generatedAt: Date.now(),
      intel: [],
      reports: [
        {
          id: 'r1', title: 'R1', summary: 'S1', content: 'C1', reportType: 'operational',
          targetAudience: ['ops'], keyFindings: ['f1'], recommendations: ['rec1'], sourceIntel: ['i1']
        },
        {
          id: 'r2', title: 'R2', summary: 'S2', content: 'C2', reportType: 'strategic',
          targetAudience: ['exec'], keyFindings: ['f2'], recommendations: ['rec2'], sourceIntel: ['i2']
        }
      ],
      alerts: [],
      sourceData: [],
      processingSteps: [],
      qualityAssessment: {
        overallQuality: 1, accuracyScore: 1, relevanceScore: 1, freshnessScore: 1,
        completenessScore: 1, reliabilityScore: 1, detailedAssessment: '', improvementSuggestions: []
      },
      overallConfidence: 0.9,
      sourceReliability: 'A',
      verificationStatus: 'verified'
    };

  const created = await publishBotIntelOutput(output, 'Bot A');
    expect(created.length).toBe(2);
    const list = await intelReportService.listReports();
    expect(list.some(r => r.title === 'R1')).toBe(true);
    expect(list.some(r => r.title === 'R2')).toBe(true);
  // Migration aid fields attached
  expect(output.publishedReports?.length).toBe(2);
  expect(output.publishedAt instanceof Date).toBe(true);
  });
});
