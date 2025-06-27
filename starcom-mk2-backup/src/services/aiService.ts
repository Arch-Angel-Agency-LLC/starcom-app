/**
 * AI Co-Investigator Service Layer
 * Handles AI engine interactions and data processing
 */

import type {
  AIInsight,
  ThreatIndicator,
  ActionRecommendation,
  ThreatSeverity,
  InsightType,
  ConfidenceLevel
} from '../types';

// ===== MOCK DATA GENERATORS =====

/**
 * Generate realistic threat indicators for demonstration
 */
export const generateMockThreatIndicators = (): ThreatIndicator[] => {
  const baseTime = Date.now();
  const threats: ThreatIndicator[] = [
    {
      id: `threat-${baseTime}-001`,
      threatType: 'CYBER',
      severity: 'HIGH',
      confidence: 0.87,
      title: 'Distributed DDoS Campaign Detected',
      description: 'Multi-vector DDoS attack targeting critical infrastructure across 15 countries',
      geolocation: { latitude: 37.7749, longitude: -122.4194, region: 'North America' },
      timeframe: {
        start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        end: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        duration: 6 * 60 * 60 * 1000
      },
      relatedThreats: [`threat-${baseTime}-002`, `threat-${baseTime}-005`],
      estimatedImpact: {
        scope: 'GLOBAL',
        timelineToImpact: 2,
        estimatedDamage: 'Service disruption affecting 2.3M users',
        criticalAssets: ['DNS Infrastructure', 'CDN Networks', 'Banking Systems'],
        affectedContexts: ['PLANETARY']
      },
      recommendedResponse: [
        'Activate emergency response protocols',
        'Coordinate with international partners',
        'Deploy additional mitigation resources'
      ],
      dataPoints: [
        {
          source: 'SIEM-Alpha',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          value: 85.3,
          type: 'attack_intensity',
          metadata: { source_ips: 1247, target_ports: 15 }
        }
      ]
    },
    {
      id: `threat-${baseTime}-002`,
      threatType: 'SPACE',
      severity: 'CRITICAL',
      confidence: 0.92,
      title: 'Satellite Communication Interference',
      description: 'Coordinated jamming of GPS and communication satellites in LEO',
      geolocation: { latitude: 0, longitude: 0, region: 'Global LEO' },
      timeframe: {
        start: new Date(Date.now() - 45 * 60 * 1000),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000),
        duration: 3.75 * 60 * 60 * 1000
      },
      relatedThreats: [`threat-${baseTime}-001`, `threat-${baseTime}-003`],
      estimatedImpact: {
        scope: 'GLOBAL',
        timelineToImpact: 1,
        estimatedDamage: 'GPS disruption affecting navigation and timing systems globally',
        criticalAssets: ['GPS Constellation', 'Communication Satellites', 'Navigation Systems'],
        affectedContexts: ['SPACE', 'PLANETARY']
      },
      recommendedResponse: [
        'Switch to backup navigation systems',
        'Alert space command immediately',
        'Initiate satellite protection protocols'
      ],
      dataPoints: [
        {
          source: 'Space-Monitor-1',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          value: 94.7,
          type: 'interference_level',
          metadata: { affected_satellites: 23, signal_degradation: 0.89 }
        }
      ]
    },
    {
      id: `threat-${baseTime}-003`,
      threatType: 'HYBRID',
      severity: 'MEDIUM',
      confidence: 0.73,
      title: 'Coordinated Multi-Domain Attack Pattern',
      description: 'Synchronized cyber-physical attacks across space and terrestrial domains',
      timeframe: {
        start: new Date(Date.now() - 1 * 60 * 60 * 1000),
        end: new Date(Date.now() + 8 * 60 * 60 * 1000),
        duration: 9 * 60 * 60 * 1000
      },
      relatedThreats: [`threat-${baseTime}-001`, `threat-${baseTime}-002`],
      estimatedImpact: {
        scope: 'MULTI_DOMAIN',
        timelineToImpact: 4,
        estimatedDamage: 'Cascading failures across multiple critical systems',
        criticalAssets: ['Power Grid', 'Communications', 'Transportation'],
        affectedContexts: ['CYBER', 'SPACE', 'PLANETARY']
      },
      recommendedResponse: [
        'Escalate to joint command',
        'Initiate cross-domain monitoring',
        'Prepare contingency protocols'
      ],
      dataPoints: []
    }
  ];

  return threats;
};

/**
 * Generate realistic AI insights
 */
