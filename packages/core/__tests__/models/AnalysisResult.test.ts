/**
 * Tests for AnalysisResult model
 */

import { describe, it, expect } from '@jest/globals';
import {
  AnalysisResultSchema,
  FrictionPointSchema,
  ValueMomentSchema,
  ViralTriggerSchema,
  RetentionAnalysisSchema,
  validateAnalysisResult,
  safeValidateAnalysisResult,
  type AnalysisResult,
  type FrictionPoint,
  type ValueMoment,
  type ViralTrigger,
} from '../../src/models/AnalysisResult';

describe('FrictionPointSchema', () => {
  const validFriction: FrictionPoint = {
    action: 'install',
    affectedUsers: 10,
    averageFrustration: 0.8,
    rootCause: 'Complex installation process',
    impact: 'High user drop-off',
    recommendedFix: 'Simplify installation steps',
    priority: 'P0',
    rationale: 'Blocking 50% of users',
    userReasoning: ['Too many steps', 'Unclear instructions'],
  };

  it('should validate correct friction point', () => {
    const result = FrictionPointSchema.safeParse(validFriction);
    expect(result.success).toBe(true);
  });

  it('should validate all priority levels', () => {
    const priorities: Array<'P0' | 'P1' | 'P2' | 'P3'> = ['P0', 'P1', 'P2', 'P3'];

    for (const priority of priorities) {
      const friction = { ...validFriction, priority };
      const result = FrictionPointSchema.safeParse(friction);
      expect(result.success).toBe(true);
    }
  });

  it('should allow default userReasoning', () => {
    const friction = { ...validFriction, userReasoning: undefined };
    const result = FrictionPointSchema.safeParse(friction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userReasoning).toEqual([]);
    }
  });

  it('should reject invalid priority', () => {
    const invalid = { ...validFriction, priority: 'P4' };
    const result = FrictionPointSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject frustration out of range', () => {
    const invalid = { ...validFriction, averageFrustration: 1.5 };
    const result = FrictionPointSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative affected users', () => {
    const invalid = { ...validFriction, affectedUsers: -1 };
    const result = FrictionPointSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ValueMomentSchema', () => {
  const validValue: ValueMoment = {
    action: 'first_success',
    affectedUsers: 25,
    averageDelight: 0.9,
    insight: 'Users love the quick win',
    recommendation: 'Highlight this feature in onboarding',
    viralPotential: 'High',
    priority: 'P1',
    userReasoning: ['Saved time', 'Easy to use'],
  };

  it('should validate correct value moment', () => {
    const result = ValueMomentSchema.safeParse(validValue);
    expect(result.success).toBe(true);
  });

  it('should validate all viral potential levels', () => {
    const levels: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

    for (const viralPotential of levels) {
      const value = { ...validValue, viralPotential };
      const result = ValueMomentSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid viral potential', () => {
    const invalid = { ...validValue, viralPotential: 'VeryHigh' };
    const result = ValueMomentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ViralTriggerSchema', () => {
  const validTrigger: ViralTrigger = {
    trigger: 'successful_deployment',
    frequency: 15,
    conversionRate: 0.3,
    description: 'Users share after successful deployment',
    recommendation: 'Add social share buttons',
    estimatedKFactor: 1.2,
  };

  it('should validate correct viral trigger', () => {
    const result = ViralTriggerSchema.safeParse(validTrigger);
    expect(result.success).toBe(true);
  });

  it('should allow optional estimatedKFactor', () => {
    const trigger = { ...validTrigger, estimatedKFactor: undefined };
    const result = ViralTriggerSchema.safeParse(trigger);
    expect(result.success).toBe(true);
  });

  it('should reject negative frequency', () => {
    const invalid = { ...validTrigger, frequency: -1 };
    const result = ViralTriggerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject conversion rate out of range', () => {
    const invalid = { ...validTrigger, conversionRate: 1.5 };
    const result = ViralTriggerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should allow k-factor greater than 1', () => {
    const trigger = { ...validTrigger, estimatedKFactor: 2.5 };
    const result = ViralTriggerSchema.safeParse(trigger);
    expect(result.success).toBe(true);
  });
});

describe('RetentionAnalysisSchema', () => {
  const validRetention = {
    retentionCurve: [
      { day: 1, retentionRate: 1, activeUsers: 100 },
      { day: 7, retentionRate: 0.8, activeUsers: 80 },
      { day: 30, retentionRate: 0.6, activeUsers: 60 },
    ],
    medianLtvDays: 45,
    churnMoments: [
      {
        day: 3,
        churnRate: 0.1,
        reasons: ['Complexity', 'Missing features'],
      },
    ],
  };

  it('should validate correct retention analysis', () => {
    const result = RetentionAnalysisSchema.safeParse(validRetention);
    expect(result.success).toBe(true);
  });

  it('should allow default churnMoments', () => {
    const analysis = { ...validRetention, churnMoments: undefined };
    const result = RetentionAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.churnMoments).toEqual([]);
    }
  });

  it('should reject invalid retention curve', () => {
    const invalid = {
      ...validRetention,
      retentionCurve: [{ day: 0, retentionRate: 1, activeUsers: 100 }],
    };
    const result = RetentionAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative median LTV', () => {
    const invalid = { ...validRetention, medianLtvDays: -1 };
    const result = RetentionAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AnalysisResultSchema', () => {
  const validAnalysis: AnalysisResult = {
    id: 'analysis-001',
    simulationId: 'sim-001',
    analysisType: 'comprehensive',
    createdAt: '2025-01-10T12:00:00.000Z',
    frictionPoints: [],
    valueMoments: [],
    viralTriggers: [],
    topInsights: [],
    recommendedActions: [],
    metadata: {},
  };

  describe('valid analysis', () => {
    it('should validate correct analysis result', () => {
      const result = AnalysisResultSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });

    it('should validate all analysis types', () => {
      const types: Array<'friction' | 'value' | 'retention' | 'viral' | 'comprehensive'> = [
        'friction',
        'value',
        'retention',
        'viral',
        'comprehensive',
      ];

      for (const analysisType of types) {
        const analysis = { ...validAnalysis, analysisType };
        const result = AnalysisResultSchema.safeParse(analysis);
        expect(result.success).toBe(true);
      }
    });

    it('should allow all optional fields', () => {
      const fullAnalysis: AnalysisResult = {
        ...validAnalysis,
        frictionPoints: [
          {
            action: 'install',
            affectedUsers: 10,
            averageFrustration: 0.8,
            rootCause: 'Complex process',
            impact: 'High drop-off',
            recommendedFix: 'Simplify',
            priority: 'P0',
            rationale: 'Critical',
            userReasoning: [],
          },
        ],
        valueMoments: [
          {
            action: 'first_win',
            affectedUsers: 20,
            averageDelight: 0.9,
            insight: 'Great experience',
            recommendation: 'Amplify',
            viralPotential: 'High',
            priority: 'P1',
            userReasoning: [],
          },
        ],
        viralTriggers: [
          {
            trigger: 'success',
            frequency: 10,
            conversionRate: 0.3,
            description: 'Users share',
            recommendation: 'Add sharing',
          },
        ],
        retentionAnalysis: {
          retentionCurve: [{ day: 1, retentionRate: 1, activeUsers: 100 }],
          medianLtvDays: 30,
          churnMoments: [],
        },
        topInsights: ['Insight 1', 'Insight 2'],
        recommendedActions: [
          {
            action: 'Fix onboarding',
            priority: 'P0',
            estimatedImpact: 'High',
            effort: 'Medium',
          },
        ],
        executiveSummary: 'Overall positive results',
      };

      const result = AnalysisResultSchema.safeParse(fullAnalysis);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing id', () => {
      const invalid = { ...validAnalysis, id: '' };
      const result = AnalysisResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject missing simulationId', () => {
      const invalid = { ...validAnalysis, simulationId: '' };
      const result = AnalysisResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid analysis type', () => {
      const invalid = { ...validAnalysis, analysisType: 'unknown' };
      const result = AnalysisResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('recommended actions', () => {
    it('should validate recommended actions', () => {
      const analysis = {
        ...validAnalysis,
        recommendedActions: [
          {
            action: 'Improve UX',
            priority: 'P1',
            estimatedImpact: '+20% retention',
            effort: 'High',
          },
        ],
      };

      const result = AnalysisResultSchema.safeParse(analysis);
      expect(result.success).toBe(true);
    });

    it('should validate all effort levels', () => {
      const efforts: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

      for (const effort of efforts) {
        const analysis = {
          ...validAnalysis,
          recommendedActions: [
            {
              action: 'Test',
              priority: 'P2',
              estimatedImpact: 'Some',
              effort,
            },
          ],
        };
        const result = AnalysisResultSchema.safeParse(analysis);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('validateAnalysisResult', () => {
  const validAnalysis: AnalysisResult = {
    id: 'analysis-001',
    simulationId: 'sim-001',
    analysisType: 'friction',
    createdAt: '2025-01-10T12:00:00.000Z',
    frictionPoints: [],
    valueMoments: [],
    viralTriggers: [],
    topInsights: [],
    recommendedActions: [],
    metadata: {},
  };

  it('should return validated analysis for valid data', () => {
    const result = validateAnalysisResult(validAnalysis);
    expect(result).toEqual(validAnalysis);
  });

  it('should throw error for invalid data', () => {
    const invalid = { ...validAnalysis, id: '' };
    expect(() => validateAnalysisResult(invalid)).toThrow();
  });
});

describe('safeValidateAnalysisResult', () => {
  const validAnalysis: AnalysisResult = {
    id: 'analysis-001',
    simulationId: 'sim-001',
    analysisType: 'value',
    createdAt: '2025-01-10T12:00:00.000Z',
    frictionPoints: [],
    valueMoments: [],
    viralTriggers: [],
    topInsights: [],
    recommendedActions: [],
    metadata: {},
  };

  it('should return success for valid data', () => {
    const result = safeValidateAnalysisResult(validAnalysis);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAnalysis);
    }
  });

  it('should return error for invalid data', () => {
    const invalid = { ...validAnalysis, analysisType: 'invalid' };
    const result = safeValidateAnalysisResult(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
