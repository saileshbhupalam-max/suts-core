# SUTS Integration Test Suite

Comprehensive integration tests that validate the entire SUTS system works end-to-end with real workflows, contract validation, smoke tests, and stress tests.

## Test Structure

```
tests/integration/
├── e2e/                      # End-to-end workflows
│   ├── full-simulation.test.ts
│   └── network-effects.test.ts
├── contracts/                # Contract tests (package boundaries)
│   ├── persona-simulation.test.ts
│   ├── simulation-telemetry.test.ts
│   ├── telemetry-analysis.test.ts
│   ├── analysis-decision.test.ts
│   ├── plugin-adapter.test.ts
│   └── network-simulation.test.ts
├── smoke/                    # Smoke tests (critical paths)
│   ├── all-packages-load.test.ts
│   ├── basic-simulation.test.ts
│   └── cli-basic.test.ts
├── stress/                   # Performance/load tests
│   ├── large-simulation.test.ts
│   ├── concurrent-simulations.test.ts
│   └── telemetry-volume.test.ts
├── fixtures/                 # Test data
│   ├── personas.json
│   ├── simulation-config.json
│   └── minimal-config.json
├── helpers/                  # Test utilities
│   └── test-utils.ts
├── setup.ts                  # Test environment setup
├── globalSetup.ts            # Global test setup
├── globalTeardown.ts         # Global test cleanup
└── README.md                 # This file
```

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test Suites

```bash
# Fast smoke tests (< 30s)
npm run test:integration:smoke

# Contract validation tests
npm run test:integration:contracts

# End-to-end workflow tests
npm run test:integration:e2e

# Performance/stress tests
npm run test:integration:stress
```

### Run All Tests (Unit + Integration)

```bash
npm run test:all
```

## Test Categories

### 1. Smoke Tests (`smoke/`)

**Purpose:** Fast validation that critical paths work

**Characteristics:**
- Complete in < 30 seconds total
- Test basic functionality
- Verify all packages load without errors
- Run minimal simulations to ensure basic operations work

**Tests:**
- `all-packages-load.test.ts`: Verify all packages and classes can be loaded
- `basic-simulation.test.ts`: Run minimal simulation (3 personas, 1 day)
- `cli-basic.test.ts`: Verify CLI modules load correctly

**When to run:** Before every commit, in pre-commit hooks

### 2. Contract Tests (`contracts/`)

**Purpose:** Validate interfaces between packages

**Characteristics:**
- Test package boundaries
- Ensure data contracts are maintained
- Validate schema compliance
- Verify inter-package compatibility

**Tests:**
- `persona-simulation.test.ts`: PersonaGenerator → SimulationEngine
- `simulation-telemetry.test.ts`: SimulationEngine → Telemetry
- `telemetry-analysis.test.ts`: Telemetry → AnalysisEngine
- `analysis-decision.test.ts`: AnalysisEngine → DecisionSystem
- `plugin-adapter.test.ts`: IProductAdapter interface compliance
- `network-simulation.test.ts`: Simulation → NetworkSimulator

**When to run:** After API changes, before releases

### 3. End-to-End Tests (`e2e/`)

**Purpose:** Validate complete workflows from start to finish

**Characteristics:**
- Test realistic user scenarios
- Validate entire pipeline
- Use real components (no mocks)
- Generate actionable results

**Tests:**
- `full-simulation.test.ts`: Complete workflow from personas to decision
- `network-effects.test.ts`: Viral spread and network effects integration

**When to run:** Before releases, in CI/CD pipeline

### 4. Stress Tests (`stress/`)

**Purpose:** Validate performance and scalability

**Characteristics:**
- Test with large data volumes
- Verify performance under load
- Check memory efficiency
- Validate concurrent operations

**Tests:**
- `large-simulation.test.ts`: 50-100 personas, 7-30 days
- `concurrent-simulations.test.ts`: Multiple simulations in parallel
- `telemetry-volume.test.ts`: High-volume event tracking (100K events)

**When to run:** Before performance-critical releases, weekly

## Test Fixtures

### `personas.json`

Contains 3 diverse persona profiles for testing:
1. Skeptical Senior Developer (low risk tolerance)
2. Eager Junior Developer (high risk tolerance)
3. Pragmatic Tech Lead (medium risk tolerance)

### `simulation-config.json`

Standard simulation configuration:
- 10 personas
- 7 days
- Full feature set enabled

### `minimal-config.json`

Minimal configuration for fast tests:
- 3 personas
- 1 day
- Basic features only

## Test Utilities

### `test-utils.ts`

Provides helper functions:
- `generateMockPersonas(count)`: Create test personas
- `generateMockEvents(count)`: Create test events
- `generateMockProductState()`: Create test product state
- `loadFixture(filename)`: Load JSON fixture
- `cleanupTestOutput()`: Remove test output directories
- `measureTime(fn)`: Measure execution time
- `waitFor(condition)`: Wait for async conditions

## Configuration

### `jest.config.integration.js`

Integration-specific Jest configuration:
- 30s default timeout (tests can override)
- 4 parallel workers
- Coverage thresholds: 80% statements/functions, 70% branches
- Verbose output
- Real timers (no fake timers)

## Quality Standards

All integration tests must meet these standards:

- No flaky tests (100% pass rate across 3 runs)
- Deterministic results (no random failures)
- Fast execution (smoke tests < 30s)
- Clean up after themselves (no test artifacts)
- ASCII-only code (no special characters)
- Clear, descriptive test names
- Comprehensive assertions

## Success Criteria

Before marking the test suite as complete:

- [ ] `npm run test:integration:smoke` passes (< 30s)
- [ ] `npm run test:integration:contracts` passes
- [ ] `npm run test:integration:e2e` passes
- [ ] `npm run test:integration:stress` passes
- [ ] Complete suite passes 3 consecutive times
- [ ] No console errors or warnings
- [ ] All test artifacts cleaned up
- [ ] Documentation updated

## Performance Benchmarks

Expected performance on standard hardware:

| Test Suite | Tests | Duration | Events Generated |
|------------|-------|----------|------------------|
| Smoke      | 14    | < 30s    | ~100            |
| Contracts  | 30+   | ~2min    | ~1,000          |
| E2E        | 10+   | ~5min    | ~5,000          |
| Stress     | 12+   | ~10min   | ~100,000        |
| **Total**  | **65+** | **~18min** | **~106,000** |

## Troubleshooting

### Tests Timing Out

- Check if simulation is stuck in infinite loop
- Verify network isn't blocking (mock external calls)
- Increase timeout for specific test with `jest.setTimeout()`

### Memory Issues

- Ensure test cleanup is working (`cleanupTestOutput()`)
- Check for event listener leaks
- Run with `--detectLeaks` flag

### Flaky Tests

- Check for race conditions
- Verify test isolation (no shared state)
- Use `waitFor()` instead of fixed delays
- Check for timing-dependent assertions

### CI/CD Failures

- Verify all dependencies are installed
- Check environment variables
- Ensure sufficient resources (memory/CPU)
- Review CI logs for specific errors

## Contributing

When adding new integration tests:

1. Choose the appropriate category (smoke/contract/e2e/stress)
2. Follow existing patterns and naming conventions
3. Add test to relevant section in this README
4. Ensure tests pass locally 3 times
5. Update success criteria if needed
6. Add performance benchmarks for stress tests

## Related Documentation

- [Main README](../../README.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Unit Test Guide](../README.md)
- [API Documentation](../../docs/api/)
