import { config } from 'dotenv';

/**
 * Test setup file
 * Configures the testing environment
 */

// Configure Jest fake timers globally (as specified in jest.config.js)
// This ensures all tests use fake timers by default

config({ path: '.env.test' });
