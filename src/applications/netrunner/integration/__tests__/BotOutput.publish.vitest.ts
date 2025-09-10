import { describe, it, expect, beforeEach } from 'vitest';
import { publishBotOutputReports } from '../IntelAnalyzerIntegration';
import type { BotIntelOutput } from '../../types/BotMission';
import { intelReportService } from '../../../../services/intel/IntelReportService';

function resetWorkspace() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
}

describe('publishBotOutputReports', () => {
  beforeEach(resetWorkspace);

  it('publishes bot output reports and returns IntelReportUI list', async () => {
    const output: BotIntelOutput = {
      missionId: 'm1',
      botId: 'botA',
      generatedAt: Date.now(),
      intel: [],
      reports: [
        { id: 'b1', title: 'B1', summary: 'S1', content: 'C1', reportType: 'tactical', targetAudience: [], keyFindings: [], recommendations: [], sourceIntel: [] }
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

    const created = await publishBotOutputReports(output, 'Bot A');
    expect(created.length).toBe(1);
    expect(created[0].title).toBe('B1');
    const list = await intelReportService.listReports();
    expect(list.some(r => r.title === 'B1')).toBe(true);
  });
});
