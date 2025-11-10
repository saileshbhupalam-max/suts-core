# API Reference

Complete API documentation for all SUTS packages.

## Table of Contents

1. [@suts/core](#sutscore) - Core types and interfaces
2. [@suts/persona](#sutspersona) - Persona generation
3. [@suts/simulation](#sutssimulation) - Simulation engine
4. [@suts/telemetry](#sutstelemetry) - Event tracking
5. [@suts/network](#sutsnetwork) - Network effects
6. [@suts/analysis](#sutsanalysis) - Pattern detection
7. [@suts/decision](#sutsdecision) - Decision system

---

## @suts/core

Core types, interfaces, and data models used across all packages.

### Types

#### EmotionalState

Represents the emotional state of a simulated user.

```typescript
interface EmotionalState {
  frustration: number;  // 0-1, higher = more frustrated
  confidence: number;   // 0-1, higher = more confident
  delight: number;      // 0-1, higher = more delighted
  confusion: number;    // 0-1, higher = more confused
}
```

**Example:**
```typescript
const state: EmotionalState = {
  frustration: 0.3,
  confidence: 0.7,
  delight: 0.8,
  confusion: 0.1
};
```

#### ActionType

Enum of possible user actions.

```typescript
enum ActionType {
  INSTALL = 'install',
  CONFIGURE = 'configure',
  USE_FEATURE = 'use_feature',
  READ_DOCS = 'read_docs',
  SEEK_HELP = 'seek_help',
  CUSTOMIZE = 'customize',
  SHARE = 'share',
  UNINSTALL = 'uninstall'
}
```

**Example:**
```typescript
const action = ActionType.USE_FEATURE;
```

#### SimulationConfig

Configuration for a simulation run.

```typescript
interface SimulationConfig {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  numPersonas: number;
  productVersion: string;
  featuresEnabled: Record<string, boolean>;
  numSessions: number;
  timeCompression: number;
  maxParallel: number;
  calibrationData?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}
```

**Example:**
```typescript
const config: SimulationConfig = {
  id: 'sim-001',
  name: 'Q4 Feature Test',
  description: 'Testing new onboarding flow',
  personaIds: ['p1', 'p2', 'p3'],
  numPersonas: 3,
  productVersion: '2.0.0',
  featuresEnabled: {
    newOnboarding: true,
    oldOnboarding: false
  },
  numSessions: 7,
  timeCompression: 1.0,
  maxParallel: 5,
  createdAt: new Date(),
  createdBy: 'team@example.com'
};
```

---

## @suts/persona

Generate and manage realistic user personas.

### PersonaGenerator

Main class for generating personas from stakeholder analysis.

#### Constructor

```typescript
constructor(apiKey: string, model?: string)
```

**Parameters:**
- `apiKey` (string): Anthropic API key
- `model` (string, optional): Claude model name. Default: `'claude-sonnet-4-20250514'`

**Example:**
```typescript
import { PersonaGenerator } from '@suts/persona';

const generator = new PersonaGenerator(
  process.env.ANTHROPIC_API_KEY,
  'claude-sonnet-4-20250514'
);
```

#### Methods

##### generateFromStakeholderAnalysis()

Generate personas from stakeholder analysis documents.

```typescript
async generateFromStakeholderAnalysis(
  analysisDocs: string[],
  numPersonas: number,
  diversityWeight: number
): Promise<PersonaProfile[]>
```

**Parameters:**
- `analysisDocs` (string[]): Array of file paths to analysis documents
- `numPersonas` (number): Number of personas to generate (1-1000)
- `diversityWeight` (number): Diversity optimization weight (0-1)
  - 0 = Focus on common personas
  - 1 = Maximize diversity

**Returns:** Promise<PersonaProfile[]> - Array of generated personas

**Throws:**
- `Error` if API key is invalid
- `Error` if analysis docs cannot be read
- `Error` if numPersonas is out of range

**Example:**
```typescript
const personas = await generator.generateFromStakeholderAnalysis(
  ['./analysis/users.md', './analysis/segments.md'],
  50,
  0.8
);

console.log(`Generated ${personas.length} personas`);
```

##### savePersonas()

Save personas to a JSON file.

```typescript
savePersonas(personas: PersonaProfile[], outputPath: string): void
```

**Parameters:**
- `personas` (PersonaProfile[]): Array of personas to save
- `outputPath` (string): File path for output

**Example:**
```typescript
generator.savePersonas(personas, './output/personas.json');
```

##### loadPersonas()

Load personas from a JSON file.

```typescript
loadPersonas(inputPath: string): PersonaProfile[]
```

**Parameters:**
- `inputPath` (string): File path to personas JSON

**Returns:** PersonaProfile[] - Array of loaded personas

**Throws:**
- `Error` if file cannot be read or parsed

**Example:**
```typescript
const personas = generator.loadPersonas('./output/personas.json');
```

### PersonaProfile

Type definition for a persona.

```typescript
interface PersonaProfile {
  id: string;
  archetype: string;
  role: string;
  experienceLevel: 'novice' | 'intermediate' | 'expert';
  companySize: 'startup' | 'smb' | 'enterprise';
  techStack: string[];
  painPoints: string[];
  goals: string[];
  fears: string[];
  values: string[];
  riskTolerance: number;        // 0-1
  patienceLevel: number;        // 0-1
  techAdoption: 'early' | 'majority' | 'laggard';
  learningStyle: 'trial-error' | 'documentation' | 'video' | 'peer';
  evaluationCriteria: string[];
  dealBreakers: string[];
  delightTriggers: string[];
  referralTriggers: string[];
  typicalWorkflow: string;
  timeAvailability: string;
  collaborationStyle: 'solo' | 'team' | 'community';
  state: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  confidenceScore: number;      // 0-1
  lastUpdated: string;          // ISO timestamp
  source: string;
}
```

**Example:**
```typescript
const persona: PersonaProfile = {
  id: 'p-001',
  archetype: 'Skeptical Senior Developer',
  role: 'Senior Software Engineer',
  experienceLevel: 'expert',
  companySize: 'enterprise',
  techStack: ['TypeScript', 'React', 'Node.js'],
  painPoints: ['Too many tools', 'Context switching'],
  goals: ['Be more productive', 'Reduce meetings'],
  fears: ['Vendor lock-in', 'Data breaches'],
  values: ['Privacy', 'Performance', 'Simplicity'],
  riskTolerance: 0.3,
  patienceLevel: 0.4,
  techAdoption: 'majority',
  learningStyle: 'documentation',
  evaluationCriteria: ['Performance', 'Security', 'Developer experience'],
  dealBreakers: ['No self-hosting', 'Expensive'],
  delightTriggers: ['Keyboard shortcuts', 'Fast response'],
  referralTriggers: ['Saves time', 'Improves code quality'],
  typicalWorkflow: 'Code in morning, meetings in afternoon',
  timeAvailability: '2 hours per week for new tools',
  collaborationStyle: 'team',
  state: {},
  history: [],
  confidenceScore: 0.8,
  lastUpdated: '2024-11-10T10:00:00Z',
  source: 'llm-generated'
};
```

---

## @suts/simulation

Execute realistic user journey simulations.

### SimulationEngine

Main class for running simulations.

#### Constructor

```typescript
constructor(apiKey: string, model?: string)
```

**Parameters:**
- `apiKey` (string): Anthropic API key
- `model` (string, optional): Claude model name. Default: `'claude-sonnet-4-20250514'`

**Example:**
```typescript
import { SimulationEngine } from '@suts/simulation';

const engine = new SimulationEngine(process.env.ANTHROPIC_API_KEY);
```

#### Methods

##### simulateUserJourney()

Simulate a user's journey over multiple sessions.

```typescript
async simulateUserJourney(
  persona: PersonaProfile,
  productState: ProductState,
  numSessions: number,
  timeCompression: number
): Promise<SimulationSession[]>
```

**Parameters:**
- `persona` (PersonaProfile): The persona to simulate
- `productState` (ProductState): Current product state
- `numSessions` (number): Number of sessions to simulate (1-365)
- `timeCompression` (number): Time compression factor (0.1-100)
  - 1.0 = Real-time
  - 10.0 = 10x faster
  - 0.1 = 10x slower (more detailed)

**Returns:** Promise<SimulationSession[]> - Array of session results

**Example:**
```typescript
const sessions = await engine.simulateUserJourney(
  persona,
  {
    features: ['onboarding', 'dashboard', 'sharing'],
    version: '2.0.0'
  },
  14,  // 2 weeks
  1.0
);
```

### ProductState

Interface for product state.

```typescript
interface ProductState {
  productName?: string;
  version: string;
  features: Record<string, FeatureState>;
  onboarding?: OnboardingFlow;
  documentation?: DocumentationState;
  support?: SupportChannels;
}

interface FeatureState {
  enabled: boolean;
  description: string;
  complexity?: 'low' | 'medium' | 'high';
  maturity?: 'alpha' | 'beta' | 'stable';
}

interface OnboardingFlow {
  steps: string[];
  estimatedTimeMinutes: number;
  skippable: boolean;
}
```

### SimulationSession

Interface for simulation session results.

```typescript
interface SimulationSession {
  sessionId: string;
  personaId: string;
  timestamp: string;
  duration: number;
  actions: Action[];
  emotionalStates: EmotionalState[];
  outcomes: SessionOutcome;
  telemetry: TelemetryEvent[];
}

interface Action {
  type: ActionType;
  timestamp: string;
  target: string;
  success: boolean;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

interface SessionOutcome {
  completed: boolean;
  goalAchieved: boolean;
  churnRisk: number;        // 0-1
  satisfactionScore: number; // 0-1
  likelyToRefer: boolean;
  feedback: string;
}
```

---

## @suts/telemetry

Event tracking and analytics collection.

### TelemetryCollector

Main class for collecting and analyzing telemetry data.

#### Constructor

```typescript
constructor(config?: TelemetryConfig)
```

**Parameters:**
- `config` (TelemetryConfig, optional): Configuration options

**Example:**
```typescript
import { TelemetryCollector } from '@suts/telemetry';

const collector = new TelemetryCollector({
  enableMetrics: true,
  enableEvents: true,
  bufferSize: 1000
});
```

#### Methods

##### recordEvent()

Record a single telemetry event.

```typescript
recordEvent(event: TelemetryEvent): void
```

**Parameters:**
- `event` (TelemetryEvent): Event to record

**Example:**
```typescript
collector.recordEvent({
  type: 'feature_used',
  timestamp: new Date().toISOString(),
  personaId: 'p-001',
  sessionId: 's-001',
  data: {
    feature: 'quick-add',
    success: true,
    durationMs: 234
  }
});
```

##### analyze()

Analyze collected telemetry data.

```typescript
async analyze(sessions: SimulationSession[]): Promise<AnalysisResult>
```

**Parameters:**
- `sessions` (SimulationSession[]): Array of simulation sessions

**Returns:** Promise<AnalysisResult> - Analysis insights

**Example:**
```typescript
const insights = await collector.analyze(sessions);

console.log('Friction points:', insights.frictionPoints);
console.log('Value moments:', insights.valueMoments);
```

### AnalysisResult

Interface for analysis results.

```typescript
interface AnalysisResult {
  summary: {
    totalSessions: number;
    totalPersonas: number;
    completionRate: number;
    averageSatisfaction: number;
  };
  frictionPoints: FrictionPoint[];
  valueMoments: ValueMoment[];
  churnProbability: number;
  viralCoefficient: number;
  recommendations: Recommendation[];
}

interface FrictionPoint {
  feature: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPersonas: number;
  timestamp: string;
  suggestedFix?: string;
}

interface ValueMoment {
  feature: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  affectedPersonas: number;
  timestamp: string;
}

interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  confidence: number;
}
```

---

## @suts/network

Simulate network effects and viral mechanics.

### NetworkSimulator

Simulate viral spread and referrals.

#### Constructor

```typescript
constructor(config?: NetworkConfig)
```

#### Methods

##### simulateViralSpread()

Simulate viral growth over time.

```typescript
async simulateViralSpread(
  initialUsers: PersonaProfile[],
  productState: ProductState,
  days: number
): Promise<ViralGrowthResult>
```

**Returns:** Promise<ViralGrowthResult>

```typescript
interface ViralGrowthResult {
  totalUsers: number;
  dailyGrowth: number[];
  kFactor: number;
  viralCoefficient: number;
  referralsByPersona: Map<string, number>;
}
```

---

## @suts/analysis

Pattern detection and insight generation.

### AnalysisEngine

Advanced pattern detection and causal inference.

#### Constructor

```typescript
constructor(config?: AnalysisConfig)
```

#### Methods

##### detectPatterns()

Detect behavioral patterns in simulation data.

```typescript
async detectPatterns(
  sessions: SimulationSession[]
): Promise<Pattern[]>
```

##### inferCausality()

Infer causal relationships between features and outcomes.

```typescript
async inferCausality(
  sessions: SimulationSession[],
  targetMetric: string
): Promise<CausalRelationship[]>
```

---

## @suts/decision

Decision-making and prioritization.

### DecisionSystem

GO/NO-GO decisions and feature prioritization.

#### Constructor

```typescript
constructor(config?: DecisionConfig)
```

#### Methods

##### makeGoNoGoDecision()

Make a GO/NO-GO decision based on simulation results.

```typescript
async makeGoNoGoDecision(
  insights: AnalysisResult,
  criteria: DecisionCriteria
): Promise<GoNoGoDecision>
```

**Example:**
```typescript
const decision = await decisionSystem.makeGoNoGoDecision(
  insights,
  {
    minSatisfaction: 0.7,
    maxChurnRisk: 0.2,
    minViralCoefficient: 1.0
  }
);

console.log('Decision:', decision.recommendation); // 'GO' or 'NO-GO'
console.log('Confidence:', decision.confidence);
console.log('Rationale:', decision.rationale);
```

---

## Error Handling

All async methods can throw errors. Always use try-catch:

```typescript
try {
  const personas = await generator.generateFromStakeholderAnalysis(
    docs,
    50,
    0.8
  );
} catch (error) {
  if (error instanceof APIError) {
    console.error('API error:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

All packages include full TypeScript definitions. No @types packages needed.

```typescript
import type { PersonaProfile, SimulationSession } from '@suts/core';
```

---

**Next**: [Configuration Guide](./CONFIGURATION.md) | [Plugin Development](./PLUGINS.md)
