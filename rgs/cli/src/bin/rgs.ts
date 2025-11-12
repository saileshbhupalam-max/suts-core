#!/usr/bin/env node

/**
 * RGS CLI - Binary Entry Point
 */

import { run } from '../index';

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
