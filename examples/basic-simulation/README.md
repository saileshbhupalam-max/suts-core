# Basic Simulation Example

The simplest possible SUTS simulation. Perfect for learning the basics.

## What This Example Does

This example demonstrates:
- Generating 10 diverse personas from stakeholder analysis
- Running a 7-day simulation for a generic task management app
- Analyzing results to find friction points and value moments
- Making a GO/NO-GO decision based on thresholds

## Quick Start

```bash
# 1. Navigate to this directory
cd examples/basic-simulation

# 2. Install dependencies (if not already installed at root)
cd ../.. && npm install && cd examples/basic-simulation

# 3. Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# 4. Run the simulation
npx ts-node run-simulation.ts
```

## Files

- `README.md` - This file
- `simulation.json` - Simulation configuration
- `analysis/stakeholder-analysis.md` - User research and personas
- `run-simulation.ts` - Main simulation script
- `expected-output/` - Sample expected results

## Expected Runtime

- Persona generation: ~30 seconds (10 personas)
- Simulation: ~3 minutes (10 personas × 7 sessions)
- Analysis: ~5 seconds
- **Total**: ~4 minutes

## Configuration

### simulation.json

```json
{
  "name": "Basic Task Manager Test",
  "personas": {
    "source": "analysis/stakeholder-analysis.md",
    "count": 10
  },
  "execution": {
    "numSessions": 7,
    "timeCompression": 1.0
  }
}
```

### Personas

10 personas representing diverse users:
- Solo indie developers
- Startup team members
- Enterprise employees
- Varying experience levels (novice to expert)
- Different priorities (speed, features, security)

### Product Under Test

Generic task management application with:
- Quick task creation
- Basic organization (lists, tags)
- Collaboration features
- Mobile access

## Expected Results

### Friction Points

Common issues found in this simulation:
1. Onboarding tutorial too long for experienced users
2. Mobile app missing key features from web
3. Collaboration requires too many clicks
4. No keyboard shortcuts for power users

### Value Moments

Positive experiences:
1. Quick task entry with natural language
2. Simple, clean interface
3. Fast performance
4. Reliable sync across devices

### Metrics

Typical results:
- Completion rate: 85%
- Average satisfaction: 0.72
- Churn probability: 0.18
- Viral coefficient: 0.9 (below viral threshold)

### GO/NO-GO Decision

With standard thresholds:
- Min satisfaction: 0.70 ✓ (0.72)
- Max churn: 0.20 ✓ (0.18)
- Min viral: 1.0 ✗ (0.9)

**Decision**: GO (with reservations)
**Recommendation**: Improve referral mechanics before launch

## Customization

### Change Number of Personas

Edit `simulation.json`:
```json
{
  "personas": {
    "count": 50  // Changed from 10
  }
}
```

### Change Simulation Duration

Edit `simulation.json`:
```json
{
  "execution": {
    "numSessions": 14  // Changed from 7 (2 weeks)
  }
}
```

### Speed Up Simulation

Edit `simulation.json`:
```json
{
  "execution": {
    "timeCompression": 10.0  // 10x faster
  }
}
```

## Next Steps

After completing this example:

1. **[VibeAtlas Simulation](../vibeatlas-simulation/)** - Full-featured example with real product
2. **[API Usage](../api-usage/)** - Programmatic API usage patterns
3. **[Custom Plugin](../custom-plugin/)** - Build your own product adapter

## Troubleshooting

### API Key Error

```
Error: ANTHROPIC_API_KEY not found
```

**Solution:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Timeout Errors

If simulation times out, increase compression:
```json
{
  "execution": {
    "timeCompression": 5.0
  }
}
```

### Out of Memory

Process personas in batches:
```typescript
const batchSize = 5;
for (let i = 0; i < personas.length; i += batchSize) {
  const batch = personas.slice(i, i + batchSize);
  // Process batch...
}
```

## Learning Objectives

By completing this example, you'll learn:
- ✓ How to structure a stakeholder analysis
- ✓ How to generate diverse personas
- ✓ How to configure and run a simulation
- ✓ How to interpret simulation results
- ✓ How to make data-driven GO/NO-GO decisions

---

**Estimated Time**: 15 minutes
**Difficulty**: Beginner
**Prerequisites**: Node.js 18+, Anthropic API key
