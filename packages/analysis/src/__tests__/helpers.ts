/**
 * Test helpers for generating synthetic telemetry data
 */

import { TelemetryEvent } from '@suts/telemetry';

/**
 * Creates a synthetic telemetry event
 */
export function createEvent(
  overrides: Partial<TelemetryEvent> = {}
): TelemetryEvent {
  return {
    personaId: 'user-1',
    eventType: 'action_completed',
    action: 'use_feature',
    emotionalState: {
      frustration: 0,
      confidence: 0.5,
      delight: 0.5,
      confusion: 0,
    },
    metadata: {},
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Creates events with high frustration
 */
export function createFrictionEvents(count: number, action: string): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    events.push(
      createEvent({
        personaId: `user-${i % 10}`,
        action,
        emotionalState: {
          frustration: 0.8 + Math.random() * 0.2,
          confidence: 0.2,
          delight: 0.1,
          confusion: 0.7,
        },
        timestamp: new Date(baseTime + i * 1000),
      })
    );
  }

  return events;
}

/**
 * Creates events with high delight
 */
export function createValueEvents(count: number, action: string): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    events.push(
      createEvent({
        personaId: `user-${i % 10}`,
        action,
        emotionalState: {
          frustration: 0.1,
          confidence: 0.9,
          delight: 0.8 + Math.random() * 0.2,
          confusion: 0.1,
        },
        timestamp: new Date(baseTime + i * 1000),
      })
    );
  }

  return events;
}

/**
 * Creates churn pattern events
 */
export function createChurnEvents(userCount: number): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < userCount; i++) {
    const userId = `user-${i}`;

    // Initial events
    events.push(
      createEvent({
        personaId: userId,
        action: 'install',
        timestamp: new Date(baseTime + i * 10000),
      })
    );

    // Friction event
    events.push(
      createEvent({
        personaId: userId,
        action: 'configure',
        emotionalState: {
          frustration: 0.9,
          confidence: 0.2,
          delight: 0.1,
          confusion: 0.8,
        },
        timestamp: new Date(baseTime + i * 10000 + 5000),
      })
    );

    // Churn event
    events.push(
      createEvent({
        personaId: userId,
        action: 'uninstall',
        timestamp: new Date(baseTime + i * 10000 + 8000),
      })
    );
  }

  return events;
}

/**
 * Creates funnel events
 */
export function createFunnelEvents(
  userCount: number,
  steps: string[],
  dropoffRates: number[]
): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();

  let activeUsers = userCount;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    const dropoffRate = dropoffRates[stepIndex] ?? 0;

    if (step === undefined) {
      continue;
    }

    // Calculate how many users complete this step
    const completingUsers = Math.floor(activeUsers * (1 - dropoffRate));

    for (let i = 0; i < completingUsers; i++) {
      events.push(
        createEvent({
          personaId: `user-${i}`,
          action: step,
          timestamp: new Date(baseTime + stepIndex * 10000 + i * 100),
        })
      );
    }

    activeUsers = completingUsers;
  }

  return events;
}

/**
 * Creates large batch of events for performance testing
 */
export function createLargeEventBatch(count: number): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();
  const actions = ['install', 'configure', 'use_feature', 'customize', 'share'];

  for (let i = 0; i < count; i++) {
    const action = actions[i % actions.length];
    if (action === undefined) {
      continue;
    }

    events.push(
      createEvent({
        personaId: `user-${i % 1000}`,
        action,
        emotionalState: {
          frustration: Math.random(),
          confidence: Math.random(),
          delight: Math.random(),
          confusion: Math.random(),
        },
        timestamp: new Date(baseTime + i * 100),
      })
    );
  }

  return events;
}

/**
 * Creates events with retention pattern
 */
export function createRetentionEvents(
  retainedUsers: number,
  churnedUsers: number
): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const baseTime = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  // Retained users - multiple days of activity
  for (let i = 0; i < retainedUsers; i++) {
    const userId = `retained-user-${i}`;

    for (let day = 0; day < 7; day++) {
      events.push(
        createEvent({
          personaId: userId,
          action: 'use_feature',
          emotionalState: {
            frustration: 0.2,
            confidence: 0.8,
            delight: 0.7,
            confusion: 0.2,
          },
          timestamp: new Date(baseTime + day * oneDayInMs + i * 1000),
        })
      );
    }
  }

  // Churned users - only day 1 activity
  for (let i = 0; i < churnedUsers; i++) {
    const userId = `churned-user-${i}`;

    events.push(
      createEvent({
        personaId: userId,
        action: 'use_feature',
        emotionalState: {
          frustration: 0.9,
          confidence: 0.2,
          delight: 0.1,
          confusion: 0.8,
        },
        timestamp: new Date(baseTime + i * 1000),
      })
    );
  }

  return events;
}
