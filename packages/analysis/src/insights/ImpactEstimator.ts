/**
 * Impact estimation - estimates potential improvement from fixes
 */

import { FrictionPoint, ValueMoment, ChurnDriver } from '../models';

/**
 * Estimates impact of addressing insights
 */
export class ImpactEstimator {
  constructor() {} // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Estimates impact of fixing a friction point
   * @param friction - Friction point to estimate
   * @param totalUsers - Total number of users
   * @returns Impact score (0-1)
   */
  estimateFrictionImpact(friction: FrictionPoint, totalUsers: number): number {
    // Impact factors:
    // 1. Severity of friction
    // 2. Number of affected users (as % of total)
    // 3. Abandonment rate

    const userImpact = totalUsers > 0 ? friction.affectedUsers / totalUsers : 0;
    const severityImpact = friction.severity;
    const abandonmentImpact = friction.abandonmentRate;

    // Weighted combination
    return (
      severityImpact * 0.4 +
      userImpact * 0.3 +
      abandonmentImpact * 0.3
    );
  }

  /**
   * Estimates impact of amplifying a value moment
   * @param value - Value moment to estimate
   * @param totalUsers - Total number of users
   * @returns Impact score (0-1)
   */
  estimateValueImpact(value: ValueMoment, totalUsers: number): number {
    // Impact factors:
    // 1. Delight score
    // 2. Retention correlation
    // 3. Potential reach (users who haven't experienced it)

    const delightImpact = value.delightScore;
    const retentionImpact = value.retentionCorrelation;
    const reachPotential = totalUsers > 0
      ? (totalUsers - value.affectedUsers) / totalUsers
      : 0;

    // Weighted combination
    return (
      delightImpact * 0.3 +
      retentionImpact * 0.4 +
      reachPotential * 0.3
    );
  }

  /**
   * Estimates impact of preventing churn
   * @param churn - Churn driver to estimate
   * @param totalUsers - Total number of users
   * @returns Impact score (0-1)
   */
  estimateChurnImpact(churn: ChurnDriver, totalUsers: number): number {
    // Impact factors:
    // 1. Churn probability
    // 2. Number of affected users
    // 3. Preventability

    const churnImpact = churn.churnProbability;
    const userImpact = totalUsers > 0 ? churn.affectedUsers / totalUsers : 0;
    const preventabilityBonus = churn.preventable ? 0.2 : 0;

    // Weighted combination
    return Math.min(
      churnImpact * 0.5 +
      userImpact * 0.3 +
      preventabilityBonus,
      1
    );
  }

  /**
   * Estimates effort required to address friction
   * @param friction - Friction point to estimate
   * @returns Effort score (0-1, where 1 is highest effort)
   */
  estimateFrictionEffort(friction: FrictionPoint): number {
    // Effort factors:
    // 1. Severity (higher severity often requires more work)
    // 2. Number of suggested fixes (more fixes = more effort)
    // 3. Complexity heuristic

    const severityEffort = friction.severity * 0.4;
    const fixCountEffort = friction.suggestedFixes !== undefined
      ? Math.min(friction.suggestedFixes.length / 5, 1) * 0.3
      : 0.3;

    // Some actions inherently require more effort
    const complexityEffort = this.estimateComplexity(friction.location.action) * 0.3;

    return severityEffort + fixCountEffort + complexityEffort;
  }

  /**
   * Estimates effort required to amplify value
   * @param value - Value moment to estimate
   * @returns Effort score (0-1, where 1 is highest effort)
   */
  estimateValueEffort(value: ValueMoment): number {
    // Effort factors:
    // 1. Number of suggestions (more = more work)
    // 2. Current reach (less reach = more effort to amplify)

    const suggestionEffort = value.amplificationSuggestions !== undefined
      ? Math.min(value.amplificationSuggestions.length / 5, 1) * 0.5
      : 0.5;

    // If already high frequency, less effort to amplify
    const reachEffort = value.frequency < 50 ? 0.5 : 0.3;

    return suggestionEffort + reachEffort;
  }

  /**
   * Estimates effort required to prevent churn
   * @param churn - Churn driver to estimate
   * @returns Effort score (0-1, where 1 is highest effort)
   */
  estimateChurnEffort(churn: ChurnDriver): number {
    // Effort factors:
    // 1. Preventability (preventable = less effort)
    // 2. Number of interventions (more = more work)
    // 3. Time to churn (faster churn = more effort)

    const preventabilityEffort = churn.preventable ? 0.3 : 0.6;
    const interventionEffort = churn.interventions !== undefined
      ? Math.min(churn.interventions.length / 5, 1) * 0.3
      : 0.3;

    const timeEffort = churn.timeToChurn < 86400000 ? 0.4 : 0.2; // < 1 day

    return Math.min(preventabilityEffort + interventionEffort + timeEffort, 1);
  }

  /**
   * Estimates complexity of an action
   */
  private estimateComplexity(action: string): number {
    // Simple heuristic based on action name
    const lowComplexity = ['click', 'view', 'read', 'open'];
    const mediumComplexity = ['configure', 'customize', 'edit'];
    const highComplexity = ['install', 'integrate', 'migrate', 'deploy'];

    const lowerAction = action.toLowerCase();

    if (highComplexity.some((keyword) => lowerAction.includes(keyword))) {
      return 0.8;
    } else if (mediumComplexity.some((keyword) => lowerAction.includes(keyword))) {
      return 0.5;
    } else if (lowComplexity.some((keyword) => lowerAction.includes(keyword))) {
      return 0.2;
    } else {
      return 0.5; // default medium
    }
  }

  /**
   * Estimates potential user retention improvement
   * @param frictionPoints - Friction points to fix
   * @param churnDrivers - Churn drivers to prevent
   * @param totalUsers - Total number of users
   * @returns Estimated retention improvement (0-1)
   */
  estimateRetentionImprovement(
    frictionPoints: FrictionPoint[],
    churnDrivers: ChurnDriver[],
    totalUsers: number
  ): number {
    if (totalUsers === 0) {
      return 0;
    }

    let potentialImprovement = 0;

    // Impact from fixing friction
    for (const friction of frictionPoints) {
      // Assume fixing reduces abandonment by 50%
      const usersSaved = friction.affectedUsers * friction.abandonmentRate * 0.5;
      potentialImprovement += usersSaved / totalUsers;
    }

    // Impact from preventing churn
    for (const churn of churnDrivers) {
      if (churn.preventable) {
        // Assume intervention reduces churn by 70%
        const usersSaved = churn.affectedUsers * churn.churnProbability * 0.7;
        potentialImprovement += usersSaved / totalUsers;
      }
    }

    return Math.min(potentialImprovement, 1);
  }

  /**
   * Estimates potential engagement improvement
   * @param valueMoments - Value moments to amplify
   * @param totalUsers - Total number of users
   * @returns Estimated engagement improvement (0-1)
   */
  estimateEngagementImprovement(
    valueMoments: ValueMoment[],
    totalUsers: number
  ): number {
    if (totalUsers === 0) {
      return 0;
    }

    let potentialImprovement = 0;

    for (const value of valueMoments) {
      // Users who haven't experienced this value moment
      const unreachedUsers = totalUsers - value.affectedUsers;

      // Assume we can reach 30% of unreached users
      const additionalReach = unreachedUsers * 0.3;

      // Each user experiencing value moment improves engagement
      potentialImprovement += (additionalReach * value.delightScore) / totalUsers;
    }

    return Math.min(potentialImprovement, 1);
  }
}
