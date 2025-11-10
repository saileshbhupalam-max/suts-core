# Getting Started with SUTS

This guide will walk you through setting up SUTS and running your first simulation in about 10 minutes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Setup](#environment-setup)
4. [Your First Simulation](#your-first-simulation)
5. [Understanding Results](#understanding-results)
6. [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Anthropic API Key**: Get one at [console.anthropic.com](https://console.anthropic.com/)
- **Git**: For cloning the repository
- **Text Editor**: VS Code, Vim, or your preference

### Checking Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check Git
git --version
```

## Installation

### Option 1: Clone Repository (Recommended for Contributors)

```bash
# Clone the repository
git clone https://github.com/your-org/suts-core.git
cd suts-core

# Install dependencies
npm install

# Verify installation
npm run type-check
npm test
```

### Option 2: Install as Package (Recommended for Users)

```bash
# Create a new project
mkdir my-suts-project
cd my-suts-project
npm init -y

# Install SUTS packages
npm install @suts/core @suts/persona @suts/simulation @suts/telemetry

# Install TypeScript (if using TypeScript)
npm install --save-dev typescript @types/node
```

### Troubleshooting Installation

**Error: Node version too old**
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 18+
nvm install 18
nvm use 18
```

**Error: Permission denied**
```bash
# Use npx instead of global install
npx create-suts-app my-project
```

**Error: Network timeout**
```bash
# Increase npm timeout
npm config set timeout 60000

# Or use a different registry
npm config set registry https://registry.npmjs.org/
```

## Environment Setup

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# Copy example environment file
cp .env.example .env

# Or create manually
touch .env
```

### 2. Add API Key

Edit `.env` and add your Anthropic API key:

```env
# .env file
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...

# Optional: Model configuration
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Optional: Rate limiting
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT_MS=30000

# Optional: Logging
LOG_LEVEL=info
DEBUG=false
```

### 3. Verify Environment

Create a test file to verify your setup:

```typescript
// verify-setup.ts
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function verifySetup(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('API Key found:', apiKey.substring(0, 10) + '...');

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hello!' }]
    });

    console.log('API connection successful!');
    console.log('Response:', response.content[0]);
  } catch (error) {
    console.error('API connection failed:', error);
    process.exit(1);
  }
}

verifySetup();
```

Run the verification:

```bash
npx ts-node verify-setup.ts
```

## Your First Simulation

Now let's run a complete simulation from scratch.

### Step 1: Create Stakeholder Analysis

Create a file `analysis/developer-personas.md`:

```markdown
# Developer Personas for Task Management App

## Target Audience

Software developers who need to manage their tasks and projects.

## Key Stakeholder Groups

### 1. Solo Indie Developers
- Working alone on side projects
- Limited time (nights and weekends)
- Need simple, fast task management
- Care about: Speed, simplicity, keyboard shortcuts
- Pain points: Complicated tools with too many features

### 2. Startup Engineers
- Working in small teams (2-10 people)
- Fast-paced environment
- Need collaboration features
- Care about: Integration with dev tools, team visibility
- Pain points: Context switching between tools

### 3. Enterprise Developers
- Large companies with established processes
- Need compliance and security
- Care about: Data privacy, SSO, audit logs
- Pain points: Tools that don't meet security requirements
```

### Step 2: Generate Personas

Create `generate-personas.ts`:

```typescript
import { PersonaGenerator } from '@suts/persona';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function generatePersonas(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found');
  }

  console.log('Generating personas...');

  const generator = new PersonaGenerator(apiKey);
  const personas = await generator.generateFromStakeholderAnalysis(
    ['./analysis/developer-personas.md'],
    10,  // Generate 10 personas
    0.8  // 80% diversity weight
  );

  console.log(`Generated ${personas.length} personas`);

  // Save personas to file
  fs.writeFileSync(
    'personas.json',
    JSON.stringify(personas, null, 2)
  );

  console.log('Personas saved to personas.json');
}

generatePersonas().catch(console.error);
```

Run it:

```bash
npx ts-node generate-personas.ts
```

### Step 3: Define Product State

Create `product-state.json`:

```json
{
  "productName": "TaskMaster",
  "version": "1.0.0",
  "features": {
    "quickAdd": {
      "enabled": true,
      "description": "Quickly add tasks with natural language"
    },
    "keyboardShortcuts": {
      "enabled": true,
      "description": "Complete keyboard navigation"
    },
    "teamSharing": {
      "enabled": true,
      "description": "Share tasks with team members"
    },
    "githubIntegration": {
      "enabled": false,
      "description": "Sync with GitHub issues"
    }
  },
  "onboarding": {
    "steps": ["signup", "tutorial", "first-task"],
    "estimatedTimeMinutes": 5
  }
}
```

### Step 4: Run Simulation

Create `run-simulation.ts`:

```typescript
import { SimulationEngine } from '@suts/simulation';
import { TelemetryCollector } from '@suts/telemetry';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function runSimulation(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found');
  }

  console.log('Loading personas...');
  const personas = JSON.parse(fs.readFileSync('personas.json', 'utf-8'));

  console.log('Loading product state...');
  const productState = JSON.parse(fs.readFileSync('product-state.json', 'utf-8'));

  console.log('Initializing simulation engine...');
  const engine = new SimulationEngine(apiKey);

  console.log('Running simulations...');
  const allSessions = [];

  for (const persona of personas) {
    console.log(`Simulating user: ${persona.archetype}`);

    const sessions = await engine.simulateUserJourney(
      persona,
      productState,
      7,   // 7 days of usage
      1.0  // Real-time (no compression)
    );

    allSessions.push(...sessions);
  }

  console.log(`Completed ${allSessions.length} sessions`);

  // Analyze results
  console.log('Analyzing results...');
  const collector = new TelemetryCollector();
  const insights = await collector.analyze(allSessions);

  // Save results
  fs.writeFileSync(
    'results.json',
    JSON.stringify(insights, null, 2)
  );

  console.log('Results saved to results.json');

  // Print summary
  console.log('\n=== SIMULATION SUMMARY ===');
  console.log(`Total sessions: ${allSessions.length}`);
  console.log(`Friction points: ${insights.frictionPoints.length}`);
  console.log(`Value moments: ${insights.valueMoments.length}`);
  console.log(`Churn risk: ${(insights.churnProbability * 100).toFixed(1)}%`);
  console.log(`Viral coefficient: ${insights.viralCoefficient.toFixed(2)}`);
}

