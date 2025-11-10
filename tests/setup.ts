import { config } from 'dotenv';

config({ path: '.env.test' });

// Timer setup is handled per test file as needed
// Global setup removed to avoid BeforeAll errors
