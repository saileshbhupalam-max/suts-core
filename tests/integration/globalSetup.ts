/**
 * Global Setup for Integration Tests
 * Runs once before all test suites
 */

import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup(): Promise<void> {
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
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'integration';

  // Log test environment
  console.log('Test Environment:');
  console.log(`  Node version: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Working directory: ${process.cwd()}`);
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

  console.log('Setup complete. Starting tests...\n');
}
