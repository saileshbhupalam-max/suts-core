/**
 * Global Setup for Integration Tests
 * Runs once before all test suites
 */

import * as fs from 'fs';
import * as path from 'path';

export default function globalSetup(): void {
  // eslint-disable-next-line no-console
  console.log('\n=== Integration Test Suite Setup ===\n');

  // Create test output directories
  const testDirs = [
    path.join(process.cwd(), 'test-output'),
    path.join(process.cwd(), '.test-temp'),
  ];

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Set environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['TEST_MODE'] = 'integration';

  // Log test environment
  // eslint-disable-next-line no-console
  console.log('Test Environment:');
  // eslint-disable-next-line no-console
  console.log(`  Node version: ${process.version}`);
  // eslint-disable-next-line no-console
  console.log(`  Platform: ${process.platform}`);
  // eslint-disable-next-line no-console
  console.log(`  Working directory: ${process.cwd()}`);
  // eslint-disable-next-line no-console
  console.log('');

  // Verify critical files exist
  const criticalPaths = [
    'packages/core/src/index.ts',
    'packages/simulation/src/index.ts',
    'packages/telemetry/src/index.ts',
  ];

  for (const filePath of criticalPaths) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Critical file missing: ${filePath}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Setup complete. Starting tests...\n');
}
