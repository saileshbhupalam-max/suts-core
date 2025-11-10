/**
 * Growth projection model for predicting viral growth
 */

import { z } from 'zod';

/**
 * Schema for a single data point in the growth projection
 */
export const GrowthDataPointSchema = z.object({
  /** Day number (0 = current) */
  day: z.number().int().min(0),
  /** Projected number of users */
  users: z.number().int().min(0),
  /** Number of new users on this day */
  newUsers: z.number().int().min(0),
  /** Number of users who churned on this day */
  churned: z.number().int().min(0),
  /** Number of referrals sent on this day */
  referralsSent: z.number().int().min(0),
  /** Number of referrals accepted on this day */
  referralsAccepted: z.number().int().min(0),
});

/**
 * Type representing a single data point in the growth projection
 */
export type GrowthDataPoint = z.infer<typeof GrowthDataPointSchema>;

/**
 * Schema for growth projection
 */
export const GrowthProjectionSchema = z.object({
  /** Starting number of users */
  startingUsers: z.number().int().min(0),
  /** Viral coefficient (k-factor) */
  kFactor: z.number().min(0),
  /** Average conversion rate (invitation to signup) */
  conversionRate: z.number().min(0).max(1),
  /** Average churn rate per day */
  churnRate: z.number().min(0).max(1),
  /** Number of days projected */
  days: z.number().int().min(1),
  /** Array of daily projections */
  dataPoints: z.array(GrowthDataPointSchema),
  /** Type of growth curve */
  growthType: z.enum(['exponential', 'linear', 'plateau', 'declining']),
  /** Final projected user count */
  finalUserCount: z.number().int().min(0),
  /** Timestamp when projection was created */
  createdAt: z.date(),
});

/**
 * Type representing a growth projection
 */
export type GrowthProjection = z.infer<typeof GrowthProjectionSchema>;

/**
 * Creates a growth projection
 * @param startingUsers - Number of users to start with
 * @param kFactor - Viral coefficient
 * @param days - Number of days to project
 * @param conversionRate - Conversion rate for invitations
 * @param churnRate - Daily churn rate
 * @returns Growth projection
 */
export function createGrowthProjection(
  startingUsers: number,
  kFactor: number,
  days: number,
  conversionRate: number = 0.1,
  churnRate: number = 0.01
): GrowthProjection {
  const dataPoints: GrowthDataPoint[] = [];
  let currentUsers = startingUsers;

  for (let day = 0; day < days; day++) {
    // Calculate referrals for this day
    const referralsSent = Math.floor(currentUsers * kFactor);
    const referralsAccepted = Math.floor(referralsSent * conversionRate);

    // Calculate churn
    const churned = Math.floor(currentUsers * churnRate);

    // Calculate new user count
    const newUsers = referralsAccepted;
    const nextUsers = Math.max(0, currentUsers + newUsers - churned);

    dataPoints.push({
      day,
      users: currentUsers,
      newUsers,
      churned,
      referralsSent,
      referralsAccepted,
    });

    currentUsers = nextUsers;
  }

  // Determine growth type
  const growthType = determineGrowthType(dataPoints, kFactor);

  return {
    startingUsers,
    kFactor,
    conversionRate,
    churnRate,
    days,
    dataPoints,
    growthType,
    finalUserCount: currentUsers,
    createdAt: new Date(),
  };
}

/**
 * Determines the type of growth curve based on data points
 * @param dataPoints - Array of growth data points
 * @param kFactor - Viral coefficient
 * @returns Growth type
 */
function determineGrowthType(
  dataPoints: GrowthDataPoint[],
  kFactor: number
): 'exponential' | 'linear' | 'plateau' | 'declining' {
  if (dataPoints.length < 2) {
    return 'linear';
  }

  const lastPoint = dataPoints[dataPoints.length - 1];
  const firstPoint = dataPoints[0];

  // If final users are less than starting users, it's declining
  if (
    lastPoint !== null &&
    lastPoint !== undefined &&
    firstPoint !== undefined &&
    lastPoint.users < firstPoint.users
  ) {
    return 'declining';
  }

  // If k-factor > 1, it's exponential
  if (kFactor > 1) {
    return 'exponential';
  }

  // Check if growth is plateauing (last 3 days have similar user counts)
  if (dataPoints.length >= 3) {
    const last3 = dataPoints.slice(-3);
    const userCounts = last3.map((dp) => dp.users);
    const avgUsers =
      userCounts.reduce((sum, count) => sum + count, 0) / userCounts.length;
    const variance =
      userCounts.reduce((sum, count) => sum + Math.pow(count - avgUsers, 2), 0) /
      userCounts.length;

    if (variance < avgUsers * 0.01) {
      return 'plateau';
    }
  }

  return 'linear';
}

/**
 * Gets the peak user count from a growth projection
 * @param projection - The growth projection
 * @returns Peak user count
 */
export function getPeakUserCount(projection: GrowthProjection): number {
  if (projection.dataPoints.length === 0) {
    return 0;
  }
  return Math.max(...projection.dataPoints.map((dp) => dp.users));
}

/**
 * Gets the average daily growth rate
 * @param projection - The growth projection
 * @returns Average daily growth rate (as a decimal)
 */
export function getAverageDailyGrowthRate(projection: GrowthProjection): number {
  if (projection.dataPoints.length < 2) {
    return 0;
  }

  const firstPoint = projection.dataPoints[0];
  const lastPoint = projection.dataPoints[projection.dataPoints.length - 1];

  if (
    firstPoint === null ||
    firstPoint === undefined ||
    lastPoint === undefined ||
    firstPoint.users === 0
  ) {
    return 0;
  }

  const totalGrowth = lastPoint.users - firstPoint.users;
  const avgDailyGrowth = totalGrowth / projection.dataPoints.length;

  return avgDailyGrowth / firstPoint.users;
}
