# Custom Plugin Example

Step-by-step guide to building a SUTS plugin for your product.

## What You'll Build

A complete product adapter for a fictional project management tool called "TaskFlow".

## Structure

```
custom-plugin/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── TaskFlowAdapter.ts      # Main adapter class
│   ├── TelemetryMapper.ts      # Event mapping
│   ├── features/
│   │   └── ProjectFeature.ts   # Feature handlers
│   └── scenarios/
│       └── scenarios.ts        # User scenarios
└── __tests__/
    └── TaskFlowAdapter.test.ts # Tests
```

## Quick Start

```bash
cd examples/custom-plugin
npm install
npm test
```

## Step 1: Setup

```bash
mkdir my-product-plugin
cd my-product-plugin
npm init -y
npm install @suts/core @suts/simulation @suts/telemetry
npm install --save-dev typescript @types/node jest ts-jest
```

## Step 2: Create Adapter

See `src/TaskFlowAdapter.ts` for complete implementation.

Key methods:
- `adaptProductState()` - Convert generic to product-specific state
- `simulateAction()` - Simulate product-specific actions
- `mapFeatures()` - Map features to product concepts

## Step 3: Define Scenarios

See `src/scenarios/scenarios.ts` for user journey definitions.

## Step 4: Map Telemetry

See `src/TelemetryMapper.ts` for event classification.

## Step 5: Test

See `__tests__/TaskFlowAdapter.test.ts` for testing patterns.

## Usage

```typescript
import { TaskFlowAdapter } from './src/TaskFlowAdapter';
import { SimulationEngine } from '@suts/simulation';

const adapter = new TaskFlowAdapter('TaskFlow', '2.0.0');
const engine = new SimulationEngine(apiKey);

const productState = adapter.adaptProductState({
  version: '2.0.0',
  features: { /* ... */ }
});

const sessions = await engine.simulateUserJourney(
  persona,
  productState,
  7,
  1.0
);
```

## Next Steps

1. Copy this example as template
2. Customize for your product
3. Add product-specific features
4. Define realistic scenarios
5. Test thoroughly
6. Publish as npm package

---

**Estimated Time**: 2-4 hours
**Difficulty**: Advanced
**Prerequisites**: TypeScript, understanding of your product
