/**
 * Network value calculator - implements Metcalfe's law and related network effects
 */

/**
 * Result of network value calculation
 */
export interface NetworkValueResult {
  /** Number of users in the network */
  userCount: number;
  /** Raw network value (based on Metcalfe's law) */
  rawValue: number;
  /** Value per user */
  valuePerUser: number;
  /** Value increase from previous size */
  valueIncrease: number;
  /** Value multiplier compared to single user */
  multiplier: number;
}

/**
 * Calculator for network value based on Metcalfe's law and related principles
 */
export class NetworkValueCalculator {
  /**
   * Calculates network value using Metcalfe's law
   * Metcalfe's law states that the value of a network is proportional to the square
   * of the number of connected users (n^2)
   * However, for very large networks, we use a modified version: n * log(n)
   * @param userCount - Number of users in the network
   * @returns Network value result
   */
  calculateValue(userCount: number): NetworkValueResult {
    if (userCount <= 0) {
      return {
        userCount: 0,
        rawValue: 0,
        valuePerUser: 0,
        valueIncrease: 0,
        multiplier: 0,
      };
    }

    if (userCount === 1) {
      return {
        userCount: 1,
        rawValue: 1,
        valuePerUser: 1,
        valueIncrease: 1,
        multiplier: 1,
      };
    }

    // Use modified Metcalfe's law: V = n * log(n)
    // This is more realistic for large networks
    const rawValue = userCount * Math.log10(userCount);
    const valuePerUser = rawValue / userCount;

    // Calculate value increase from previous size
    const previousValue =
      userCount > 1 ? (userCount - 1) * Math.log10(userCount - 1) : 0;
    const valueIncrease = rawValue - previousValue;

    // Multiplier compared to single user
    const multiplier = rawValue;

    return {
      userCount,
      rawValue,
      valuePerUser,
      valueIncrease,
      multiplier,
    };
  }

  /**
   * Calculates the marginal value of adding one more user
   * @param currentUserCount - Current number of users
   * @returns Marginal value of the next user
   */
  calculateMarginalValue(currentUserCount: number): number {
    const currentValue = this.calculateValue(currentUserCount);
    const nextValue = this.calculateValue(currentUserCount + 1);
    return nextValue.rawValue - currentValue.rawValue;
  }

  /**
   * Calculates the total value increase from adding multiple users
   * @param currentUserCount - Current number of users
   * @param additionalUsers - Number of users to add
   * @returns Total value increase
   */
  calculateValueIncrease(
    currentUserCount: number,
    additionalUsers: number
  ): number {
    const currentValue = this.calculateValue(currentUserCount);
    const futureValue = this.calculateValue(currentUserCount + additionalUsers);
    return futureValue.rawValue - currentValue.rawValue;
  }

  /**
   * Calculates network density (actual connections vs possible connections)
   * @param userCount - Number of users
   * @param actualConnections - Number of actual connections (edges)
   * @returns Network density (0-1)
   */
  calculateNetworkDensity(
    userCount: number,
    actualConnections: number
  ): number {
    if (userCount <= 1) {
      return 0;
    }

    // Maximum possible connections in a complete graph: n * (n - 1) / 2
    const maxConnections = (userCount * (userCount - 1)) / 2;
    return actualConnections / maxConnections;
  }

  /**
   * Calculates the value using pure Metcalfe's law (n^2)
   * This can be useful for comparison with the modified version
   * @param userCount - Number of users
   * @returns Value based on pure Metcalfe's law
   */
  calculatePureMetcalfeValue(userCount: number): number {
    if (userCount <= 0) {
      return 0;
    }
    return userCount * userCount;
  }

  /**
   * Calculates the value using Reed's law (2^n)
   * Reed's law suggests network value grows exponentially with group-forming potential
   * This is typically an overestimate, so we use a dampened version
   * @param userCount - Number of users
   * @returns Value based on modified Reed's law
   */
  calculateReedValue(userCount: number): number {
    if (userCount <= 0) {
      return 0;
    }

    // Dampened Reed's law to avoid explosion: n * 2^(log2(n))
    const exponent = Math.log2(Math.max(1, userCount));
    return userCount * Math.pow(2, exponent / 2);
  }

  /**
   * Calculates network value using Odlyzko-Tilly law (n * log(n))
   * This is a more conservative estimate than pure Metcalfe's law
   * @param userCount - Number of users
   * @returns Value based on Odlyzko-Tilly law
   */
  calculateOdlyzkoTillyValue(userCount: number): number {
    if (userCount <= 0) {
      return 0;
    }
    if (userCount === 1) {
      return 1;
    }
    return userCount * Math.log(userCount);
  }

  /**
   * Compares different network value models
   * @param userCount - Number of users
   * @returns Comparison of different models
   */
  compareModels(userCount: number): {
    metcalfe: number;
    odlyzkoTilly: number;
    reed: number;
    modified: number;
  } {
    return {
      metcalfe: this.calculatePureMetcalfeValue(userCount),
      odlyzkoTilly: this.calculateOdlyzkoTillyValue(userCount),
      reed: this.calculateReedValue(userCount),
      modified: this.calculateValue(userCount).rawValue,
    };
  }
}
