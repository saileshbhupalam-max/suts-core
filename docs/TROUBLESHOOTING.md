# Troubleshooting Guide

Common issues and their solutions when using SUTS.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [API and Authentication](#api-and-authentication)
3. [Runtime Errors](#runtime-errors)
4. [Performance Issues](#performance-issues)
5. [Configuration Problems](#configuration-problems)
6. [Output and Results](#output-and-results)
7. [Getting Further Help](#getting-further-help)

---

## Installation Issues

### Node Version Too Old

**Problem:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check current version
node --version

# Install Node 18+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version  # Should be v18.0.0 or higher
```

### npm Permission Errors

**Problem:**
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Option 1: Use npx (recommended)
npx @suts/cli [command]

# Option 2: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Option 3: Use node version manager
nvm install 18
```

### Package Installation Fails

**Problem:**
```
npm ERR! network timeout
```

**Solution:**
```bash
# Increase timeout
npm config set timeout 60000

# Use different registry
npm config set registry https://registry.npmjs.org/

# Clear cache and retry
npm cache clean --force
npm install
```

### TypeScript Compilation Errors

**Problem:**
```
error TS2304: Cannot find name 'PersonaProfile'
```

**Solution:**
```bash
# Reinstall dependencies
npm install

# Rebuild TypeScript
npm run type-check

# Check tsconfig.json paths are correct
cat tsconfig.json

# Clean and rebuild
npm run clean
npm run type-check
```

---

## API and Authentication

### API Key Not Found

**Problem:**
```
Error: ANTHROPIC_API_KEY not found in environment
```

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Add API key to .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Or export directly
export ANTHROPIC_API_KEY=sk-ant-...

# Verify
echo $ANTHROPIC_API_KEY
```

### Invalid API Key

**Problem:**
```
Error: Invalid API key provided
```

**Solution:**
1. Get new API key from [console.anthropic.com](https://console.anthropic.com/)
2. Ensure no extra spaces or newlines
3. Check key starts with `sk-ant-api03-`
4. Verify key has not expired

```bash
# Test API key
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

### Rate Limiting

**Problem:**
```
Error: Rate limit exceeded (429)
```

**Solution:**
```typescript
// Add delays between requests
import { setTimeout } from 'timers/promises';

for (const persona of personas) {
  const sessions = await engine.simulateUserJourney(/* ... */);
  await setTimeout(1000); // 1 second delay
}

// Or configure in .env
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT_MS=30000
```

### Network Timeouts

**Problem:**
```
Error: Request timeout after 30000ms
```

**Solution:**
```bash
# Increase timeout in .env
REQUEST_TIMEOUT_MS=60000  # 60 seconds

# Or in code
const engine = new SimulationEngine(apiKey, {
  timeout: 60000
});
```

---

## Runtime Errors

### Cannot Find Module

**Problem:**
```
Error: Cannot find module '@suts/persona'
```

**Solution:**
```bash
# Install missing dependencies
npm install @suts/persona

# Or install all SUTS packages
npm install @suts/core @suts/persona @suts/simulation @suts/telemetry

# Check package.json
cat package.json

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Import Path Issues

**Problem:**
```
Error: Cannot resolve module '@core/types'
```

**Solution:**
```typescript
// Use correct import paths
import { PersonaProfile } from '@suts/persona';  // Not '@persona'
import type { EmotionalState } from '@suts/core'; // Not '@core'

// Or use relative imports
import { PersonaProfile } from '../node_modules/@suts/persona';
```

Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@suts/*": ["node_modules/@suts/*"]
    }
  }
}
```

### File Not Found Errors

**Problem:**
```
Error: ENOENT: no such file or directory './analysis/users.md'
```

**Solution:**
```bash
# Check file exists
ls -la ./analysis/users.md

# Use absolute path
const personas = await generator.generateFromStakeholderAnalysis(
  ['/absolute/path/to/analysis/users.md'],
  50,
  0.8
);

# Or check current directory
console.log('Current directory:', process.cwd());
```

### Zod Validation Errors

**Problem:**
```
ZodError: Invalid input
  path: ["personas", 0, "riskTolerance"]
  message: "Number must be less than or equal to 1"
```

**Solution:**
```typescript
// Ensure values are in valid ranges
const persona = {
  riskTolerance: 0.8,  // Must be 0-1
  patienceLevel: 0.5,  // Must be 0-1
  // ...
};

// Validate before use
import { personaSchema } from '@suts/persona';

try {
  personaSchema.parse(persona);
} catch (error) {
  console.error('Validation failed:', error);
}
```

---

## Performance Issues

### Simulation Takes Too Long

**Problem:**
Simulation running for hours with no progress.

**Solution:**
```typescript
// 1. Increase time compression
await engine.simulateUserJourney(
  persona,
  productState,
  7,
  10.0  // 10x faster
);

// 2. Reduce number of sessions
await engine.simulateUserJourney(
  persona,
  productState,
  3,  // Fewer days
  1.0
);

// 3. Run in parallel
const results = await Promise.all(
  personas.slice(0, 10).map(p =>
    engine.simulateUserJourney(p, productState, 7, 1.0)
  )
);

// 4. Enable caching
// In .env
CACHE_ENABLED=true
CACHE_TTL_SECONDS=7200
```

### High Memory Usage

**Problem:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"  # 4GB

# Or in package.json
{
  "scripts": {
    "simulate": "node --max-old-space-size=4096 simulate.js"
  }
}
```

```typescript
// Process in batches
const batchSize = 10;
for (let i = 0; i < personas.length; i += batchSize) {
  const batch = personas.slice(i, i + batchSize);

  const results = await Promise.all(
    batch.map(p => engine.simulateUserJourney(p, productState, 7, 1.0))
  );

  // Save results
  fs.writeFileSync(
    `output/batch-${i}.json`,
    JSON.stringify(results)
  );

  // Clear memory
  if (global.gc) global.gc();
}
```

### API Rate Limiting

**Problem:**
Too many API requests causing 429 errors.

**Solution:**
```typescript
// Use rate limiter
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 5 }); // 5 concurrent requests

const results = await Promise.all(
  personas.map(p =>
    queue.add(() =>
      engine.simulateUserJourney(p, productState, 7, 1.0)
    )
  )
);
```

---

## Configuration Problems

### Invalid Configuration File

**Problem:**
```
Error: Invalid configuration: numSessions must be a number
```

**Solution:**
```bash
# Validate configuration
npx @suts/cli config validate suts.config.json

# Check JSON syntax
cat suts.config.json | jq .

# Common issues:
# - Missing commas
# - Trailing commas (invalid in JSON)
# - Unquoted keys
# - Wrong data types
```

### Environment Variables Not Loading

**Problem:**
`process.env.ANTHROPIC_API_KEY` is undefined.

**Solution:**
```typescript
// Load dotenv at the very start
import dotenv from 'dotenv';
dotenv.config();

// Verify loaded
console.log('API Key loaded:', Boolean(process.env.ANTHROPIC_API_KEY));

// Check .env file location
import path from 'path';
console.log('.env path:', path.join(process.cwd(), '.env'));

// Specify custom path
dotenv.config({ path: '/custom/path/.env' });
```

---

## Output and Results

### Empty Results

**Problem:**
Simulation completes but results are empty.

**Solution:**
```typescript
// Check sessions are actually generated
const sessions = await engine.simulateUserJourney(/* ... */);
console.log('Sessions generated:', sessions.length);

// Verify telemetry collection
const collector = new TelemetryCollector();
const insights = await collector.analyze(sessions);
console.log('Insights:', JSON.stringify(insights, null, 2));

// Check output directory
fs.mkdirSync('./output', { recursive: true });
```

### Corrupted Output Files

**Problem:**
Cannot parse output JSON files.

**Solution:**
```bash
# Validate JSON
cat output/results.json | jq .

# Check file size
ls -lh output/results.json

# Recreate output directory
rm -rf output
mkdir output

# Run simulation again with error handling
try {
  const results = await runSimulation();
  fs.writeFileSync(
    'output/results.json',
    JSON.stringify(results, null, 2)
  );
} catch (error) {
  console.error('Simulation failed:', error);
}
```

### Missing Insights

**Problem:**
Analysis doesn't show expected friction points or value moments.

**Solution:**
```typescript
// Enable detailed analysis
const insights = await collector.analyze(sessions, {
  detectPatterns: true,
  inferCausality: true,
  minFrictionSeverity: 'low'  // Include all friction
});

// Check raw telemetry
sessions.forEach(session => {
  console.log('Session telemetry:', session.telemetry);
});

// Verify personas have diverse characteristics
personas.forEach(p => {
  console.log(`${p.archetype}: risk=${p.riskTolerance}, patience=${p.patienceLevel}`);
});
```

---

## Getting Further Help

### Check Documentation

1. [Getting Started Guide](./GETTING_STARTED.md)
2. [API Reference](./API_REFERENCE.md)
3. [Configuration Guide](./CONFIGURATION.md)
4. [FAQ](./FAQ.md)

### GitHub Resources

- **Search Issues**: [GitHub Issues](https://github.com/your-org/suts-core/issues)
- **Ask Questions**: [GitHub Discussions](https://github.com/your-org/suts-core/discussions)
- **Report Bugs**: [New Issue](https://github.com/your-org/suts-core/issues/new)

### Debug Mode

Enable detailed logging:

```bash
# In .env
DEBUG=true
LOG_LEVEL=debug
LOG_FILE=./logs/debug.log
```

```typescript
// In code
import debug from 'debug';
const log = debug('suts:simulation');

log('Starting simulation with %d personas', personas.length);
```

### System Health Check

```bash
# Run health check
npx @suts/cli doctor

# Check versions
node --version
npm --version
npx @suts/cli --version

# Check disk space
df -h

# Check memory
free -h  # Linux
vm_stat  # macOS
```

### Creating a Bug Report

Include this information:

```markdown
## Bug Report

**SUTS Version**: 0.3.0
**Node Version**: v18.17.0
**OS**: macOS 13.5

**Description**:
[Describe the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Error occurs]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Error Message**:
```
[Paste error message]
```

**Configuration**:
```json
[Paste relevant config]
```

**Logs**:
```
[Paste relevant logs]
```
```

---

**Next**: [FAQ](./FAQ.md) | [Getting Started](./GETTING_STARTED.md)
