/**
 * Core Interfaces
 * Defines contracts for all major components in SUTS
 */

// IPersonaGenerator
export {
  type IPersonaGenerator,
  type PersonaGenerationConfig,
  type PersonaGenerationResult,
} from './IPersonaGenerator';

// ISimulationEngine
export {
  type ISimulationEngine,
  type SimulationConfig,
  type SimulationResult,
  type SimulationProgressCallback,
  type SimulationEventCallback,
} from './ISimulationEngine';

// ITelemetryCollector
export {
  type ITelemetryCollector,
  type TelemetryQueryOptions,
  type AggregatedMetrics,
} from './ITelemetryCollector';

// IAnalysisEngine
export {
  type IAnalysisEngine,
  type AnalysisConfig,
} from './IAnalysisEngine';

// IProductAdapter
export {
  type IProductAdapter,
  type ProductAction,
  type ProductResponse,
  type ProductAdapterConfig,
} from './IProductAdapter';
