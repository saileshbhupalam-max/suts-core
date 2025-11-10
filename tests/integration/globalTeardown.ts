/**
 * Global Teardown for Integration Tests
 * Runs once after all test suites complete
 */

import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown(): Promise<void> {
  console.log('\n=== Integration Test Suite Teardown ===\n');

  // Clean up test output directories
  const testDirs = [
    path.join(process.cwd(), 'test-output'),
    path.join(process.cwd(), '.test-temp'),
  ];

  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Cleaned up: ${dir}`);
      } catch (error) {
        console.warn(`Failed to clean up ${dir}:`, error);
      }
    }
  }

  console.log('\nTeardown complete.\n');
}
