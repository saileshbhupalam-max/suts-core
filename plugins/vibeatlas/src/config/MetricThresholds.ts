/**
 * Metric thresholds for GO/NO-GO decisions
 */

/**
 * Metric thresholds interface
 */
export interface MetricThresholds {
  onboarding: {
    completionRate: number;
    timeToFirstValue: number;
    frustrationScore: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
  };
  satisfaction: {
    delightScore: number;
    nps: number;
    churnRate: number;
  };
  adoption: {
    featureDiscovery: number;
    featureUsage: number;
    powerUserConversion: number;
  };
}

/**
 * Default metric thresholds for GO decision
 */
export const defaultThresholds: MetricThresholds = {
  onboarding: {
    completionRate: 0.7,
    timeToFirstValue: 300,
    frustrationScore: 0.3,
  },
  engagement: {
    dailyActiveUsers: 0.4,
    weeklyActiveUsers: 0.6,
    monthlyActiveUsers: 0.8,
    sessionDuration: 600,
  },
  satisfaction: {
    delightScore: 0.6,
    nps: 30,
    churnRate: 0.2,
  },
  adoption: {
    featureDiscovery: 0.8,
    featureUsage: 0.5,
    powerUserConversion: 0.2,
  },
};

/**
 * Decision result
 */
export interface DecisionResult {
  decision: 'GO' | 'NO-GO' | 'CAUTION';
  score: number;
  failedMetrics: string[];
  passedMetrics: string[];
  recommendations: string[];
}

/**
 * Evaluate metrics against thresholds
 */
export function evaluateMetrics(
  metrics: Partial<Record<string, number>>,
  thresholds: MetricThresholds = defaultThresholds
): DecisionResult {
  const failedMetrics: string[] = [];
  const passedMetrics: string[] = [];
  let totalScore = 0;
  let metricCount = 0;

  const checkMetric = (
    category: string,
    name: string,
    value: number | undefined,
    threshold: number,
    inverse: boolean = false
  ): void => {
    if (value === undefined) {
      return;
    }

    metricCount++;
    const passed = inverse === true ? value <= threshold : value >= threshold;

    if (passed === true) {
      passedMetrics.push(`${category}.${name}`);
      totalScore += 1;
    } else {
      failedMetrics.push(`${category}.${name}`);
    }
  };

  checkMetric(
    'onboarding',
    'completionRate',
    metrics['onboardingCompletionRate'],
    thresholds.onboarding.completionRate
  );
  checkMetric(
    'onboarding',
    'timeToFirstValue',
    metrics['onboardingTimeToFirstValue'],
    thresholds.onboarding.timeToFirstValue,
    true
  );
  checkMetric(
    'onboarding',
    'frustrationScore',
    metrics['onboardingFrustrationScore'],
    thresholds.onboarding.frustrationScore,
    true
  );

  checkMetric('engagement', 'dailyActiveUsers', metrics['dailyActiveUsers'], thresholds.engagement.dailyActiveUsers);
  checkMetric('engagement', 'weeklyActiveUsers', metrics['weeklyActiveUsers'], thresholds.engagement.weeklyActiveUsers);
  checkMetric(
    'engagement',
    'monthlyActiveUsers',
    metrics['monthlyActiveUsers'],
    thresholds.engagement.monthlyActiveUsers
  );
  checkMetric('engagement', 'sessionDuration', metrics['sessionDuration'], thresholds.engagement.sessionDuration);

  checkMetric('satisfaction', 'delightScore', metrics['delightScore'], thresholds.satisfaction.delightScore);
  checkMetric('satisfaction', 'nps', metrics['nps'], thresholds.satisfaction.nps);
  checkMetric('satisfaction', 'churnRate', metrics['churnRate'], thresholds.satisfaction.churnRate, true);

  checkMetric('adoption', 'featureDiscovery', metrics['featureDiscovery'], thresholds.adoption.featureDiscovery);
  checkMetric('adoption', 'featureUsage', metrics['featureUsage'], thresholds.adoption.featureUsage);
  checkMetric(
    'adoption',
    'powerUserConversion',
    metrics['powerUserConversion'],
    thresholds.adoption.powerUserConversion
  );

  const score = metricCount > 0 ? totalScore / metricCount : 0;

  const recommendations: string[] = [];
  if (failedMetrics.length > 0) {
    failedMetrics.forEach((metric) => {
      recommendations.push(`Improve ${metric} to meet threshold`);
    });
  }

  let decision: 'GO' | 'NO-GO' | 'CAUTION';
  if (score >= 0.8) {
    decision = 'GO';
  } else if (score >= 0.6) {
    decision = 'CAUTION';
  } else {
    decision = 'NO-GO';
  }

  return {
    decision,
    score,
    failedMetrics,
    passedMetrics,
    recommendations,
  };
}
