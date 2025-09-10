import { describe, it, expect } from 'vitest';
import { toCreateIntelReportInputFromBot } from '../IntelReport';
import type { BotIntelReport } from '../../types/BotMission';

describe('BotIntelReport adapters', () => {
  it('maps BotIntelReport to CreateIntelReportInput', () => {
    const bot: BotIntelReport = {
      id: 'bot-1',
      title: 'Bot Report',
      summary: 'S',
      content: 'C',
      reportType: 'tactical',
      targetAudience: ['ops'],
      keyFindings: ['f1'],
      recommendations: ['r1'],
      sourceIntel: ['src1']
    };
    const input = toCreateIntelReportInputFromBot(bot);
    expect(input.title).toBe('Bot Report');
    expect(input.category).toBe('tactical');
    expect(input.summary).toBe('S');
    expect(input.conclusions).toEqual(['f1']);
    expect(input.recommendations).toEqual(['r1']);
    expect(input.targetAudience).toEqual(['ops']);
    expect(input.sourceIntelIds).toEqual(['src1']);
    expect(input.classification).toBe('UNCLASSIFIED');
    expect(input.status).toBe('DRAFT');
  });
});
