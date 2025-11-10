# SUTS (Synthetic User Testing System)

A modular, open-source system that simulates realistic user behaviors using LLMs to validate product decisions before shipping to real users.

## Overview

SUTS enables continuous validation, predictive analytics, and causal inference at scale by simulating 1000+ realistic user behaviors. Test product changes before deployment, predict user behavior with 85%+ accuracy after calibration, and identify friction, value moments, and viral triggers systematically.

## Features

- **Persona Generation**: LLM-based creation of realistic, diverse user personas
- **Simulation Engine**: Multi-agent system for executing realistic user journeys
- **Telemetry Layer**: Comprehensive event tracking and analytics
- **Modular Architecture**: Swap components without breaking the system
- **Type-Safe**: Built with TypeScript with strict type checking
- **High Test Coverage**: 95%+ code coverage with comprehensive test suite

## Architecture

```
suts-core/
├── packages/
│   ├── core/           # Interfaces, types, data models
│   ├── persona/        # Persona generation (LLM-based)
│   ├── simulation/     # Simulation engine
│   └── telemetry/      # Event tracking
├── plugins/
│   └── vibeatlas/      # VibeAtlas adapter (example)
├── tests/              # Integration tests
├── docs/               # API documentation
└── examples/           # Usage examples
```

## Quick Start

### Installation

```bash
npm install
```

### Build

```bash
npm run type-check
```

### Test

```bash
npm test
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run format
```

### Run CI Pipeline

```bash
npm run ci
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Run tests: `npm test`

### Monorepo Structure

This project uses npm workspaces for managing multiple packages. Each package in `packages/` and `plugins/` is independently publishable.

### Path Aliases

- `@core/*` -> `packages/core/src/*`
- `@persona/*` -> `packages/persona/src/*`
- `@simulation/*` -> `packages/simulation/src/*`
- `@telemetry/*` -> `packages/telemetry/src/*`

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and architecture
- [Contributing](./CONTRIBUTING.md) - Development workflow and coding standards
- [API Reference](./docs/api/) - Detailed API documentation

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development workflow and coding standards.

## Support

For issues and questions, please file a GitHub issue.
