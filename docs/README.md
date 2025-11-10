# SUTS Documentation

Welcome to the SUTS (Synthetic User Testing System) documentation. This guide will help you understand, install, and use SUTS for simulating realistic user behaviors at scale.

## Documentation Index

### Getting Started

- **[Getting Started Guide](./GETTING_STARTED.md)** - Complete setup guide from installation to your first simulation
  - Installation steps
  - Environment configuration
  - First simulation walkthrough
  - Troubleshooting setup issues

### Core Concepts

- **[Architecture](./ARCHITECTURE.md)** - System design and architectural decisions
  - High-level architecture
  - Core components
  - Data flow
  - Design patterns
  - Extension points

### API Documentation

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation for all packages
  - @suts/core - Types and interfaces
  - @suts/persona - Persona generation
  - @suts/simulation - Simulation engine
  - @suts/telemetry - Event tracking
  - @suts/network - Network effects
  - @suts/analysis - Pattern detection
  - @suts/decision - Decision system
  - All method signatures, parameters, and return types

### Configuration

- **[Configuration Guide](./CONFIGURATION.md)** - All configuration options explained
  - Environment variables
  - Simulation configuration
  - Persona generation settings
  - Performance tuning
  - Advanced options

### Development

- **[Plugin Development](./PLUGINS.md)** - Build custom product adapters
  - Plugin system overview
  - Creating a product adapter
  - Implementing telemetry integration
  - Testing plugins
  - Publishing plugins

- **[CLI Reference](./CLI_REFERENCE.md)** - Command-line interface documentation
  - Available commands
  - Command options
  - Usage examples
  - Scripting and automation

### Troubleshooting & Help

- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions
  - Installation problems
  - Runtime errors
  - Performance issues
  - API errors
  - Configuration mistakes

- **[FAQ](./FAQ.md)** - Frequently asked questions
  - General questions
  - Technical questions
  - Pricing and licensing
  - Comparison with alternatives

## Quick Links

### For New Users
1. Start with [Getting Started](./GETTING_STARTED.md)
2. Review [Architecture](./ARCHITECTURE.md) to understand the system
3. Explore [examples/](../examples/) for working code
4. Check [Configuration](./CONFIGURATION.md) for customization

### For Developers
1. Read [Plugin Development](./PLUGINS.md) to extend SUTS
2. Reference [API Documentation](./API_REFERENCE.md) for implementation details
3. Review [Architecture](./ARCHITECTURE.md) for design patterns
4. Check [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

### For Troubleshooting
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md) first
2. Review [FAQ](./FAQ.md) for common questions
3. Search [GitHub Issues](https://github.com/your-org/suts-core/issues)
4. Ask in [GitHub Discussions](https://github.com/your-org/suts-core/discussions)

## Learning Path

### Beginner Path (0-1 hour)
1. Read main [README.md](../README.md) for overview
2. Follow [Getting Started](./GETTING_STARTED.md) to run your first simulation
3. Explore [examples/basic-simulation](../examples/basic-simulation/)
4. Review [Configuration](./CONFIGURATION.md) for customization

### Intermediate Path (1-4 hours)
1. Study [Architecture](./ARCHITECTURE.md) to understand system design
2. Read [API Reference](./API_REFERENCE.md) for detailed APIs
3. Explore [examples/vibeatlas-simulation](../examples/vibeatlas-simulation/)
4. Review [examples/api-usage](../examples/api-usage/) for programmatic usage

### Advanced Path (4+ hours)
1. Read [Plugin Development](./PLUGINS.md) thoroughly
2. Study [examples/custom-plugin](../examples/custom-plugin/)
3. Review source code in packages/
4. Contribute following [CONTRIBUTING.md](../CONTRIBUTING.md)

## Documentation Standards

All SUTS documentation follows these principles:

- **Clear**: Written for users of all skill levels
- **Concise**: No unnecessary verbosity
- **Complete**: Covers all features and edge cases
- **Current**: Updated with each release
- **Correct**: Technically accurate and tested
- **Consistent**: Uniform style and terminology

## Terminology

- **Persona**: A synthetic user with psychological profile, goals, and behaviors
- **Simulation**: Execution of user journeys over multiple sessions
- **Session**: A single usage session (e.g., one day of usage)
- **Telemetry**: Event tracking and analytics data
- **Product State**: The current state of the product being tested
- **Plugin**: A product-specific adapter that integrates SUTS with your product
- **Friction Point**: A point where users experience difficulty or frustration
- **Value Moment**: A point where users realize product value
- **Viral Trigger**: An event that prompts users to share or refer

## Contributing to Documentation

Documentation improvements are always welcome! To contribute:

1. Fork the repository
2. Edit documentation files (Markdown)
3. Test all code examples
4. Check links are valid
5. Run spell-check
6. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## Version History

- **v0.3.0** - Complete documentation suite with examples
- **v0.2.0** - Initial documentation structure
- **v0.1.0** - Basic README only

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/suts-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/suts-core/discussions)
- **Email**: support@suts.dev (for security issues only)

---

**Last Updated**: 2024-11-10
**Version**: 0.3.0
