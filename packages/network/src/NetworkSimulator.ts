/**
 * Network simulator for viral spread simulation
 */

import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';
import {
  NetworkConfig,
  createDefaultConfig,
  validateConfig,
} from './models/NetworkConfig';
import { ReferralGraph } from './models/ReferralGraph';
import { GrowthProjection, createGrowthProjection } from './models/GrowthProjection';
import { NetworkMetrics } from './models/NetworkMetrics';
import { ReferralTriggerDetector } from './referral/ReferralTriggerDetector';
import { NetworkGraphBuilder } from './referral/NetworkGraphBuilder';
import { InvitationSimulator } from './referral/InvitationSimulator';
import { ViralCoefficientCalculator } from './referral/ViralCoefficientCalculator';
import { SocialProofEngine } from './effects/SocialProofEngine';
import { NetworkValueCalculator } from './effects/NetworkValueCalculator';
import { ChurnReduction } from './effects/ChurnReduction';

/**
 * Main network simulator class for viral spread simulation
 */
export class NetworkSimulator {
  private config: NetworkConfig;
  private triggerDetector: ReferralTriggerDetector;
  private graphBuilder: NetworkGraphBuilder;
  private invitationSimulator: InvitationSimulator;
  private coefficientCalculator: ViralCoefficientCalculator;
  private socialProofEngine: SocialProofEngine;
  private networkValueCalculator: NetworkValueCalculator;
  private churnReduction: ChurnReduction;

  /**
   * Creates a new NetworkSimulator
   * @param config - Configuration for the simulator (optional, uses defaults if not provided)
   */
  constructor(config?: Partial<NetworkConfig>) {
    // Merge with defaults
    const fullConfig = { ...createDefaultConfig(), ...config };
    validateConfig(fullConfig);

    this.config = fullConfig;

    // Initialize components
    this.triggerDetector = new ReferralTriggerDetector(this.config);
    this.graphBuilder = new NetworkGraphBuilder();
    this.invitationSimulator = new InvitationSimulator(this.config);
    this.coefficientCalculator = new ViralCoefficientCalculator();
    this.socialProofEngine = new SocialProofEngine(this.config);
    this.networkValueCalculator = new NetworkValueCalculator();
    this.churnReduction = new ChurnReduction(this.config);
  }

  /**
   * Simulates referrals based on personas and their telemetry events
   * @param personas - Array of persona profiles
   * @param events - Array of telemetry events
   * @returns Referral graph representing the network
   */
  simulateReferrals(
    personas: PersonaProfile[],
    events: TelemetryEvent[]
  ): ReferralGraph {
    // Reset graph builder
    this.graphBuilder.reset();

    // Add all personas as initial nodes
    this.graphBuilder.addPersonas(personas);

    // Group events by persona
    const eventsByPersona = this.groupEventsByPersona(events);

    // Process each persona to detect referral triggers
    for (const persona of personas) {
      const personaEvents = eventsByPersona.get(persona.id);
      if (personaEvents === null || personaEvents === undefined || personaEvents.length === 0) {
        continue;
      }

      // Detect if this persona should make referrals
      const triggerResult = this.triggerDetector.detectReferralTrigger(
        persona,
        personaEvents
      );

      if (triggerResult.shouldRefer && triggerResult.referralCount > 0) {
        // Simulate invitations from this persona
        const currentNetworkSize = this.graphBuilder.getGraph().totalUsers;
        const invitationResult = this.invitationSimulator.simulateInvitations(
          persona.id,
          triggerResult.referralCount,
          currentNetworkSize
        );

        // Add accepted referrals to the graph
        for (const event of invitationResult.events) {
          if (event.accepted && event.referredUserId !== null && event.referredUserId !== undefined) {
            const timestamp = event.acceptedAt ?? event.timestamp;
            this.graphBuilder.addReferral(
              event.referrerId,
              event.referredUserId,
              timestamp,
              event.channel
            );
          }
        }
      }
    }

    return this.graphBuilder.getGraph();
  }

  /**
   * Calculates the viral coefficient (k-factor) from a referral graph
   * @param graph - The referral graph
   * @returns K-factor value
   */
  calculateViralCoefficient(graph: ReferralGraph): number {
    return this.coefficientCalculator.calculateKFactor(graph);
  }

  /**
   * Predicts growth based on current users, k-factor, and time period
   * @param currentUsers - Current number of users
   * @param kFactor - Viral coefficient
   * @param days - Number of days to project
   * @returns Growth projection
   */
  predictGrowth(
    currentUsers: number,
    kFactor: number,
    days: number
  ): GrowthProjection {
    return createGrowthProjection(
      currentUsers,
      kFactor,
      days,
      this.config.baseAcceptanceRate,
      this.config.dailyChurnRate
    );
  }