export const generateMockInsights = (): AIInsight[] => {
  const baseTime = Date.now();
  const insights: AIInsight[] = [
    {
      id: `insight-${baseTime}-001`,
      type: 'PATTERN',
      severity: 'HIGH',
      confidence: 0.89,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      contexts: ['PLANETARY', 'CYBER'],
      title: 'Recurring Attack Pattern Identified',
      description: 'AI detected a recurring 72-hour cycle in cyber attacks targeting financial infrastructure',
      data: {
        correlatedEvents: [],
        patterns: [],
        predictions: [],
        anomalies: [],
        metadata: {
          pattern_type: 'temporal',
          cycle_length: '72h',
          confidence_trend: 'increasing'
        }
      },
      recommendedActions: [
        {
          id: `action-${baseTime}-001`,
          actionType: 'INVESTIGATE',
          priority: 8,
          contextRelevance: 0.91,
          confidence: 0.85,
          title: 'Deploy Predictive Monitoring',
          description: 'Set up enhanced monitoring during predicted attack windows',
          estimatedImpact: {
            scope: 'REGIONAL',
            timelineToImpact: 6,
            estimatedDamage: 'Potential attack prevention',
            criticalAssets: ['Banking Networks'],
            affectedContexts: ['CYBER']
          },
          executionSteps: [
            {
              id: `step-${baseTime}-001`,
              stepNumber: 1,
              action: 'Configure enhanced SIEM rules',
              expectedResult: 'Increased detection sensitivity during windows',
              requiredTools: ['SIEM', 'Analytics Engine'],
              estimatedTime: 30
            }
          ],
          prerequisites: ['SIEM access', 'Analytics platform'],
          estimatedDuration: 45,
          resourceRequirements: [
            {
              type: 'TECHNICAL',
              description: 'SIEM configuration access',
              availability: 'AVAILABLE'
            }
          ]
        }
      ],
      provenanceChain: [
        {
          analysisId: 'analysis-001',
          engineType: 'Pattern Detection Engine',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          confidence: 0.89,
          methodology: 'Temporal correlation analysis',
          dataSource: 'SIEM logs (30 days)'
        }
      ]
    },
    {
      id: `insight-${baseTime}-002`,
      type: 'CORRELATION',
      severity: 'CRITICAL',
      confidence: 0.94,
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      contexts: ['SPACE', 'CYBER'],
      title: 'Cross-Domain Attack Correlation',
      description: 'Strong correlation detected between satellite disruptions and subsequent cyber attacks',
      data: {
        correlatedEvents: [],
        patterns: [],
        predictions: [],
        anomalies: [],
        metadata: {
          correlation_strength: 0.94,
          time_lag: '15min',
          domains: 'space_to_cyber'
        }
      },
      recommendedActions: [
        {
          id: `action-${baseTime}-002`,
          actionType: 'ALERT',
          priority: 9,
          contextRelevance: 0.96,
          confidence: 0.91,
          title: 'Activate Cross-Domain Alert Protocol',
          description: 'Establish real-time monitoring link between space and cyber commands',
          estimatedImpact: {
            scope: 'GLOBAL',
            timelineToImpact: 1,
            estimatedDamage: 'Enhanced threat response capability',
            criticalAssets: ['Command Systems'],
            affectedContexts: ['SPACE', 'CYBER']
          },
          executionSteps: [
            {
              id: `step-${baseTime}-002`,
              stepNumber: 1,
              action: 'Establish secure communication channel',
              expectedResult: 'Real-time data sharing active',
              requiredTools: ['Secure Comms', 'Data Bridge'],
              estimatedTime: 15
            }
          ],
          prerequisites: ['Command authority', 'Secure channels'],
          estimatedDuration: 25,
          resourceRequirements: [
            {
              type: 'PERSONNEL',
              description: 'Cross-domain coordination team',
              availability: 'AVAILABLE'
            }
          ]
        }
      ],
      provenanceChain: [
        {
          analysisId: 'analysis-002',
          engineType: 'Cross-Domain Correlation Engine',
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          confidence: 0.94,
          methodology: 'Multi-domain event correlation',
          dataSource: 'Space Command feeds + SIEM data'
        }
      ]
    }
  ];

  return insights;
};

/**
 * Generate action recommendations
 */
