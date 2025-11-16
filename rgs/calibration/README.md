# @rgs/calibration

Calibrate SUTS personas with real-world web signals from RGS (Real Grounding System).

## Overview

The RGS Calibration package provides tools to enhance SUTS personas with real-world data extracted from web signals (Reddit, Twitter, GitHub, etc.). It takes base personas and RGS insights, merges them intelligently, and produces calibrated personas with higher confidence and real-world grounding.

## Features

- **Trait Extraction**: Extract persona traits from RGS insights
- **Intelligent Merging**: Merge base persona traits with grounded traits
- **Conflict Resolution**: Multiple strategies (RGS priority, base priority, highest confidence)
- **Confidence Scoring**: Calculate weighted confidence from base + grounded data
- **Type Safety**: 100% TypeScript with strict type checking
- **High Coverage**: 95%+ test coverage

## Installation

```bash
npm install @rgs/calibration
```

## Quick Start

```typescript
import { PersonaCalibrator } from '@rgs/calibration';
import { PersonaProfile } from '@suts/core';
import { Insight } from '@rgs/core';

// Create a calibrator
const calibrator = new PersonaCalibrator({
  minConfidence: 0.5,
  conflictStrategy: 'rgs-priority',
  deduplicate: true,
});

// Your base persona
const basePersona: PersonaProfile = {
  id: 'dev-persona-1',
  archetype: 'Senior Developer',
  role: 'Full Stack Engineer',
  experienceLevel: 'Expert',
  painPoints: ['slow build times'],
  goals: ['improve productivity'],
  // ... other persona fields
};

// RGS insights from web signals
const insights: Insight[] = [
  {
    themes: [
      { name: 'performance', confidence: 0.9, frequency: 10, keywords: ['fast', 'slow'] }
    ],
    painPoints: ['memory leaks', 'poor documentation'],
    desires: ['better tooling', 'faster builds'],
    sentiment: {
      overall: 0.3,
      distribution: { positive: 0.4, neutral: 0.3, negative: 0.3 },
      positiveSignals: [],
      negativeSignals: [],
    },
    language: {
      tone: 'technical',
      commonPhrases: ['need to optimize'],
      frequentTerms: { performance: 10 },
      emotionalIndicators: ['frustrated'],
    },
    confidence: 0.85,
  },
];

// Calibrate the persona
const calibratedPersona = await calibrator.calibrate(
  basePersona,
  insights,
  100 // signalCount - how many web signals were analyzed
);

console.log(calibratedPersona);
// {
//   ...basePersona,
//   groundedTraits: [...], // Extracted traits from insights
//   confidence: 0.73,      // Weighted: 40% base + 60% grounded
//   signalCount: 100,
//   sources: ['rgs-insight'],
//   calibratedAt: Date,
//   painPoints: ['slow build times', 'memory leaks', 'poor documentation'],
//   goals: ['improve productivity', 'better tooling', 'faster builds'],
// }
```

## Core Concepts

### 1. PersonaTrait

Traits are extracted from RGS insights and categorized:

```typescript
interface PersonaTrait {
  category: 'demographic' | 'psychographic' | 'behavioral' | 'linguistic';
  name: string;
  value: string | string[] | number;
  confidence: number; // 0-1
  source: string; // e.g., 'rgs-insight', 'reddit', 'twitter'
}
```

### 2. CalibratedPersona

Extends PersonaProfile with grounding metadata:

```typescript
interface CalibratedPersona extends PersonaProfile {
  groundedTraits: PersonaTrait[];
  confidence: number;        // Overall confidence (0-1)
  signalCount: number;       // Number of signals analyzed
  sources: string[];         // Data sources used
  calibratedAt: Date;        // When calibration was performed
}
```

### 3. Calibration Process

1. **Extract**: Convert RGS insights into PersonaTrait objects
2. **Filter**: Apply minimum confidence threshold
3. **Convert**: Convert base persona to traits for merging
4. **Merge**: Combine base and grounded traits
5. **Resolve**: Handle conflicts using configured strategy
6. **Enhance**: Apply grounded traits to persona (pain points, goals, etc.)
7. **Score**: Calculate weighted confidence (40% base + 60% grounded)

