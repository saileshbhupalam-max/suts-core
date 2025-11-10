/**
 * Dashboard feature (share, export)
 */

import type { ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Dashboard state
 */
export interface DashboardState {
  opened: boolean;
  metrics: {
    totalSessions: number;
    totalTokens: number;
    avgSessionDuration: number;
    successRate: number;
  };
  sharedCount: number;
  exportedCount: number;
  lastShared: Date | null;
  lastExported: Date | null;
}

/**
 * Initialize dashboard
 */
export function initializeDashboard(state: ProductState): ProductState {
  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        opened: false,
        metrics: {
          totalSessions: 0,
          totalTokens: 0,
          avgSessionDuration: 0,
          successRate: 0,
        },
        sharedCount: 0,
        exportedCount: 0,
        lastShared: null,
        lastExported: null,
      } as DashboardState,
    },
  };
}

/**
 * Open dashboard
 */
export function openDashboard(state: ProductState): ProductState {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  if (dashboard === undefined) {
    return initializeDashboard(state);
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        ...dashboard,
        opened: true,
      } as DashboardState,
    },
  };
}

/**
 * Close dashboard
 */
export function closeDashboard(state: ProductState): ProductState {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  if (dashboard === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        ...dashboard,
        opened: false,
      } as DashboardState,
    },
  };
}

/**
 * Share dashboard
 */
export function shareDashboard(state: ProductState): ProductState {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  if (dashboard === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        ...dashboard,
        sharedCount: dashboard.sharedCount + 1,
        lastShared: new Date(),
      } as DashboardState,
    },
  };
}

/**
 * Export dashboard
 */
export function exportDashboard(state: ProductState): ProductState {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  if (dashboard === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        ...dashboard,
        exportedCount: dashboard.exportedCount + 1,
        lastExported: new Date(),
      } as DashboardState,
    },
  };
}

/**
 * Update dashboard metrics
 */
export function updateDashboardMetrics(
  state: ProductState,
  metrics: Partial<DashboardState['metrics']>
): ProductState {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  if (dashboard === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      dashboard: {
        ...dashboard,
        metrics: {
          ...dashboard.metrics,
          ...metrics,
        },
      } as DashboardState,
    },
  };
}

/**
 * Check if dashboard is open
 */
export function isDashboardOpen(state: ProductState): boolean {
  const dashboard = state.userData.dashboard as DashboardState | undefined;
  return dashboard !== undefined && dashboard.opened === true;
}

/**
 * Get available dashboard actions
 */
export function getDashboardActions(state: ProductState, persona: PersonaProfile): UserAction[] {
  const actions: UserAction[] = [];
  const dashboard = state.userData.dashboard as DashboardState | undefined;

  if (dashboard === undefined) {
    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Open dashboard',
      expectedOutcome: 'Dashboard is visible with metrics',
      metadata: { persona: persona.id },
    });
  } else {
    if (dashboard.opened === false) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'dashboard',
        description: 'Open dashboard',
        expectedOutcome: 'Dashboard is visible with metrics',
        metadata: { persona: persona.id },
      });
    } else {
      actions.push({
        type: ActionType.SHARE,
        feature: 'dashboard',
        description: 'Share dashboard with team',
        expectedOutcome: 'Dashboard shared successfully',
        metadata: { sharedCount: dashboard.sharedCount, persona: persona.id },
      });

      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'dashboard',
        description: 'Export dashboard data',
        expectedOutcome: 'Dashboard data exported',
        metadata: { exportedCount: dashboard.exportedCount, persona: persona.id },
      });
    }
  }

  return actions;
}
