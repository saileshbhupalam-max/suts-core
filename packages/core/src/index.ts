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

// Export types (ActionType enum, UserAction, ISimpleProductAdapter)
export { ActionType, type UserAction, type ISimpleProductAdapter } from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';
