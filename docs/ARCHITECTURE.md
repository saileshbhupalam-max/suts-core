# SUTS Architecture

## System Overview

SUTS (Synthetic User Testing System) is a modular framework for simulating realistic user behavior using Large Language Models. The system is designed to be antifragile, scalable, and reusable across different products and domains.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUTS CONTROL PLANE                           │
│  (Orchestration, Configuration, Monitoring, Results)            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  PERSONA       │  │  SIMULATION     │  │   TELEMETRY     │
│  GENERATOR     │  │  ENGINE         │  │   LAYER         │
│                │  │                 │  │                 │
│ • LLM-based    │  │ • Multi-agent   │  │ • Event log     │
│ • Template     │  │ • State machine │  │ • Metrics       │
│ • Learning     │  │ • Event-driven  │  │ • State track   │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

## Core Packages

### @suts/core

**Purpose**: Foundational types, interfaces, and data models used across all packages.

**Key Components**:

- Type definitions for emotional states, actions, and events
- Zod schemas for runtime validation
- Shared interfaces for cross-package communication

**Dependencies**: None (base package)

### @suts/persona

**Purpose**: Generate and manage realistic user personas using LLMs.

**Key Components**:

- `PersonaGenerator`: Creates personas from stakeholder analysis
- `PersonaProfile`: Type-safe persona data structure
- Diversity algorithms for persona distribution

**Dependencies**:

- `@suts/core`
- `anthropic` (Claude API)
- `zod` (validation)

### @suts/simulation

**Purpose**: Execute multi-session user journey simulations.

**Key Components**:

- `SimulationEngine`: Orchestrates user behavior simulation
- `SimulationSession`: Represents a single usage session
- `ProductState`: Represents the product being tested

**Dependencies**:

- `@suts/core`
- `@suts/persona`
- `anthropic` (Claude API)

### @suts/telemetry

**Purpose**: Track events and collect analytics from simulations.

**Key Components**:

- `TelemetryCollector`: Records events and metrics
- Event schemas and validation
- Integration hooks for external analytics platforms

**Dependencies**:

- `@suts/core`

## Architectural Principles

### 1. Modularity

Each package is independently deployable with well-defined interfaces. Packages communicate through typed interfaces, enabling component swapping without breaking the system.

### 2. Type Safety

- Strict TypeScript configuration
- Zod schemas for runtime validation
- No `any` types allowed
- Explicit return types on all functions

### 3. Antifragility

- Graceful degradation when components fail
- Error boundaries prevent cascading failures
- Retry logic with exponential backoff
- Circuit breakers for external services

### 4. Scalability

- Horizontal scaling through parallel execution
- Stateless components where possible
- Event-driven architecture for loose coupling
- Efficient memory management

### 5. Testability

- Dependency injection for mocking
- Pure functions where possible
- Test utilities in each package
- 95%+ code coverage requirement

## Data Flow

1. **Persona Generation**
   - Input: Stakeholder analysis documents
   - Process: LLM-based synthesis + diversity optimization
   - Output: Validated persona profiles

2. **Simulation Execution**
   - Input: Personas + Product state
   - Process: Multi-turn LLM conversations simulating user actions
   - Output: Session events + outcomes

3. **Telemetry Collection**
   - Input: Simulation events
   - Process: Aggregation + analytics
   - Output: Insights + recommendations

## Extension Points

### Plugins

The plugin system allows custom integrations without modifying core packages.

Example: `@suts/plugin-vibeatlas`

```typescript
export class VibeAtlasAdapter {
  convertSession(session: SimulationSession): VibeAtlasFormat {
    // Custom conversion logic
  }
}
```

### Custom Analyzers

Extend telemetry with domain-specific analysis:

```typescript
export class CustomAnalyzer extends TelemetryCollector {
  analyzeCustomMetric(events: TelemetryEvent[]): Insight[] {
    // Domain-specific analysis
  }
}
```

## Technology Stack

- **Language**: TypeScript 5.3+
- **LLM**: Anthropic Claude (via API)
- **Validation**: Zod
- **Testing**: Jest + ts-jest
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier

## Future Enhancements (V2.0+)

- Memory-enabled agents with persistent state
- Real user feedback loops for calibration
- Multi-modal simulation (text + UI screenshots)
- Autonomous optimization
- Transfer learning across products

## Design Decisions

### Why TypeScript?

Type safety catches bugs at compile time, improves IDE support, and serves as living documentation.

### Why Monorepo?

Simplifies dependency management, enables atomic cross-package changes, and ensures version consistency.

### Why LLMs for Simulation?

LLMs capture nuanced human behavior better than rule-based systems, enable realistic decision-making, and adapt to different domains without reprogramming.

### Why Strict Coverage Requirements?

High coverage ensures reliability, catches edge cases, and gives confidence when refactoring.

## Performance Considerations

- **Parallel Execution**: Simulations run concurrently (configurable parallelism)
- **Prompt Caching**: Reuse persona context across sessions
- **Lazy Loading**: Load personas and state only when needed
- **Memory Management**: Clear session state after completion

## Security Considerations

- API keys stored in environment variables
- No hardcoded credentials
- Input validation on all external data
- Sanitize LLM outputs before use
- Rate limiting on API calls

## Monitoring and Observability

- Structured logging with context
- Error tracking with stack traces
- Performance metrics (latency, throughput)
- Resource usage monitoring

## Deployment

- Development: Local with npm workspaces
- CI/CD: GitHub Actions (planned)
- Production: Docker containers (planned)

---

For implementation details, see the source code and inline documentation.