  /**
   * Calculates comprehensive network metrics from a graph
   * @param graph - The referral graph
   * @param totalInvitationsSent - Total invitations sent (optional)
   * @returns Network metrics
   */
  calculateMetrics(
    graph: ReferralGraph,
    totalInvitationsSent?: number
  ): NetworkMetrics {
    return this.coefficientCalculator.calculateMetrics(
      graph,
      totalInvitationsSent
    );
  }

  /**
   * Gets the social proof engine for calculating conversion rate effects
   * @returns Social proof engine
   */
  getSocialProofEngine(): SocialProofEngine {
    return this.socialProofEngine;
  }

  /**
   * Gets the network value calculator
   * @returns Network value calculator
   */
  getNetworkValueCalculator(): NetworkValueCalculator {
    return this.networkValueCalculator;
  }

  /**
   * Gets the churn reduction calculator
   * @returns Churn reduction calculator
   */
  getChurnReduction(): ChurnReduction {
    return this.churnReduction;
  }

  /**
   * Gets the current configuration
   * @returns Network configuration
   */
  getConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };
    validateConfig(this.config);

    // Recreate components with new config
    this.triggerDetector = new ReferralTriggerDetector(this.config);
    this.invitationSimulator = new InvitationSimulator(this.config);
    this.socialProofEngine = new SocialProofEngine(this.config);
    this.churnReduction = new ChurnReduction(this.config);
  }

  /**
   * Groups telemetry events by persona ID
   * @param events - Array of telemetry events
   * @returns Map of persona ID to events
   */
  private groupEventsByPersona(
    events: TelemetryEvent[]
  ): Map<string, TelemetryEvent[]> {
    const grouped = new Map<string, TelemetryEvent[]>();

    for (const event of events) {
      const personaId = event.personaId;
      if (personaId === null || personaId === undefined) {
        continue;
      }

      let personaEvents = grouped.get(personaId);
      if (personaEvents === null || personaEvents === undefined) {
        personaEvents = [];
        grouped.set(personaId, personaEvents);
      }
      personaEvents.push(event);
    }

    return grouped;
  }

  /**
   * Runs a complete simulation with multiple iterations
   * @param personas - Initial personas
   * @param events - Telemetry events
   * @param iterations - Number of simulation iterations
   * @returns Final referral graph
   */
  runSimulation(
    personas: PersonaProfile[],
    events: TelemetryEvent[],
    iterations: number = 1
  ): ReferralGraph {
    let currentGraph = this.simulateReferrals(personas, events);

    // Run additional iterations if requested
    for (let i = 1; i < iterations; i++) {
      // Simulate referrals from newly referred users
      // (simplified - in reality would need to generate events for new users)
      const newUserEvents = this.generateSyntheticEvents(currentGraph);
      currentGraph = this.simulateReferrals(
        [...personas, ...this.createSyntheticPersonas(currentGraph)],
        [...events, ...newUserEvents]
      );
    }

    return currentGraph;
  }

  /**
   * Generates synthetic events for newly referred users (simplified)
   * @param graph - Current referral graph
   * @returns Array of synthetic events
   */
  private generateSyntheticEvents(graph: ReferralGraph): TelemetryEvent[] {
    const syntheticEvents: TelemetryEvent[] = [];

    for (const [userId, node] of graph.nodes) {
      // Only generate events for referred users (not organic)
      if (node.referredBy !== null && node.referredBy !== undefined) {
        syntheticEvents.push({
          personaId: userId,
          eventType: 'action',
          action: 'use_feature',
          emotionalState: {
            delight: 0.5 + Math.random() * 0.5, // Random delight 0.5-1.0
          },
          metadata: {},
          timestamp: new Date(),
        });
      }
    }

    return syntheticEvents;
  }

  /**
   * Creates synthetic personas for newly referred users (simplified)
   * @param graph - Current referral graph
   * @returns Array of synthetic personas
   */
  private createSyntheticPersonas(graph: ReferralGraph): PersonaProfile[] {
    const personas: PersonaProfile[] = [];

    for (const [userId, node] of graph.nodes) {
      // Only create personas for referred users
      if (node.referredBy !== null && node.referredBy !== undefined) {
        personas.push({
          id: userId,
          archetype: 'synthetic',
          role: 'Developer',
          experienceLevel: 'Intermediate',
          companySize: 'SMB',
          techStack: [],
          painPoints: [],
          goals: [],
          fears: [],
          values: [],
          riskTolerance: 0.5,
          patienceLevel: 0.5,
          techAdoption: 'Early majority',
          learningStyle: 'Documentation',
          evaluationCriteria: [],
          dealBreakers: [],
          delightTriggers: [],
          referralTriggers: [],
          typicalWorkflow: '',
          timeAvailability: '',
          collaborationStyle: 'Team',
          state: {},
          history: [],
          confidenceScore: 0.5,
          lastUpdated: new Date().toISOString(),
          source: 'synthetic',
        });
      }
    }

    return personas;
  }
}
