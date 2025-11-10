# API Usage Examples

Programmatic usage patterns for SUTS without the CLI.

## What This Shows

- Direct API usage with TypeScript/JavaScript
- Batch processing patterns
- Error handling
- Performance optimization
- Integration patterns

## Examples

### Basic Usage

```typescript
// examples/api-usage/basic.ts
import { PersonaGenerator } from '@suts/persona';
import { SimulationEngine } from '@suts/simulation';
import { TelemetryCollector } from '@suts/telemetry';
import dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  // Generate personas
  const generator = new PersonaGenerator(apiKey);
  const personas = await generator.generateFromStakeholderAnalysis(
    ['./analysis/users.md'],
    30,
    0.8
  );

  console.log(`Generated ${personas.length} personas`);

  // Run simulations
  const engine = new SimulationEngine(apiKey);
  const productState = {
    version: '1.0.0',
    features: {
      feature1: { enabled: true },
      feature2: { enabled: false }
    }
  };

  const allSessions = [];
  for (const persona of personas) {
    const sessions = await engine.simulateUserJourney(
      persona,
      productState,
      7,
      1.0
    );
    allSessions.push(...sessions);
  }

  // Analyze results
  const collector = new TelemetryCollector();
  const insights = await collector.analyze(allSessions);

  console.log('Results:', insights);
}

main().catch(console.error);
```

### Batch Processing

```typescript
// examples/api-usage/batch.ts
async function batchProcess(
  personas: PersonaProfile[],
  batchSize: number = 10
): Promise<SimulationSession[]> {
  const results: SimulationSession[] = [];

  for (let i = 0; i < personas.length; i += batchSize) {
    const batch = personas.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}...`);

    const batchResults = await Promise.all(
      batch.map(p => engine.simulateUserJourney(p, productState, 7, 1.0))
    );

    results.push(...batchResults.flat());

    // Optional: Save intermediate results
    fs.writeFileSync(
      `output/batch-${i}.json`,
      JSON.stringify(batchResults, null, 2)
    );
  }

  return results;
}
```

### Error Handling

```typescript
// examples/api-usage/error-handling.ts
async function robustSimulation(
  persona: PersonaProfile,
  maxRetries: number = 3
): Promise<SimulationSession[]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await engine.simulateUserJourney(
        persona,
        productState,
        7,
        1.0
      );
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}
```

### Parallel Processing with Rate Limiting

```typescript
// examples/api-usage/parallel.ts
import PQueue from 'p-queue';

async function parallelWithRateLimit(
  personas: PersonaProfile[],
  concurrency: number = 5
): Promise<SimulationSession[]> {
  const queue = new PQueue({ concurrency });

  const results = await Promise.all(
    personas.map(persona =>
      queue.add(() =>
        engine.simulateUserJourney(persona, productState, 7, 1.0)
      )
    )
  );

  return results.flat();
}
```

### Custom Analysis

```typescript
// examples/api-usage/custom-analysis.ts
function analyzeExpertUsers(
  sessions: SimulationSession[],
  personas: PersonaProfile[]
): Analysis {
  const expertPersonas = personas.filter(
    p => p.experienceLevel === 'expert'
  );

  const expertSessions = sessions.filter(s =>
    expertPersonas.some(p => p.id === s.personaId)
  );

  return {
    count: expertSessions.length,
    satisfaction: calculateAverage(expertSessions, 'satisfaction'),
    churnRisk: calculateAverage(expertSessions, 'churnRisk'),
    frictionPoints: extractFrictionPoints(expertSessions)
  };
}
```

## Running the Examples

```bash
cd examples/api-usage
npm install
npx ts-node basic.ts
```

## Files

- `README.md` - This file
- `basic.ts` - Basic API usage
- `batch.ts` - Batch processing
- `error-handling.ts` - Error handling patterns
- `parallel.ts` - Parallel execution
- `custom-analysis.ts` - Custom analysis

---

**Estimated Time**: 30 minutes
**Difficulty**: Intermediate
**Prerequisites**: TypeScript knowledge