## Configuration Options

```typescript
interface CalibratorConfig {
  // Minimum confidence threshold for including traits (default: 0.5)
  minConfidence?: number;

  // Conflict resolution strategy (default: 'rgs-priority')
  // - 'rgs-priority': RGS data wins conflicts
  // - 'base-priority': Base persona wins conflicts
  // - 'highest-confidence': Highest confidence trait wins
  conflictStrategy?: ConflictResolutionStrategy;

  // Whether to deduplicate traits after merging (default: true)
  deduplicate?: boolean;
}
```

## Examples

### Example 1: Basic Calibration

```typescript
import { createCalibrator } from '@rgs/calibration';

const calibrator = createCalibrator();
const calibrated = await calibrator.calibrate(basePersona, insights, 50);
```

### Example 2: High Confidence Threshold

```typescript
// Only include traits with confidence >= 0.8
const calibrator = new PersonaCalibrator({ minConfidence: 0.8 });
const calibrated = await calibrator.calibrate(basePersona, insights, 100);
```

### Example 3: Preserve Base Persona

```typescript
// Prefer base persona data over RGS data in conflicts
const calibrator = new PersonaCalibrator({ conflictStrategy: 'base-priority' });
const calibrated = await calibrator.calibrate(basePersona, insights, 75);
```

### Example 4: Manual Trait Extraction

```typescript
import { extractTraits, filterTraitsByConfidence } from '@rgs/calibration';

// Extract all traits
const allTraits = extractTraits(insights);

// Filter by confidence
const highConfidenceTraits = filterTraitsByConfidence(allTraits, 0.8);

// Filter by category
const psychographicTraits = filterTraitsByCategory(allTraits, 'psychographic');
```

### Example 5: Manual Merging

```typescript
import { mergeTraits, deduplicateTraits } from '@rgs/calibration';

const baseTraits = extractTraits(baseInsights);
const groundedTraits = extractTraits(rgsInsights);

// Merge with RGS priority
const merged = mergeTraits(baseTraits, groundedTraits, 'rgs-priority');

// Remove duplicates
const deduplicated = deduplicateTraits(merged);
```

## API Reference

### PersonaCalibrator

Main class for persona calibration.

#### Methods

- `calibrate(basePersona, insights, signalCount): Promise<CalibratedPersona>` - Calibrate a persona
- `extractTraits(insights): PersonaTrait[]` - Extract traits from insights
- `mergeTraits(base, grounded): PersonaTrait[]` - Merge trait arrays
- `getConfig(): CalibratorConfig` - Get current configuration

### Utility Functions

- `createCalibrator(config?)` - Factory function
- `extractTraits(insights)` - Extract traits from insights
- `filterTraitsByCategory(traits, category)` - Filter by category
- `filterTraitsByConfidence(traits, minConfidence)` - Filter by confidence
- `groupTraitsByName(traits)` - Group traits by name
- `mergeTraits(base, grounded, strategy)` - Merge with strategy
- `resolveConflict(traits, strategy)` - Resolve conflicting traits
- `deduplicateTraits(traits)` - Remove duplicates
- `calculateAverageConfidence(traits)` - Calculate average
- `validateTraits(traits)` - Validate confidence scores
- `createCalibratedPersona(base, grounded, signals, sources)` - Create calibrated persona
- `validateCalibratedPersona(persona)` - Validate persona
- `extractUniqueSources(traits)` - Get unique sources

## Error Handling

```typescript
import { CalibrationError, TraitExtractionError, TraitMergeError, ProfileGenerationError } from '@rgs/calibration';

try {
  const calibrated = await calibrator.calibrate(basePersona, insights, 100);
} catch (error) {
  if (error instanceof CalibrationError) {
    console.error('Calibration failed:', error.message);
    console.error('Caused by:', error.cause);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run full CI pipeline
npm run ci
```

## License

MIT