export const generateMockActionRecommendations = (): ActionRecommendation[] => {
  const baseTime = Date.now();
  return [
    {
      id: `action-priority-${baseTime}-001`,
      actionType: 'ESCALATE',
      priority: 10,
      contextRelevance: 0.95,
      confidence: 0.88,
      title: 'Escalate Multi-Domain Threat to Joint Command',
      description: 'Coordinate response across CYBER, SPACE, and SOCOM for synchronized attack',
      estimatedImpact: {
        scope: 'GLOBAL',
        timelineToImpact: 0.5,
        estimatedDamage: 'Coordinated response capability',
        criticalAssets: ['All Domains'],
        affectedContexts: ['CYBER', 'SPACE', 'PLANETARY']
      },
      executionSteps: [
        {
          id: `escalate-${baseTime}-001`,
          stepNumber: 1,
          action: 'Initiate secure conference with domain commanders',
          expectedResult: 'Joint command session established',
          requiredTools: ['Secure Video Conference', 'Command Bridge'],
          estimatedTime: 10
        },
        {
          id: `escalate-${baseTime}-002`,
          stepNumber: 2,
          action: 'Share threat intelligence across domains',
          expectedResult: 'Unified threat picture available',
          requiredTools: ['Intelligence Sharing Platform'],
          estimatedTime: 15
        }
      ],
      prerequisites: ['Command authority', 'Secure communications'],
      estimatedDuration: 30,
      resourceRequirements: [
        {
          type: 'PERSONNEL',
          description: 'Domain commanders availability',
          availability: 'AVAILABLE'
        }
      ]
    },
    {
      id: `action-priority-${baseTime}-002`,
      actionType: 'MONITOR',
      priority: 8,
      contextRelevance: 0.82,
      confidence: 0.91,
      title: 'Deploy Enhanced Monitoring Array',
      description: 'Activate additional sensor networks for improved threat detection',
      estimatedImpact: {
        scope: 'REGIONAL',
        timelineToImpact: 1,
        estimatedDamage: 'Enhanced detection capability',
        criticalAssets: ['Sensor Networks'],
        affectedContexts: ['PLANETARY']
      },
      executionSteps: [
        {
          id: 'monitor-001',
          stepNumber: 1,
          action: 'Activate standby sensor arrays',
          expectedResult: '200% sensor coverage increase',
          requiredTools: ['Sensor Management System'],
          estimatedTime: 20
        }
      ],
      prerequisites: ['Sensor network access'],
      estimatedDuration: 25,
      resourceRequirements: [
        {
          type: 'TECHNICAL',
          description: 'Additional computational resources',
          availability: 'LIMITED'
        }
      ]
    }
  ];
};

// ===== AI ENGINE SIMULATION =====

/**
 * Simulates continuous AI analysis and generates new insights
 */
export class AIEngineSimulator {
  private static instance: AIEngineSimulator;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private callbacks: Array<(insights: AIInsight[]) => void> = [];

