# CLI Reference

Command-line interface documentation for SUTS.

## Table of Contents

1. [Installation](#installation)
2. [Global Commands](#global-commands)
3. [Persona Commands](#persona-commands)
4. [Simulation Commands](#simulation-commands)
5. [Analysis Commands](#analysis-commands)
6. [Configuration Commands](#configuration-commands)
7. [Utility Commands](#utility-commands)

---

## Installation

Install the SUTS CLI globally:

```bash
npm install -g @suts/cli
```

Or use npx without installation:

```bash
npx @suts/cli [command]
```

Verify installation:

```bash
suts --version
suts --help
```

---

## Global Commands

### suts --version

Display CLI version.

```bash
suts --version
# Output: @suts/cli v0.3.0
```

### suts --help

Display help information.

```bash
suts --help
```

### suts init

Initialize a new SUTS project.

```bash
suts init [project-name]
```

**Options:**
- `--template <name>`: Use a template (basic, advanced, plugin)
- `--skip-install`: Skip npm install

**Example:**
```bash
suts init my-simulation --template advanced
cd my-simulation
```

**Created Structure:**
```
my-simulation/
├── .env.example
├── suts.config.json
├── analysis/
├── personas/
├── simulations/
└── output/
```

---

## Persona Commands

### suts persona generate

Generate personas from stakeholder analysis.

```bash
suts persona generate <analysis-files...> [options]
```

**Options:**
- `-n, --num-personas <number>`: Number of personas (default: 30)
- `-d, --diversity <number>`: Diversity weight 0-1 (default: 0.8)
- `-o, --output <path>`: Output file path (default: ./personas.json)
- `--model <name>`: Claude model to use
- `--validate`: Validate generated personas

**Examples:**
```bash
# Generate 50 personas from analysis
suts persona generate ./analysis/*.md -n 50 -o personas.json

# High diversity personas
suts persona generate ./analysis/users.md -n 100 -d 0.9

# Validate personas after generation
suts persona generate ./analysis/*.md --validate
```

### suts persona list

List generated personas.

```bash
suts persona list <personas-file>
```

**Options:**
- `--filter <field=value>`: Filter personas
- `--format <format>`: Output format (table, json, csv)

**Examples:**
```bash
# List all personas
suts persona list personas.json

# Filter by experience level
suts persona list personas.json --filter experienceLevel=expert

# Export to CSV
suts persona list personas.json --format csv > personas.csv
```

### suts persona inspect

Inspect a specific persona.

```bash
suts persona inspect <personas-file> <persona-id>
```

**Example:**
```bash
suts persona inspect personas.json p-001
```

**Output:**
```
Persona: p-001
Archetype: Skeptical Senior Developer
Experience: expert
Company Size: enterprise

Pain Points:
- Too many tools in workflow
- Context switching overhead
- Meeting fatigue

Goals:
- Increase productivity
- Reduce cognitive load
...
```

---

## Simulation Commands

### suts simulate

Run a simulation.

```bash
suts simulate <config-file> [options]
```

**Options:**
- `-p, --personas <file>`: Personas file
- `-s, --sessions <number>`: Number of sessions
- `-c, --compression <number>`: Time compression factor
- `-o, --output <dir>`: Output directory
- `--parallel <number>`: Max parallel simulations
- `--resume <session-id>`: Resume failed simulation

**Examples:**
```bash
# Run simulation with config
suts simulate sim-config.json

# Override personas and sessions
suts simulate sim-config.json -p personas.json -s 14

# Fast simulation with compression
suts simulate sim-config.json -c 10.0

# Parallel execution
suts simulate sim-config.json --parallel 20
```

### suts simulate batch

Run multiple simulations.

```bash
suts simulate batch <config-dir> [options]
```

**Options:**
- `--parallel <number>`: Max parallel simulations
- `--stop-on-error`: Stop on first error
- `--output <dir>`: Output directory

**Example:**
```bash
# Run all simulations in directory
suts simulate batch ./simulations/ --parallel 5
```

### suts simulate status

Check simulation status.

```bash
suts simulate status [simulation-id]
```

**Example:**
```bash
suts simulate status sim-001
```

**Output:**
```
Simulation: sim-001
Status: Running
Progress: 35/100 personas (35%)
Elapsed: 5m 23s
Estimated remaining: 10m 15s
```

---

## Analysis Commands

### suts analyze

Analyze simulation results.

```bash
suts analyze <results-dir> [options]
```

**Options:**
- `--output <file>`: Output file for insights
- `--format <format>`: Output format (json, html, md)
- `--include-raw`: Include raw data
- `--detect-patterns`: Enable pattern detection
- `--infer-causality`: Enable causal inference

**Examples:**
```bash
# Basic analysis
suts analyze ./output/sim-001

# Generate HTML report
suts analyze ./output/sim-001 --format html -o report.html

# Deep analysis with patterns
suts analyze ./output/sim-001 --detect-patterns --infer-causality
```

### suts analyze friction

Analyze friction points.

```bash
suts analyze friction <results-dir> [options]
```

**Options:**
- `--severity <level>`: Filter by severity (low, medium, high, critical)
- `--feature <name>`: Filter by feature
- `--min-personas <number>`: Minimum affected personas

**Example:**
```bash
# High severity friction only
suts analyze friction ./output/sim-001 --severity high
```

### suts analyze value

Analyze value moments.

```bash
suts analyze value <results-dir> [options]
```

**Example:**
```bash
suts analyze value ./output/sim-001 --impact high
```

### suts analyze go-no-go

Make GO/NO-GO recommendation.

```bash
suts analyze go-no-go <results-dir> [options]
```

**Options:**
- `--criteria <file>`: Decision criteria JSON
- `--threshold-satisfaction <number>`: Min satisfaction (0-1)
- `--threshold-churn <number>`: Max churn risk (0-1)
- `--threshold-viral <number>`: Min viral coefficient

**Example:**
```bash
suts analyze go-no-go ./output/sim-001 \
  --threshold-satisfaction 0.7 \
  --threshold-churn 0.2 \
  --threshold-viral 1.0
```

**Output:**
```
GO/NO-GO DECISION: GO

Confidence: 85%

Metrics:
- Satisfaction: 0.82 (target: 0.70) ✓
- Churn Risk: 0.15 (max: 0.20) ✓
- Viral Coefficient: 1.23 (min: 1.00) ✓

Top Recommendations:
1. [HIGH] Fix onboarding friction for novice users
2. [MEDIUM] Add keyboard shortcuts for power users
3. [LOW] Improve mobile responsiveness
```

---

## Configuration Commands

### suts config init

Initialize configuration file.

```bash
suts config init [options]
```

**Options:**
- `--template <name>`: Template (minimal, standard, advanced)
- `--output <file>`: Output file path

**Example:**
```bash
suts config init --template advanced -o suts.config.json
```

### suts config validate

Validate configuration file.

```bash
suts config validate <config-file>
```

**Example:**
```bash
suts config validate suts.config.json
```

### suts config show

Display current configuration.

```bash
suts config show [config-file]
```

---

## Utility Commands

### suts doctor

Check system health and configuration.

```bash
suts doctor
```

**Output:**
```
SUTS Health Check
=================

✓ Node.js version: v18.17.0
✓ npm version: 9.8.1
✓ ANTHROPIC_API_KEY: Found
✓ API connectivity: OK
✓ Disk space: 45.2 GB available
✓ Memory: 8 GB available

All checks passed!
```

### suts clean

Clean temporary files and cache.

```bash
suts clean [options]
```

**Options:**
- `--cache`: Clean cache only
- `--output`: Clean output directory
- `--all`: Clean everything

**Example:**
```bash
suts clean --cache
```

### suts export

Export data in various formats.

```bash
suts export <input> <output> [options]
```

**Options:**
- `--format <format>`: Output format (json, csv, excel, html)
- `--include <fields>`: Fields to include
- `--compress`: Compress output

**Example:**
```bash
# Export to CSV
suts export ./output/sim-001 ./report.csv --format csv

# Export to Excel with compression
suts export ./output/sim-001 ./report.xlsx --format excel --compress
```

### suts serve

Start web dashboard.

```bash
suts serve [options]
```

**Options:**
- `-p, --port <number>`: Port (default: 3000)
- `-h, --host <host>`: Host (default: localhost)
- `--data-dir <path>`: Data directory

**Example:**
```bash
suts serve --port 8080
```

**Output:**
```
SUTS Dashboard running at:
  http://localhost:8080

Press Ctrl+C to stop.
```

---

## Environment Variables

CLI respects these environment variables:

```bash
ANTHROPIC_API_KEY=sk-ant-...
SUTS_CONFIG_PATH=./suts.config.json
SUTS_DATA_DIR=./data
SUTS_OUTPUT_DIR=./output
SUTS_LOG_LEVEL=info
SUTS_CACHE_ENABLED=true
```

---

## Scripting and Automation

### Bash Script Example

```bash
#!/bin/bash

# Generate personas
suts persona generate ./analysis/*.md -n 100 -o personas.json

# Run simulation
suts simulate sim-config.json -p personas.json -o ./output

# Analyze results
suts analyze ./output --format html -o report.html

# Check GO/NO-GO
suts analyze go-no-go ./output --threshold-satisfaction 0.7

echo "Simulation complete!"
```

### CI/CD Integration

```yaml
# .github/workflows/suts.yml
name: SUTS Simulation

on:
  pull_request:
    paths:
      - 'analysis/**'
      - 'suts.config.json'

jobs:
  simulate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install SUTS CLI
        run: npm install -g @suts/cli

      - name: Run Simulation
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          suts persona generate ./analysis/*.md -n 50
          suts simulate sim-config.json
          suts analyze ./output --format html

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: suts-report
          path: ./output/report.html
```

---

## Troubleshooting

### Command Not Found

```bash
# Check installation
npm list -g @suts/cli

# Reinstall
npm install -g @suts/cli --force
```

### API Key Errors

```bash
# Verify API key
suts doctor

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...
```

### Permission Errors

```bash
# Use npx instead
npx @suts/cli [command]

# Or fix permissions
sudo chown -R $(whoami) ~/.npm
```

---

**Next**: [Troubleshooting Guide](./TROUBLESHOOTING.md) | [API Reference](./API_REFERENCE.md)
