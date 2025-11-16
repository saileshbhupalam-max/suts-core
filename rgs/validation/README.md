# RGS Validation Framework

A/B testing framework to prove RGS (Real-world Grounding System) improves SUTS accuracy from 85% to 92%+.

## Overview

The RGS Validation Framework provides tools to:
- Run A/B tests comparing base SUTS personas vs RGS-grounded personas
- Calculate accuracy metrics across positioning, retention, and viral predictions
- Generate comprehensive validation reports (Markdown, JSON, CSV)

## Installation

```bash
cd rgs/validation
npm install
```

## Usage

### Basic Validation

```typescript
import { SUTSValidator } from '@rgs/validation';
import type { PersonaProfile } from '@core/models/PersonaProfile';
import type { CalibratedPersona, ActualData, TestConfig } from '@rgs/validation';

// Create validator
const validator = new SUTSValidator();

// Define test configuration
const config: TestConfig = {
  sampleSize: 50,
  confidenceLevel: 0.95,
  timeout: 300000,
  sutsVersion: '1.0.0',
  enableParallel: false,
  retryAttempts: 3,
};

// Prepare personas and actual data
const basePersonas: PersonaProfile[] = [...];
const groundedPersonas: CalibratedPersona[] = [...];
const actualData: ActualData = {...};

// Run validation
const result = await validator.validate(
  basePersonas,
  groundedPersonas,
  actualData,
  config
);

console.log(`Base Accuracy: ${result.baseAccuracy}%`);
console.log(`Grounded Accuracy: ${result.groundedAccuracy}%`);
console.log(`Improvement: +${result.improvement}pp`);
```

### Generate Reports

```typescript
import { generateReport, generateJSONReport, generateCSVReport } from '@rgs/validation';

// Markdown report
const markdown = generateReport(result);
console.log(markdown);

// JSON report
const json = generateJSONReport(result);
console.log(json);

// CSV report
const csv = generateCSVReport(result);
console.log(csv);
```

### Manual Testing

```typescript
import { SUTSValidator, SUTSSimulator } from '@rgs/validation';

const simulator = new SUTSSimulator('1.0.0');
const validator = new SUTSValidator(simulator);

// Run base SUTS test
const baseResult = await validator.runSUTSTest(basePersonas, config);

// Run grounded SUTS test
const groundedResult = await validator.runGroundedSUTSTest(groundedPersonas, config);

// Calculate accuracy manually
const baseAccuracy = validator.calculateAccuracy(baseResult, actualData);
const groundedAccuracy = validator.calculateAccuracy(groundedResult, actualData);
```

### Calculate Metrics

```typescript
import {
  calculateAccuracy,
  calculateAccuracyBreakdown,
  calculateConfidence,
  calculateImprovement,
} from '@rgs/validation';

// Overall accuracy
const accuracy = calculateAccuracy(sutsResult, actualData);

// Breakdown by category
const breakdown = calculateAccuracyBreakdown(sutsResult, actualData);
console.log(`Positioning: ${breakdown.positioning}%`);
console.log(`Retention: ${breakdown.retention}%`);
console.log(`Viral: ${breakdown.viral}%`);

// Statistical confidence
const confidence = calculateConfidence(sampleSize, accuracy);

// Improvement calculation
const improvement = calculateImprovement(baseAccuracy, groundedAccuracy);
```

## Data Structures

### CalibratedPersona

PersonaProfile enhanced with RGS grounding data:

```typescript
interface CalibratedPersona extends PersonaProfile {
  calibrationData: {
    signalCount: number;
    sources: string[];
    sentimentScore: number;
    themes: string[];
    groundingQuality: number;
    lastCalibrated: string;
  };
}
```

### ValidationResult

Complete A/B test outcome:

```typescript
interface ValidationResult {
  baseAccuracy: number;           // Base SUTS accuracy (%)
  groundedAccuracy: number;        // RGS-grounded accuracy (%)
  improvement: number;             // Percentage point improvement
  confidence: number;              // Statistical confidence (0-1)
  breakdown: AccuracyBreakdown;    // Per-category breakdown
  sampleSize: number;              // Number of personas tested
  testDuration: string;            // Test execution time
  timestamp: string;               // ISO timestamp
  metadata: {
    baseTestId: string;
    groundedTestId: string;
    validatorVersion: string;
  };
}
```

### ActualData

Real-world behavior data for comparison:

```typescript
interface ActualData {
  positioning: Array<{
    personaId: string;
    actualResponse: string;
    wasAccurate: boolean;
  }>;
  retention: Array<{
    personaId: string;
    actualRetention: number;
    timeframe: string;
  }>;
  viral: Array<{
    personaId: string;
    actualViralCoefficient: number;
    channels: string[];
  }>;
}
```

## Development

### Run Tests

```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage
npm run test:watch       # Watch mode
```

### Type Checking

```bash
npm run type-check       # TypeScript type checking
```

### Linting

```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
```

### CI Pipeline

```bash
npm run ci               # Full CI check (type-check + lint + test:coverage)
```

## Architecture

### Core Components

1. **SUTSValidator** - Main orchestrator for A/B tests
2. **SUTSSimulator** - Runs SUTS predictions with personas
3. **Metrics** - Calculates accuracy and statistical measures
4. **Reporter** - Generates validation reports

### Workflow

```
1. SUTSValidator.validate()
   ↓
2. Run base SUTS test → baseResult
   ↓
3. Run grounded SUTS test → groundedResult
   ↓
4. Compare vs actualData
   ↓
5. Calculate metrics (accuracy, confidence, improvement)
   ↓
6. Generate ValidationResult
   ↓
7. generateReport() → Markdown/JSON/CSV
```

## Coverage Requirements

- **Minimum Coverage:** 95% for all metrics (branches, functions, lines, statements)
- **Test Files:** All public functions and error paths must be tested
- **Error Handling:** All custom errors must have dedicated test cases

## License

MIT
