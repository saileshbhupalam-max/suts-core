# SUTS Integration Test API Reference

This document provides the actual API signatures for all major SUTS packages, based on the source code. Use this as a reference when writing integration tests to ensure compatibility.

## Table of Contents

1. [DecisionSystem](#decisionsystem)
2. [NetworkSimulator](#networksimulator)
3. [AnalysisEngine](#analysisengine)
4. [MetricsCalculator](#metricscalculator)
5. [Core Models & Types](#core-models--types)
6. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## DecisionSystem

**Package**: `@suts/decision`
**Import**: `import { DecisionSystem } from '@suts/decision'`

### Constructor

```typescript
constructor(config?: DecisionConfig)
```

- **Parameters**:
  - `config` (optional): Configuration object with optional properties:
    - `prioritization?: { impactWeight?: number; confidenceWeight?: number; effortWeight?: number; }`
- **Returns**: `DecisionSystem` instance
- **Example**:
  ```typescript
  const decisionSystem = new DecisionSystem();
  // or with config
  const decisionSystem = new DecisionSystem({
    prioritization: {
      impactWeight: 0.5,
      confidenceWeight: 0.3,
      effortWeight: 0.2
    }
  });
  ```

### Methods

#### prioritize()

```typescript
public prioritize(insights: AnalysisResult[]): PrioritizedInsight[]
```

- **Parameters**:
  - `insights`: Array of `AnalysisResult` objects (from AnalysisEngine)
- **Returns**: Array of `PrioritizedInsight` objects with:
  - `insight: AnalysisResult`
  - `priorityScore: number` (0-1)
  - `impactScore: number`
  - `effortScore: number`
  - `iceScore: number`
  - `riceScore: number`
  - `reach: number`
  - `ranking: number` (1-based)
  - `reasoning: string`
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const insights = [...friction, ...value];
  const prioritized = decisionSystem.prioritize(insights);
  ```

#### recommendExperiments()

```typescript
public recommendExperiments(insights: AnalysisResult[]): Experiment[]
```

- **Parameters**:
  - `insights`: Array of `AnalysisResult` objects
- **Returns**: Array of `Experiment` objects for top 5 insights with priorityScore > 0.5
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const experiments = decisionSystem.recommendExperiments(insights);
  ```

#### predictImpact()

```typescript
public predictImpact(
  change: ProductChange,
  baselineMetrics?: {
    retention: number;
    churn: number;
    growth: number;
  }
): ImpactPrediction
```

- **Parameters**:
  - `change`: ProductChange object with:
    - `id: string`
    - `type: 'feature' | 'fix' | 'improvement' | 'experiment'`
    - `expectedReach: number`
    - `estimatedEffort: number`
  - `baselineMetrics` (optional): Defaults to `{ retention: 0.7, churn: 0.3, growth: 0.05 }`
- **Returns**: `ImpactPrediction` object with:
  - `changeId: string`
  - `predictedRetentionChange: number`
  - `predictedChurnChange: number`
  - `predictedGrowthChange: number`
  - `predictedRevenueChange: number`
  - `confidenceLevel: number`
  - `affectedUserCount: number`
  - `timeToImpact: number`
  - `risks: Array<Risk>`
  - `opportunities: Array<Opportunity>`
- **Synchronous**: Yes

#### goNoGoDecision()

```typescript
public goNoGoDecision(metrics: SimulationMetrics): GoNoGoResult
```

- **Parameters**:
  - `metrics`: SimulationMetrics object
- **Returns**: `GoNoGoResult` object
- **Synchronous**: Yes

---

## NetworkSimulator

**Package**: `@suts/network`
**Import**: `import { NetworkSimulator } from '@suts/network'`

### Constructor

```typescript
constructor(config?: Partial<NetworkConfig>)
```

- **Parameters**:
  - `config` (optional): Partial NetworkConfig with properties like:
    - `baseReferralRate?: number`
    - `baseAcceptanceRate?: number`
    - `viralityThreshold?: number`
    - `dailyChurnRate?: number`
    - `socialProof?: { minConnectionsForEffect?: number; maxMultiplier?: number }`
    - `referralChannels?: Array<{ name: string; successRate: number; }>`
- **Returns**: `NetworkSimulator` instance
- **Default Config**: Uses `createDefaultConfig()` for any omitted properties
- **Example**:
  ```typescript
  const networkSim = new NetworkSimulator({
    baseReferralRate: 0.1,
    viralityThreshold: 0.7
  });
  ```

### Methods

#### simulateReferrals()

```typescript
simulateReferrals(
  personas: PersonaProfile[],
  events: TelemetryEvent[]
): ReferralGraph
```

- **Parameters**:
  - `personas`: Array of PersonaProfile objects
  - `events`: Array of TelemetryEvent objects
- **Returns**: `ReferralGraph` object with:
  - `nodes: Map<string, Node>`
  - `edges: Array<Edge>`
  - `totalUsers: number`
  - `totalReferrals: number`
  - `timestamp: Date`
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const graph = networkSim.simulateReferrals(personas, events);
  ```

#### calculateViralCoefficient()

```typescript
calculateViralCoefficient(graph: ReferralGraph): number
```

- **Parameters**:
  - `graph`: ReferralGraph object (from simulateReferrals)
- **Returns**: K-factor value (number)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const kFactor = networkSim.calculateViralCoefficient(graph);
  ```

#### predictGrowth()

```typescript
predictGrowth(
  currentUsers: number,
  kFactor: number,
  days: number
): GrowthProjection
```

- **Parameters**:
  - `currentUsers`: Current number of users
  - `kFactor`: Viral coefficient
  - `days`: Number of days to project
- **Returns**: `GrowthProjection` object with:
  - `currentUsers: number`
  - `projectedUsers: number`
  - `days: number`
  - `growthRate: number`
  - `dailyProjections: Array<{ day: number; users: number; }>`
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const projection = networkSim.predictGrowth(1000, 1.2, 30);
  ```

#### calculateMetrics()

```typescript
calculateMetrics(
  graph: ReferralGraph,
  totalInvitationsSent?: number
): NetworkMetrics
```

- **Parameters**:
  - `graph`: ReferralGraph object
  - `totalInvitationsSent` (optional): Total invitations sent
- **Returns**: `NetworkMetrics` object
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const metrics = networkSim.calculateMetrics(graph);
  ```

#### getSocialProofEngine()

```typescript
getSocialProofEngine(): SocialProofEngine
```

- **Returns**: SocialProofEngine instance
- **Synchronous**: Yes

#### getNetworkValueCalculator()

```typescript
getNetworkValueCalculator(): NetworkValueCalculator
```

- **Returns**: NetworkValueCalculator instance
- **Synchronous**: Yes

#### getChurnReduction()

```typescript
getChurnReduction(): ChurnReduction
```

- **Returns**: ChurnReduction instance
- **Synchronous**: Yes

#### getConfig()

```typescript
getConfig(): NetworkConfig
```

- **Returns**: Copy of current NetworkConfig
- **Synchronous**: Yes

#### updateConfig()

```typescript
updateConfig(config: Partial<NetworkConfig>): void
```

- **Parameters**:
  - `config`: Partial NetworkConfig to merge with current config
- **Returns**: void
- **Side Effects**: Recreates internal components with new config
- **Synchronous**: Yes

#### runSimulation()

```typescript
runSimulation(
  personas: PersonaProfile[],
  events: TelemetryEvent[],
  iterations?: number
): ReferralGraph
```

- **Parameters**:
  - `personas`: Initial personas
  - `events`: Telemetry events
  - `iterations` (optional): Number of iterations (default: 1)
- **Returns**: Final ReferralGraph
- **Synchronous**: Yes

---

## AnalysisEngine

**Package**: `@suts/analysis`
**Import**: `import { AnalysisEngine } from '@suts/analysis'`

### Constructor

```typescript
constructor(config?: Partial<AnalysisConfig>)
```

- **Parameters**:
  - `config` (optional): Partial AnalysisConfig
- **Returns**: `AnalysisEngine` instance
- **Example**:
  ```typescript
  const analyzer = new AnalysisEngine();
  ```

### Methods

#### analyzeFriction()

```typescript
analyzeFriction(events: TelemetryEvent[]): FrictionPoint[]
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
- **Returns**: Array of `FrictionPoint` objects with:
  - `id: string`
  - `type: string`
  - `severity: number` (0-1)
  - `frequency: number`
  - `description: string`
  - `priority: number` (0-1)
  - `confidence: number` (0-1)
  - `affectedUsers: number`
  - Additional fields...
- **Synchronous**: YES (NOT async)
- **Empty Input Handling**: Returns `[]` if events array is empty
- **Example**:
  ```typescript
  const friction = analyzer.analyzeFriction(events);
  ```

#### analyzeValue()

```typescript
analyzeValue(events: TelemetryEvent[]): ValueMoment[]
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
- **Returns**: Array of `ValueMoment` objects with:
  - `id: string`
  - `type: string`
  - `impact: number` (0-1)
  - `frequency: number`
  - `description: string`
  - `priority: number` (0-1)
  - `confidence: number` (0-1)
  - `affectedUsers: number`
  - Additional fields...
- **Synchronous**: YES (NOT async)
- **Empty Input Handling**: Returns `[]` if events array is empty
- **Example**:
  ```typescript
  const value = analyzer.analyzeValue(events);
  ```

#### analyzeChurn()

```typescript
analyzeChurn(events: TelemetryEvent[]): ChurnDriver[]
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
- **Returns**: Array of `ChurnDriver` objects
- **Synchronous**: YES (NOT async)
- **Empty Input Handling**: Returns `[]` if events array is empty
- **Example**:
  ```typescript
  const churn = analyzer.analyzeChurn(events);
  ```

#### analyzeFunnel()

```typescript
analyzeFunnel(events: TelemetryEvent[], steps: string[]): FunnelAnalysis
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `steps`: Array of action names representing funnel steps
- **Returns**: `FunnelAnalysis` object with:
  - `steps: FunnelStep[]`
  - `overallConversion: number`
  - `totalUsers: number`
  - `completedUsers: number`
  - `biggestDropoff?: { step: string; rate: number; }`
  - `recommendations?: string[]`
- **Synchronous**: YES (NOT async)
- **Empty Input Handling**: Returns object with empty arrays and 0 values
- **Example**:
  ```typescript
  const funnel = analyzer.analyzeFunnel(events, ['install', 'configure', 'use_feature']);
  ```

#### getConfig()

```typescript
getConfig(): AnalysisConfig
```

- **Returns**: Copy of current AnalysisConfig
- **Synchronous**: Yes

---

## MetricsCalculator

**Package**: `@suts/telemetry`
**Import**: `import { MetricsCalculator } from '@suts/telemetry'`

### Constructor

```typescript
constructor()
```

- **Parameters**: None
- **Returns**: `MetricsCalculator` instance
- **Example**:
  ```typescript
  const calculator = new MetricsCalculator();
  ```

### Methods

#### calculateRetention()

```typescript
calculateRetention(
  events: TelemetryEvent[],
  cohort: string,
  days?: number
): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `cohort`: Cohort identifier string
  - `days` (optional): Number of days for retention calculation (default: 7)
- **Returns**: Retention rate as percentage (0-100)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const retention = calculator.calculateRetention(events, 'cohort-2024-01', 7);
  ```

#### calculateDay7Retention()

```typescript
calculateDay7Retention(events: TelemetryEvent[], cohort: string): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `cohort`: Cohort identifier
- **Returns**: Day-7 retention rate (0-100)
- **Synchronous**: Yes

#### calculateDay14Retention()

```typescript
calculateDay14Retention(events: TelemetryEvent[], cohort: string): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `cohort`: Cohort identifier
- **Returns**: Day-14 retention rate (0-100)
- **Synchronous**: Yes

#### calculateDay30Retention()

```typescript
calculateDay30Retention(events: TelemetryEvent[], cohort: string): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `cohort`: Cohort identifier
- **Returns**: Day-30 retention rate (0-100)
- **Synchronous**: Yes

#### calculateFrustration()

```typescript
calculateFrustration(events: TelemetryEvent[], personaId: string): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `personaId`: Persona identifier
- **Returns**: Average frustration level (0-1)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const frustration = calculator.calculateFrustration(events, 'persona-123');
  ```

#### calculateDelight()

```typescript
calculateDelight(events: TelemetryEvent[], personaId: string): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `personaId`: Persona identifier
- **Returns**: Average delight level (0-1)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const delight = calculator.calculateDelight(events, 'persona-123');
  ```

#### calculateViralCoefficient()

```typescript
calculateViralCoefficient(events: TelemetryEvent[]): number
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
- **Returns**: Viral coefficient (k-factor)
- **Synchronous**: Yes
- **Note**: Counts 'share' and 'install' actions to calculate coefficient
- **Example**:
  ```typescript
  const kFactor = calculator.calculateViralCoefficient(events);
  ```

#### detectFrictionPoints()

```typescript
detectFrictionPoints(
  events: TelemetryEvent[],
  threshold?: number
): Array<{ action: string; avgFrustration: number; count: number; }>
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `threshold` (optional): Frustration threshold (default: 0.7)
- **Returns**: Array of actions with high frustration, sorted by avgFrustration (descending)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const frictionPoints = calculator.detectFrictionPoints(events, 0.7);
  ```

#### detectValueMoments()

```typescript
detectValueMoments(
  events: TelemetryEvent[],
  threshold?: number
): Array<{ action: string; avgDelight: number; count: number; }>
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
  - `threshold` (optional): Delight threshold (default: 0.7)
- **Returns**: Array of actions with high delight, sorted by avgDelight (descending)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const valueMoments = calculator.detectValueMoments(events, 0.7);
  ```

#### calculateAverageEmotionalState()

```typescript
calculateAverageEmotionalState(events: TelemetryEvent[]): {
  frustration: number;
  confidence: number;
  delight: number;
  confusion: number;
}
```

- **Parameters**:
  - `events`: Array of TelemetryEvent objects
- **Returns**: Object with average emotional state values (0-1)
- **Synchronous**: Yes
- **Example**:
  ```typescript
  const avgState = calculator.calculateAverageEmotionalState(events);
  console.log(avgState.frustration); // 0.35
  ```

---

## Core Models & Types

**Package**: `@suts/core`

### ActionType Enum

**Import**: `import { ActionType } from '@suts/core'`

```typescript
enum ActionType {
  INSTALL = 'install',
  CONFIGURE = 'configure',
  USE_FEATURE = 'use_feature',
  READ_DOCS = 'read_docs',
  SEEK_HELP = 'seek_help',
  CUSTOMIZE = 'customize',
  SHARE = 'share',
  UNINSTALL = 'uninstall',
}
```

### UserAction Interface

**Import**: `import { UserAction } from '@suts/core'`

```typescript
interface UserAction {
  type: ActionType;
  feature: string;
  description: string;
  expectedOutcome: string;
  metadata?: Record<string, unknown>;
}
```

### Exported Schemas

**Import**: `import { TelemetryEventSchema, ProductStateSchema } from '@suts/core/models'`

The following schemas are exported from `@suts/core/models`:

- `PersonaProfileSchema` - YES, exists
- `SimulationStateSchema` - YES, exists
- `TelemetryEventSchema` - YES, exists
- `EmotionalStateSchema` - YES, exists
- `EventTypeSchema` - YES, exists
- `AnalysisResultSchema` - YES, exists
- `FrictionPointSchema` - YES, exists
- `ValueMomentSchema` - YES, exists
- `ViralTriggerSchema` - YES, exists
- `RetentionAnalysisSchema` - YES, exists
- `ProductStateSchema` - YES, exists
- `FeatureFlagSchema` - YES, exists
- `UIElementSchema` - YES, exists

**Example Usage**:
```typescript
import { TelemetryEventSchema, ProductStateSchema } from '@suts/core/models';

const validEvent = TelemetryEventSchema.parse(eventData);
const validState = ProductStateSchema.parse(stateData);
```

### Validation Functions

Each schema has corresponding validation functions:

```typescript
// Throws on validation error
const event = validateTelemetryEvent(eventData);

// Returns { success: true, data: T } or { success: false, error: ZodError }
const result = safeValidateTelemetryEvent(eventData);
```

---

## Common Mistakes to Avoid

### 1. AnalysisEngine Methods Are Synchronous

**INCORRECT**:
```typescript
// DON'T use await or .resolves with AnalysisEngine methods
await analyzer.analyzeFriction(events);
await expect(analyzer.analyzeValue(events)).resolves.not.toThrow();
```

**CORRECT**:
```typescript
// AnalysisEngine methods are synchronous
const friction = analyzer.analyzeFriction(events);
const value = analyzer.analyzeValue(events);

// In tests
expect(() => analyzer.analyzeFriction(events)).not.toThrow();
```

### 2. DecisionSystem.prioritize() Takes AnalysisResult[], Not Multiple Arrays

**INCORRECT**:
```typescript
// DON'T pass friction and value as separate arguments
decisionSystem.prioritize(friction, value);
```

**CORRECT**:
```typescript
// Combine into single array
const insights = [...friction, ...value];
const prioritized = decisionSystem.prioritize(insights);
```

### 3. NetworkSimulator.simulateReferrals() Parameter Order

**INCORRECT**:
```typescript
// DON'T swap the parameter order
networkSim.simulateReferrals(events, personas); // WRONG ORDER
```

**CORRECT**:
```typescript
// Personas first, then events
const graph = networkSim.simulateReferrals(personas, events);
```

### 4. MetricsCalculator.calculateRetention() Requires Cohort

**INCORRECT**:
```typescript
// DON'T forget the cohort parameter
calculator.calculateRetention(events);
```

**CORRECT**:
```typescript
// Always provide cohort identifier
calculator.calculateRetention(events, 'cohort-2024-01', 7);
```

### 5. DecisionSystem.goNoGoDecision() Takes Only SimulationMetrics

**INCORRECT**:
```typescript
// DON'T pass friction and value arrays
decisionSystem.goNoGoDecision(metrics, friction, value);
```

**CORRECT**:
```typescript
// Only pass SimulationMetrics object
const decision = decisionSystem.goNoGoDecision(metrics);
```

### 6. Using ActionType Enum Values

**INCORRECT**:
```typescript
// DON'T use string literals directly
const action: UserAction = {
  type: 'install', // Missing enum
  // ...
};
```

**CORRECT**:
```typescript
import { ActionType } from '@suts/core';

const action: UserAction = {
  type: ActionType.INSTALL, // Use enum
  feature: 'auth',
  description: 'Installing auth module',
  expectedOutcome: 'Module installed'
};
```

### 7. Empty Event Arrays

**GOOD PRACTICE**:
```typescript
// All analysis methods handle empty arrays gracefully
const friction = analyzer.analyzeFriction([]); // Returns []
const value = analyzer.analyzeValue([]); // Returns []
const churn = analyzer.analyzeChurn([]); // Returns []

// No need to check for empty arrays before calling
```

### 8. Schema Validation

**CORRECT USAGE**:
```typescript
import { TelemetryEventSchema } from '@suts/core/models';

// For throwing errors
const validEvent = TelemetryEventSchema.parse(eventData);

// For safe validation
const result = TelemetryEventSchema.safeParse(eventData);
if (result.success) {
  const validEvent = result.data;
}

// Using helper functions
import { validateTelemetryEvent, safeValidateTelemetryEvent } from '@suts/core/models';

const event = validateTelemetryEvent(eventData); // throws
const safeResult = safeValidateTelemetryEvent(eventData); // returns result object
```

---

## Quick Reference Table

| Class | Package | Method | Returns | Async? |
|-------|---------|--------|---------|--------|
| DecisionSystem | @suts/decision | prioritize() | PrioritizedInsight[] | No |
| DecisionSystem | @suts/decision | recommendExperiments() | Experiment[] | No |
| DecisionSystem | @suts/decision | predictImpact() | ImpactPrediction | No |
| DecisionSystem | @suts/decision | goNoGoDecision() | GoNoGoResult | No |
| NetworkSimulator | @suts/network | simulateReferrals() | ReferralGraph | No |
| NetworkSimulator | @suts/network | calculateViralCoefficient() | number | No |
| NetworkSimulator | @suts/network | predictGrowth() | GrowthProjection | No |
| NetworkSimulator | @suts/network | calculateMetrics() | NetworkMetrics | No |
| AnalysisEngine | @suts/analysis | analyzeFriction() | FrictionPoint[] | No |
| AnalysisEngine | @suts/analysis | analyzeValue() | ValueMoment[] | No |
| AnalysisEngine | @suts/analysis | analyzeChurn() | ChurnDriver[] | No |
| AnalysisEngine | @suts/analysis | analyzeFunnel() | FunnelAnalysis | No |
| MetricsCalculator | @suts/telemetry | calculateRetention() | number | No |
| MetricsCalculator | @suts/telemetry | calculateFrustration() | number | No |
| MetricsCalculator | @suts/telemetry | calculateDelight() | number | No |
| MetricsCalculator | @suts/telemetry | calculateViralCoefficient() | number | No |
| MetricsCalculator | @suts/telemetry | detectFrictionPoints() | Array<...> | No |
| MetricsCalculator | @suts/telemetry | detectValueMoments() | Array<...> | No |

---

## Document Version

- **Created**: 2025-11-10
- **Last Updated**: 2025-11-10
- **Source**: Based on actual source code from packages
- **Status**: Authoritative reference for integration tests