  static getInstance(): AIEngineSimulator {
    if (!AIEngineSimulator.instance) {
      AIEngineSimulator.instance = new AIEngineSimulator();
    }
    return AIEngineSimulator.instance;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Generate new insights every 30 seconds (for demo purposes)
    this.intervalId = setInterval(() => {
      const newInsights = this.generateRealtimeInsights();
      this.notifyCallbacks(newInsights);
    }, 30000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
  }

  subscribe(callback: (insights: AIInsight[]) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  private generateRealtimeInsights(): AIInsight[] {
    const insightTypes: InsightType[] = ['PATTERN', 'THREAT', 'CORRELATION', 'ANOMALY', 'PREDICTION'];
    const severities: ThreatSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    const numInsights = Math.floor(Math.random() * 3) + 1; // 1-3 insights
    const insights: AIInsight[] = [];

    for (let i = 0; i < numInsights; i++) {
      const insight: AIInsight = {
        id: `realtime-${Date.now()}-${i}`,
        type: insightTypes[Math.floor(Math.random() * insightTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        confidence: 0.6 + Math.random() * 0.4, // 0.6-1.0
        timestamp: new Date(),
        contexts: [['PLANETARY', 'CYBER', 'SPACE'][Math.floor(Math.random() * 3)]],
        title: this.generateInsightTitle(),
        description: this.generateInsightDescription(),
        data: {
          correlatedEvents: [],
          patterns: [],
          predictions: [],
          anomalies: [],
          metadata: {
            realtime: true,
            generated_by: 'simulation'
          }
        },
        recommendedActions: [],
        provenanceChain: [
          {
            analysisId: `analysis-realtime-${Date.now()}`,
            engineType: 'Real-time Analysis Engine',
            timestamp: new Date(),
            confidence: 0.7 + Math.random() * 0.3,
            methodology: 'Continuous stream processing',
            dataSource: 'Live data feeds'
          }
        ]
      };

      insights.push(insight);
    }

    return insights;
  }

  private generateInsightTitle(): string {
    const titles = [
      'Anomalous Network Activity Detected',
      'Emerging Threat Pattern Identified',
      'Cross-Domain Correlation Found',
      'Predictive Alert Generated',
      'Behavioral Anomaly Detected',
      'Threat Intelligence Update',
      'Pattern Refinement Complete',
      'New Attack Vector Identified'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateInsightDescription(): string {
    const descriptions = [
      'AI analysis has identified an unusual pattern requiring investigation',
      'Real-time correlation engine has detected a significant event relationship',
      'Predictive models indicate potential threat escalation in the next 2-6 hours',
      'Anomaly detection algorithms have flagged irregular system behavior',
      'Multi-domain analysis reveals coordinated activity across threat vectors',
      'Pattern recognition system has updated threat profiles based on new data',
      'Behavioral analysis indicates potential adversary tactical changes',
      'Threat intelligence correlation has identified new attack methodology'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private notifyCallbacks(insights: AIInsight[]) {
    this.callbacks.forEach(callback => {
      try {
        callback(insights);
      } catch (error) {
        console.error('Error in AI insight callback:', error);
      }
    });
  }
}

// ===== CONFIDENCE SCORING =====

/**
 * Calculate confidence scores for various AI operations
 */
export const calculateConfidenceScore = (
  dataQuality: ConfidenceLevel,
  modelAccuracy: ConfidenceLevel,
  temporalRelevance: ConfidenceLevel,
  spatialRelevance?: ConfidenceLevel
): ConfidenceLevel => {
  const weights = {
    dataQuality: 0.3,
    modelAccuracy: 0.4,
    temporalRelevance: 0.2,
    spatialRelevance: 0.1
  };

  let score = (
    dataQuality * weights.dataQuality +
    modelAccuracy * weights.modelAccuracy +
    temporalRelevance * weights.temporalRelevance
  );

  if (spatialRelevance !== undefined) {
    score += spatialRelevance * weights.spatialRelevance;
  } else {
    // Redistribute spatial weight to other factors
    const redistributionWeight = weights.spatialRelevance / 3;
    score += redistributionWeight * (dataQuality + modelAccuracy + temporalRelevance);
  }

  return Math.min(1.0, Math.max(0.0, score));
};

// ===== THREAT PRIORITIZATION =====

/**
 * Calculate threat priority based on multiple factors
 */
export const calculateThreatPriority = (threat: ThreatIndicator): number => {
  const severityWeight = {
    'LOW': 0.25,
    'MEDIUM': 0.5,
    'HIGH': 0.75,
    'CRITICAL': 1.0
  };

  const typeWeight = {
    'CYBER': 0.8,
    'SPACE': 0.9,
    'PLANETARY': 0.7,
    'STELLAR': 0.6,
    'HYBRID': 1.0
  };

  const scopeWeight = {
    'LOCAL': 0.3,
    'REGIONAL': 0.6,
    'GLOBAL': 0.9,
    'MULTI_DOMAIN': 1.0
  };

  const timelineUrgency = Math.max(0.1, 1 - (threat.estimatedImpact.timelineToImpact / 24)); // 24 hour scale

  const priority = (
    severityWeight[threat.severity] * 0.3 +
    typeWeight[threat.threatType] * 0.25 +
    scopeWeight[threat.estimatedImpact.scope] * 0.25 +
    timelineUrgency * 0.2
  ) * threat.confidence;

  return Math.round(priority * 10); // 1-10 scale
};

// ===== API SIMULATION =====

/**
 * Simulates API calls to AI engines
 */
export const aiApiService = {
  async getThreatIndicators(): Promise<ThreatIndicator[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return generateMockThreatIndicators();
  },

  async getInsights(): Promise<AIInsight[]> {
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    return generateMockInsights();
  },

  async getActionRecommendations(): Promise<ActionRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    return generateMockActionRecommendations();
  },

  async executeAction(actionId: string, userId: string): Promise<boolean> {
    console.log(`Executing action ${actionId} for user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate 90% success rate
    return Math.random() > 0.1;
  },

  async updateConfidenceThreshold(threshold: ConfidenceLevel): Promise<void> {
    console.log(`Updated confidence threshold to ${threshold}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

export default {
  generateMockThreatIndicators,
  generateMockInsights,
  generateMockActionRecommendations,
  AIEngineSimulator,
  calculateConfidenceScore,
  calculateThreatPriority,
  aiApiService
};
