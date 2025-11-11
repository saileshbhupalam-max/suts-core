/**
 * VibeAtlas Product Adapter
 * Production-grade adapter for VibeAtlas VS Code extension
 */

import type { ISimpleProductAdapter, ProductState, UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from './models/VibeAtlasState';
import type { Feature } from './features/Feature';

// Import all features
import { TokenCounterFeature } from './features/TokenCounter';
import { ContextPreviewFeature } from './features/ContextPreview';
import { TryModeFeature } from './features/TryMode';
import { DashboardFeature } from './features/Dashboard';
import { PersistentMemoryFeature } from './features/PersistentMemory';
import { PerformanceOptFeature } from './features/PerformanceOpt';
import { AutoCaptureFeature } from './features/AutoCapture';
import { SessionReportsFeature } from './features/SessionReports';
import { MCPServerFeature } from './features/MCPServer';

/**
 * VibeAtlas Adapter
 * Implements ISimpleProductAdapter with feature-based architecture
 */
export class VibeAtlasAdapter implements ISimpleProductAdapter {
  private features: Map<string, Feature>;

  constructor() {
    this.features = new Map();
    this.initializeFeatures();
  }

  /**
   * Initialize all feature modules
   */
  private initializeFeatures(): void {
    this.features.set('tokenCounter', new TokenCounterFeature());
    this.features.set('contextPreview', new ContextPreviewFeature());
    this.features.set('tryMode', new TryModeFeature());
    this.features.set('dashboard', new DashboardFeature());
    this.features.set('persistentMemory', new PersistentMemoryFeature());
    this.features.set('performanceOpt', new PerformanceOptFeature());
    this.features.set('autoCapture', new AutoCaptureFeature());
    this.features.set('sessionReports', new SessionReportsFeature());
    this.features.set('mcpServer', new MCPServerFeature());
  }

  /**
   * Get the initial state of VibeAtlas
   * @returns Initial VibeAtlasState with all features configured
   */
  getInitialState(): ProductState {
    return {
      // Base ProductState fields
      version: '0.4.0',
      buildNumber: '040001',
      releaseDate: new Date().toISOString(),

      features: {
        tokenCounter: true,
        contextPreview: true,
        tryMode: true,
        dashboard: true,
        persistentMemory: true,
        performanceOpt: true,
        autoCapture: true,
        sessionReports: true,
        mcpServer: true,
      },

      uiElements: {
        tokenCounter: {
          type: 'statusBar',
          visible: true,
          properties: { position: 'statusBar' },
        },
        contextPreview: {
          type: 'sidebar',
          visible: false,
          properties: { position: 'sidebar' },
        },
        tryModeBanner: {
          type: 'banner',
          visible: false,
          properties: { position: 'top' },
        },
        dashboard: {
          type: 'panel',
          visible: false,
          properties: { position: 'panel' },
        },
      },

      config: {
        productName: 'VibeAtlas',
        version: '0.4.0',
        apiVersion: 'v4',
      },

      userData: {
        installed: true,
        installedAt: new Date().toISOString(),
        onboardingCompleted: false,
      },

      environment: 'development',

      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },

      // VibeAtlas-specific state
      tokenCounter: {
        sessionTokens: 0,
        totalTokens: 0,
        savingsPercent: 0,
        visible: true,
      },

      contextPreview: {
        beforeContext: [],
        afterContext: [],
        optimizationApplied: false,
        userReviewed: false,
      },

      tryMode: {
        enabled: false,
        daysRemaining: 14,
        activatedAt: null,
        conversionDecision: 'pending',
      },

      dashboard: {
        totalSavings: 0,
        sessionsTracked: 0,
        sharedCount: 0,
        lastExport: null,
      },

      persistentMemory: {
        schemasStored: 0,
        reposTracked: 0,
        contextsCaptured: 0,
        retrievalSuccessRate: 0,
      },

      performanceOptimization: {
        avgResponseTime: 50,
        optimizationLevel: 'medium',
      },

      autoCapture: {
        eventsTracked: 0,
        telemetryEnabled: true,
      },

      sessionReports: {
        reportsGenerated: 0,
        lastReportDate: null,
      },

      mcpServer: {
        enabled: false,
        connectionsActive: 0,
      },
    };
  }

  /**
   * Apply a user action to the current state
   * @param state - Current product state
   * @param action - User action to apply
   * @returns Updated product state
   */
  applyAction(state: ProductState, action: UserAction): ProductState {
    const vibeState = state as VibeAtlasState;

    // Create persona-like object for features that need it
    // In real simulation, persona will be passed separately
    const mockPersona: PersonaProfile = {
      id: 'default',
      archetype: 'Default User',
      role: 'Developer',
      experienceLevel: 'Intermediate',
      companySize: 'Startup',
      techStack: ['TypeScript'],
      painPoints: [],
      goals: [],
      fears: [],
      values: [],
      riskTolerance: 0.5,
      patienceLevel: 0.5,
      techAdoption: 'Early majority',
      learningStyle: 'Trial-error',
      evaluationCriteria: [],
      dealBreakers: [],
      delightTriggers: [],
      referralTriggers: [],
      typicalWorkflow: 'Typical developer workflow',
      timeAvailability: '2-4 hours/day',
      collaborationStyle: 'Solo',
      state: {},
      history: [],
      confidenceScore: 0.5,
      lastUpdated: new Date().toISOString(),
      source: 'default',
    };

    // Delegate to all features (allows cross-cutting concerns like token tracking)
    let currentState = vibeState;
    this.features.forEach((feature) => {
      currentState = feature.applyAction(currentState, action, mockPersona) as VibeAtlasState;
    });

    return currentState;
  }

  /**
   * Get available actions for current state and persona
   * @param state - Current product state
   * @param persona - User persona
   * @returns List of available actions
   */
  getAvailableActions(state: ProductState, persona: PersonaProfile): UserAction[] {
    const vibeState = state as VibeAtlasState;
    const actions: UserAction[] = [];

    // Collect actions from all features
    this.features.forEach((feature) => {
      const featureActions = feature.getAvailableActions(vibeState, persona);
      actions.push(...featureActions);
    });

    return actions;
  }
}
