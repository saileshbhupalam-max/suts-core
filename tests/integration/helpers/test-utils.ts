/**
 * Integration Test Utilities
 * Helper functions for integration tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { PersonaProfile, TelemetryEvent, ProductState } from '@core/models';

/**
 * Generate mock persona profiles for testing
 */
export function generateMockPersonas(count: number): PersonaProfile[] {
  const archetypes = [
    'Skeptical Senior Developer',
    'Eager Junior Developer',
    'Pragmatic Tech Lead',
    'Cautious Enterprise Architect',
    'Innovative Startup Founder',
  ];

  const roles = [
    'Software Engineer',
    'Tech Lead',
    'Engineering Manager',
    'CTO',
    'Developer',
  ];

  const techStacks = [
    ['TypeScript', 'React', 'Node.js'],
    ['Python', 'Django', 'PostgreSQL'],
    ['Java', 'Spring', 'MySQL'],
    ['Go', 'Docker', 'Kubernetes'],
    ['Rust', 'WebAssembly', 'Linux'],
  ];

  return Array(count)
    .fill(null)
    .map((_, i) => ({
      id: `test-persona-${i}`,
      archetype: archetypes[i % archetypes.length]!,
      role: roles[i % roles.length]!,
      experienceLevel: (['Novice', 'Intermediate', 'Expert'] as const)[(i % 3)]!,
      companySize: (['Startup', 'SMB', 'Enterprise'] as const)[(i % 3)]!,
      techStack: techStacks[i % techStacks.length]!,
      painPoints: ['Generic pain point 1', 'Generic pain point 2'],
      goals: ['Generic goal 1', 'Generic goal 2'],
      fears: ['Generic fear 1', 'Generic fear 2'],
      values: ['Quality', 'Speed', 'Reliability'],
      riskTolerance: (i % 10) / 10,
      patienceLevel: ((i + 5) % 10) / 10,
      techAdoption: (
        ['Early adopter', 'Early majority', 'Late majority', 'Laggard'] as const
      )[(i % 4)]!,
      learningStyle: (['Trial-error', 'Documentation', 'Video', 'Peer learning'] as const)[
        (i % 4)
      ]!,
      evaluationCriteria: ['Criterion 1', 'Criterion 2'],
      dealBreakers: ['Deal breaker 1', 'Deal breaker 2'],
      delightTriggers: ['Delight trigger 1', 'Delight trigger 2'],
      referralTriggers: ['Referral trigger 1', 'Referral trigger 2'],
      typicalWorkflow: 'Standard workflow for testing',
      timeAvailability: '30 minutes',
      collaborationStyle: (['Solo', 'Team', 'Community-driven'] as const)[(i % 3)]!,
      state: {},
      history: [],
      confidenceScore: 0.8,
      lastUpdated: new Date().toISOString(),
      source: 'test-generator',
    }));
}

/**
 * Generate mock telemetry events for testing
 */
export function generateMockEvents(count: number): TelemetryEvent[] {
  const actions = [
    'test_action_1',
    'test_action_2',
    'test_action_3',
    'install',
    'activate',
    'use_feature',
  ];

  const personaIds = ['persona-0', 'persona-1', 'persona-2', 'persona-3', 'persona-4'];

  return Array(count)
    .fill(null)
    .map((_, i) => {
      const timestamp = new Date(Date.now() - i * 1000).toISOString();
      return {
        id: crypto.randomUUID(),
        action: actions[i % actions.length]!,
        timestamp,
        personaId: personaIds[i % personaIds.length]!,
        metadata: {
          test: true,
          index: i,
        },
        success: i % 10 !== 0, // 10% failure rate
        duration: Math.floor(Math.random() * 1000),
        context: {
          day: Math.floor(i / 100),
        },
        emotionalImpact: ((i % 10) - 5) / 10, // -0.5 to 0.5
      };
    });
}

/**
 * Generate mock product state for testing
 */
export function generateMockProductState(): ProductState {
  return {
    features: {
      onboarding: {
        enabled: true,
        variant: 'default',
      },
      'try-mode': {
        enabled: true,
        variant: 'default',
      },
    },
    userData: {},
    uiElements: [
      {
        id: 'welcome-screen',
        type: 'modal',
        visible: true,
      },
      {
        id: 'main-dashboard',
        type: 'view',
        visible: true,
      },
    ],
    systemState: {
      installed: true,
      activated: true,
      configured: false,
    },
    version: '1.0.0',
  };
}

/**
 * Load fixture data from JSON file
 */
export function loadFixture<T>(filename: string): T {
  const fixturePath = path.join(__dirname, '../fixtures', filename);
  const content = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Clean up test output directories
 */
export function cleanupTestOutput(): void {
  const testOutputDirs = [
    path.join(process.cwd(), 'test-output'),
    path.join(process.cwd(), 'output'),
    path.join(process.cwd(), '.test-temp'),
  ];

  for (const dir of testOutputDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

/**
 * Create temporary test directory
 */
export function createTestDirectory(name: string): string {
  const testDir = path.join(process.cwd(), '.test-temp', name);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return [result, duration];
}

/**
 * Assert that a value is defined (type guard)
 */
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Create a mock API key for testing (not a real key)
 */
export function getMockApiKey(): string {
  return 'sk-ant-test-mock-key-for-testing-only';
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Skip test in CI if condition is true
 */
export function skipInCI(condition: boolean): boolean {
  return isCI() && condition;
}