runSimulation().catch(console.error);
```

Run the simulation:

```bash
npx ts-node run-simulation.ts
```

## Understanding Results

After running the simulation, you'll have a `results.json` file with insights.

### Results Structure

```json
{
  "summary": {
    "totalSessions": 70,
    "totalPersonas": 10,
    "simulationDays": 7,
    "completionRate": 0.85
  },
  "frictionPoints": [
    {
      "feature": "onboarding",
      "description": "Tutorial too long for experienced users",
      "severity": "high",
      "affectedPersonas": 6,
      "timestamp": "2024-11-10T10:30:00Z"
    }
  ],
  "valueMoments": [
    {
      "feature": "quickAdd",
      "description": "Natural language task creation delighted users",
      "impact": "high",
      "affectedPersonas": 9,
      "timestamp": "2024-11-10T10:35:00Z"
    }
  ],
  "churnProbability": 0.15,
  "viralCoefficient": 1.2,
  "recommendations": [
    {
      "priority": "high",
      "action": "Add 'Skip Tutorial' option for experienced users",
      "expectedImpact": "Reduce friction for 60% of users"
    }
  ]
}
```

### Key Metrics Explained

- **Friction Points**: Where users struggled or got frustrated
- **Value Moments**: Where users realized product value
- **Churn Probability**: Likelihood users will stop using the product
- **Viral Coefficient**: Average referrals per user (>1 = viral growth)
- **Recommendations**: Prioritized actions to improve the product

### Analyzing Friction Points

```typescript
import fs from 'fs';

const results = JSON.parse(fs.readFileSync('results.json', 'utf-8'));

// Sort friction points by severity
const criticalFriction = results.frictionPoints
  .filter((fp: any) => fp.severity === 'high')
  .sort((a: any, b: any) => b.affectedPersonas - a.affectedPersonas);

console.log('Critical friction points to fix:');
criticalFriction.forEach((fp: any) => {
  console.log(`- ${fp.feature}: ${fp.description}`);
  console.log(`  Affects ${fp.affectedPersonas} personas`);
});
```

## Next Steps

Congratulations! You've run your first SUTS simulation. Here's what to do next:

### 1. Explore Examples

- [Basic Simulation](../examples/basic-simulation/) - Minimal working example
- [VibeAtlas Simulation](../examples/vibeatlas-simulation/) - Full-featured example
- [API Usage](../examples/api-usage/) - Programmatic usage patterns

### 2. Customize Configuration

Read [Configuration Guide](./CONFIGURATION.md) to learn about:
- Adjusting simulation parameters
- Tuning persona generation
- Performance optimization
- Advanced options

### 3. Build a Plugin

If you want to integrate SUTS with your specific product:
- Read [Plugin Development](./PLUGINS.md)
- Study [Custom Plugin Example](../examples/custom-plugin/)
- Check existing plugins in `plugins/`

### 4. Deep Dive into API

Review [API Reference](./API_REFERENCE.md) for:
- Complete API documentation
- Method signatures
- Advanced usage patterns
- Error handling

### 5. Join the Community

- Star the repo on [GitHub](https://github.com/your-org/suts-core)
- Join [GitHub Discussions](https://github.com/your-org/suts-core/discussions)
- Report bugs in [Issues](https://github.com/your-org/suts-core/issues)
- Contribute following [CONTRIBUTING.md](../CONTRIBUTING.md)

## Common Issues

### Simulation Taking Too Long

```typescript
// Increase time compression
const sessions = await engine.simulateUserJourney(
  persona,
  productState,
  7,
  10.0  // 10x time compression
);
```

### API Rate Limiting

```typescript
// Add delays between requests
for (const persona of personas) {
  const sessions = await engine.simulateUserJourney(/* ... */);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
}
```

### Out of Memory

```typescript
// Process personas in batches
const batchSize = 5;
for (let i = 0; i < personas.length; i += batchSize) {
  const batch = personas.slice(i, i + batchSize);
  // Process batch...
}
```

For more issues, see [Troubleshooting Guide](./TROUBLESHOOTING.md).

## Getting Help

- **Documentation**: Start with [docs/README.md](./README.md)
- **Examples**: Check [examples/](../examples/)
- **Issues**: [GitHub Issues](https://github.com/your-org/suts-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/suts-core/discussions)

---

**Next**: [Configuration Guide](./CONFIGURATION.md) | [API Reference](./API_REFERENCE.md)
