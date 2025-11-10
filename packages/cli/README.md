# @suts/cli

Command-line interface for SUTS (Synthetic User Testing System).

## Installation

```bash
npm install -g @suts/cli
```

## Commands

### `suts run` - Run Complete Simulation

Execute a full SUTS simulation from start to finish.

```bash
suts run --config simulation.json [options]
```

**Options:**
- `-c, --config <file>` - Simulation configuration file (required)
- `-o, --output <dir>` - Output directory (default: `./suts-output`)
- `-p, --personas <number>` - Number of personas to generate
- `-d, --days <number>` - Number of simulation days
- `--product <plugin>` - Product plugin to use
- `-v, --verbose` - Enable verbose logging
- `-j, --json` - Output JSON only (no progress bars)

**Example:**
```bash
suts run --config examples/simulation.json --output ./results --verbose
```

### `suts generate-personas` - Generate Personas

Generate synthetic user personas without running a full simulation.

```bash
suts generate-personas --count 100 [options]
```

**Options:**
- `-n, --count <number>` - Number of personas to generate (required)
- `-o, --output <file>` - Output file (default: `./personas.json`)
- `-d, --diversity <number>` - Diversity factor 0-1 (default: 0.8)
- `-v, --verbose` - Enable verbose logging
- `-j, --json` - Output JSON only

**Example:**
```bash
suts generate-personas --count 50 --diversity 0.9 --output my-personas.json
```

### `suts analyze` - Analyze Telemetry

Analyze existing telemetry data from a simulation.

```bash
suts analyze --events events.json [options]
```

**Options:**
- `-e, --events <file>` - Events JSON file to analyze (required)
- `-o, --output <dir>` - Output directory (default: `./suts-analysis`)
- `-v, --verbose` - Enable verbose logging
- `-j, --json` - Output JSON only

**Example:**
```bash
suts analyze --events ./suts-output/events.json --output ./analysis
```

### `suts version` - Show Version

Display the current version of SUTS CLI.

```bash
suts --version
# or
suts -V
```

### `suts help` - Show Help

Display help information for SUTS CLI or a specific command.

```bash
suts --help
suts help run
```

## Configuration

### Simulation Configuration File

The `suts run` command requires a JSON configuration file with the following structure:

```json
{
  "simulation": {
    "personas": 100,
    "days": 7,
    "product": "vibeatlas"
  },
  "personas": {
    "analysisFiles": ["./analysis/*.md"],
    "diversity": 0.8
  },
  "output": {
    "directory": "./suts-output",
    "format": "json",
    "generateReport": true
  },
  "thresholds": {
    "positioning": 0.60,
    "retention": 0.80,
    "viral": 0.25
  }
}
```

**Configuration Options:**

#### `simulation` (required)
- `personas` (number): Number of personas to generate (default: 100)
- `days` (number): Number of simulation days (default: 7)
- `product` (string, required): Product plugin name

#### `personas` (optional)
- `analysisFiles` (string[]): Paths to analysis files for persona generation
- `diversity` (number): Diversity factor between 0-1 (default: 0.8)

#### `output` (optional)
- `directory` (string): Output directory path (default: "./suts-output")
- `format` ("json" | "csv" | "html"): Output format (default: "json")
- `generateReport` (boolean): Generate human-readable report (default: true)

#### `thresholds` (optional)
- `positioning` (number): Positioning threshold 0-1 (default: 0.60)
- `retention` (number): Retention threshold 0-1 (default: 0.80)
- `viral` (number): Viral coefficient threshold 0-1 (default: 0.25)

### Example Configuration

See `examples/simulation.json` for a complete example configuration.

## Output

### Run Command Output

The `suts run` command generates the following files in the output directory:

```
./suts-output/
├── summary.json          # Executive summary
├── personas.json         # Generated personas
├── events.json           # All telemetry events
├── friction-points.json  # Detected friction points
├── value-moments.json    # Detected value moments
└── go-no-go.json        # Go/No-Go decision with reasoning
```

### Summary Output

When running without `--json` flag, a formatted summary is displayed:

```
=== SUTS Simulation Summary ===

Simulation Details:
  Product: vibeatlas
  Personas: 100
  Days Simulated: 7
  Total Events: 5,000
  Duration: 10.50s

Key Metrics:
  Positioning Score: 65.5%
  Retention Score: 85.2%
  Viral Coefficient: 30.1%

Analysis:
  Friction Points: 3
  Value Moments: 12

Go/No-Go Decision:
  Decision: GO ✓
  Confidence: 85.0%
  Reasoning: All key metrics meet or exceed thresholds. Product shows strong market fit.
```

## Development

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

### Type Checking

```bash
npm run type-check        # Run TypeScript compiler checks
```

### Building

```bash
npm run build            # Compile TypeScript to JavaScript
```

## Architecture

The CLI package is organized into the following modules:

- **commands/** - Command implementations (run, generate-personas, analyze)
- **config/** - Configuration loading and validation (Zod schemas)
- **errors/** - Error types and error handling
- **output/** - Results writing and summary generation
- **progress/** - Progress bars, logging, and status reporting

## License

MIT
