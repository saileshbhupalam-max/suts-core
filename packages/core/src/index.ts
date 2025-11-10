/**
 * SUTS Core Package
 * Interfaces, types, and data models for the Synthetic User Testing System
 */

// Models (new structure in models/)
export * from './models/index';

// Backwards compatibility exports (deprecated)
// Only export schemas that don't conflict with models/index
export { SimulationEventSchema, type SimulationEvent } from './models';

// Interfaces
export * from './interfaces';

// Export specific types that are not in interfaces
export type { UserAction } from './types';
export { ActionType } from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';
