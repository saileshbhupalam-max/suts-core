/**
 * VibeAtlas State Extension
 * Extends ProductState with VibeAtlas-specific state
 */

import type { ProductState } from '@suts/core';

/**
 * VibeAtlas-specific state extension
 * Includes V4 core features and bonus features
 */
export interface VibeAtlasState extends ProductState {
  // V4 Core Features
  tokenCounter: {
    sessionTokens: number;
    totalTokens: number;
    savingsPercent: number;
    visible: boolean;
  };

  contextPreview: {
    beforeContext: string[];
    afterContext: string[];
    optimizationApplied: boolean;
    userReviewed: boolean;
  };

  tryMode: {
    enabled: boolean;
    daysRemaining: number;
    activatedAt: Date | null;
    conversionDecision: 'pending' | 'keep' | 'uninstall';
  };

  dashboard: {
    totalSavings: number;
    sessionsTracked: number;
    sharedCount: number;
    lastExport: Date | null;
  };

  // V4 Bonus Features
  persistentMemory: {
    schemasStored: number;
    reposTracked: number;
    contextsCaptured: number;
    retrievalSuccessRate: number;
  };

  performance: {
    avgResponseTime: number;
    optimizationLevel: 'low' | 'medium' | 'high';
  };

  autoCapture: {
    eventsTracked: number;
    telemetryEnabled: boolean;
  };

  sessionReports: {
    reportsGenerated: number;
    lastReportDate: Date | null;
  };

  mcpServer: {
    enabled: boolean;
    connectionsActive: number;
  };
}
