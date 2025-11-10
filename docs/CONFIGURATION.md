# Configuration Guide

Complete guide to configuring SUTS for your use case.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Simulation Configuration](#simulation-configuration)
3. [Persona Generation Settings](#persona-generation-settings)
4. [Performance Tuning](#performance-tuning)
5. [Advanced Options](#advanced-options)
6. [Plugin Configuration](#plugin-configuration)

---

## Environment Variables

Environment variables are set in a `.env` file in your project root.

### Required Variables

```env
# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...
```

Get your API key at [console.anthropic.com](https://console.anthropic.com/).

### Optional Variables

```env
# Model Selection
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # Default model
# Options: claude-sonnet-4-20250514, claude-opus-4-20250514

# Rate Limiting
MAX_CONCURRENT_REQUESTS=10      # Max parallel API requests
REQUEST_TIMEOUT_MS=30000        # Request timeout (30 seconds)
MAX_RETRIES=3                   # Number of retries on failure
RETRY_DELAY_MS=1000            # Initial retry delay

# Logging
LOG_LEVEL=info                  # Log verbosity: debug, info, warn, error
LOG_FILE=./logs/suts.log       # Log file path
DEBUG=false                     # Enable debug mode

# Performance
CACHE_ENABLED=true              # Enable prompt caching
CACHE_TTL_SECONDS=3600         # Cache time-to-live
MEMORY_LIMIT_MB=2048           # Memory limit per process

# Telemetry
TELEMETRY_ENABLED=true         # Enable telemetry collection
TELEMETRY_BUFFER_SIZE=1000     # Events before flush
TELEMETRY_FLUSH_INTERVAL_MS=5000  # Auto-flush interval

# Storage
DATA_DIR=./data                # Data storage directory
OUTPUT_DIR=./output            # Output directory
TEMP_DIR=./tmp                 # Temporary files
```

### Example .env File

```env
# Production configuration
ANTHROPIC_API_KEY=sk-ant-api03-xxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
MAX_CONCURRENT_REQUESTS=20
LOG_LEVEL=info
CACHE_ENABLED=true
TELEMETRY_ENABLED=true
DATA_DIR=/var/suts/data
OUTPUT_DIR=/var/suts/output
```

---

## Simulation Configuration

Configure simulations via JSON config files or programmatically.

### Basic Configuration

```json
{
  "id": "sim-001",
  "name": "Feature Test Simulation",
  "description": "Testing new onboarding flow with 50 personas",
  "version": "1.0.0",

  "personas": {
    "source": "./personas/developers.json",
    "count": 50,
    "diversityWeight": 0.8
  },

  "product": {
    "name": "MyApp",
    "version": "2.0.0",
    "state": "./product-state.json"
  },

  "execution": {
    "numSessions": 14,
    "timeCompression": 1.0,
    "maxParallel": 10
  },

  "output": {
    "directory": "./output/sim-001",
    "formats": ["json", "csv"],
    "includeRawData": false
  }
}
```

### Configuration Fields

#### personas

```json
{
  "personas": {
    "source": "./personas.json",        // Path to personas file
    "count": 50,                        // Number of personas to use
    "diversityWeight": 0.8,             // 0-1, higher = more diverse
    "filter": {                         // Optional filtering
      "experienceLevel": ["intermediate", "expert"],
      "companySize": ["startup", "smb"]
    }
  }
}
```

#### product

```json
{
  "product": {
    "name": "MyApp",
    "version": "2.0.0",
    "state": {
      "features": {
        "featureA": {
          "enabled": true,
          "description": "New onboarding",
          "complexity": "medium",
          "maturity": "beta"
        },
        "featureB": {
          "enabled": false,
          "description": "Old onboarding",
          "complexity": "low",
          "maturity": "stable"
        }
      },
      "onboarding": {
        "steps": ["signup", "tutorial", "first-action"],
        "estimatedTimeMinutes": 5,
        "skippable": true
      },
      "documentation": {
        "available": true,
        "quality": "high",
        "searchable": true
      },
      "support": {
        "channels": ["docs", "community", "email"],
        "responseTime": "24h"
      }
    }
  }
}
```

#### execution

```json
{
  "execution": {
    "numSessions": 14,              // Number of sessions per persona
    "timeCompression": 1.0,         // Time compression factor
    "maxParallel": 10,              // Max concurrent simulations
    "randomSeed": 42,               // For reproducibility
    "stopOnError": false,           // Continue on errors
    "timeout": 300000,              // Max time per session (ms)
    "retryFailedSessions": true     // Retry on failure
  }
}
```

#### output

```json
{
  "output": {
    "directory": "./output",
    "formats": ["json", "csv", "html"],
    "includeRawData": false,        // Include raw event logs
    "includePersonas": true,        // Include persona profiles
    "compress": false,              // Compress output files
    "splitByPersona": false         // Separate file per persona
  }
}
```

### Advanced Configuration

```json
{
  "advanced": {
    "prompt": {
      "temperature": 0.7,           // LLM temperature (0-1)
      "maxTokens": 4096,            // Max tokens per request
      "caching": {
        "enabled": true,
        "strategy": "aggressive"    // none, conservative, aggressive
      }
    },
    "simulation": {
      "realism": "high",            // low, medium, high, ultra
      "detailLevel": "medium",      // low, medium, high
      "emotionalTracking": true,    // Track emotional states
      "memoryEnabled": false        // Enable cross-session memory (v2.0)
    },
    "analysis": {
      "autoAnalyze": true,          // Auto-analyze after simulation
      "detectPatterns": true,       // Pattern detection
      "inferCausality": false,      // Causal inference (expensive)
      "generateRecommendations": true
    }
  }
}
```

---

## Persona Generation Settings

Configure persona generation behavior.

### Generation Config

```json
{
  "personaGeneration": {
    "source": {
      "type": "stakeholder-analysis",  // or "real-data", "template"
      "files": ["./analysis/users.md"],
      "realDataPath": null
    },
    "count": 100,
    "diversityWeight": 0.8,
    "distribution": {
      "experienceLevel": {
        "novice": 0.3,
        "intermediate": 0.5,
        "expert": 0.2
      },
      "companySize": {
        "startup": 0.4,
        "smb": 0.4,
        "enterprise": 0.2
      }
    },
    "validation": {
      "enabled": true,
      "minConfidenceScore": 0.6,
      "rejectInvalidPersonas": true
    },
    "calibration": {
      "enabled": false,
      "realUserData": null,
      "targetAccuracy": 0.85
    }
  }
}
```

### Diversity Weight

Controls how diverse the generated personas are:

- **0.0**: Focus on the most common/typical personas
- **0.5**: Balanced mix of common and edge-case personas
- **0.8**: Highly diverse, includes many edge cases (recommended)
- **1.0**: Maximum diversity, includes rare edge cases

**Example:**
```typescript
// Generate highly diverse personas
const personas = await generator.generateFromStakeholderAnalysis(
  docs,
  50,
  0.9  // Very high diversity
);
```

---

## Performance Tuning

Optimize SUTS performance for your workload.

### Parallel Execution

```json
{
  "performance": {
    "maxConcurrency": 20,           // Max concurrent operations
    "batchSize": 10,                // Personas per batch
    "workerThreads": 4,             // Number of worker threads
    "memoryLimit": 2048             // MB per worker
  }
}
```

**CPU-Bound Workloads:**
```json
{
  "workerThreads": 8,
  "maxConcurrency": 8,
  "batchSize": 5
}
```

**I/O-Bound Workloads (API calls):**
```json
{
  "workerThreads": 2,
  "maxConcurrency": 50,
  "batchSize": 25
}
```

### Time Compression

Adjust simulation speed vs. detail:

```typescript
// High detail, slower
await engine.simulateUserJourney(persona, product, 14, 0.1);

// Balanced
await engine.simulateUserJourney(persona, product, 14, 1.0);

// Fast, less detail
await engine.simulateUserJourney(persona, product, 14, 10.0);
```

**Recommendations:**
- **Exploration**: 0.1-0.5x (high detail)
- **Development**: 1.0x (balanced)
- **CI/CD**: 5.0-10.0x (fast)

### Caching

Enable aggressive caching for repeated runs:

```json
{
  "cache": {
    "enabled": true,
    "strategy": "aggressive",
    "ttl": 7200,
    "maxSize": 1000,
    "persistToDisk": true,
    "cachePath": "./cache"
  }
}
```

### Memory Management

```json
{
  "memory": {
    "limitMB": 4096,
    "gcInterval": 100,              // GC every N sessions
    "streamResults": true,          // Stream to disk
    "clearHistoryAfter": 1000       // Clear event history
  }
}
```

---

## Advanced Options

### Experimental Features

```json
{
  "experimental": {
    "memoryEnabledAgents": false,   // V2.0 feature
    "multiModalSimulation": false,  // V2.0 feature
    "transferLearning": false,      // V2.0 feature
    "autoCalibration": false        // V2.0 feature
  }
}
```

### Debugging

```json
{
  "debug": {
    "enabled": true,
    "verbose": true,
    "logAllEvents": true,
    "logPrompts": false,            // Log LLM prompts (expensive)
    "logResponses": false,          // Log LLM responses
    "breakpoints": [],              // Session IDs to pause at
    "profilePerformance": true
  }
}
```

### Error Handling

```json
{
  "errorHandling": {
    "stopOnError": false,
    "retryAttempts": 3,
    "retryDelay": 1000,
    "exponentialBackoff": true,
    "fallbackModel": "claude-sonnet-3-5-20240620",
    "saveFailedSessions": true,
    "errorReporting": {
      "enabled": true,
      "endpoint": null,
      "includeStackTrace": true
    }
  }
}
```

---

## Plugin Configuration

Configure product-specific plugins.

### VibeAtlas Plugin Example

```json
{
  "plugins": {
    "vibeatlas": {
      "enabled": true,
      "config": {
        "apiEndpoint": "https://api.vibeatlas.com",
        "features": ["mood-tracking", "social-sharing"],
        "telemetryMapping": {
          "mood_selected": "VALUE_MOMENT",
          "social_share": "VIRAL_TRIGGER"
        }
      }
    }
  }
}
```

### Custom Plugin

```json
{
  "plugins": {
    "my-product": {
      "enabled": true,
      "modulePath": "./plugins/my-product",
      "config": {
        "customOption": "value"
      }
    }
  }
}
```

**Loading Plugins:**
```typescript
import { SimulationEngine } from '@suts/simulation';
import { MyProductAdapter } from './plugins/my-product';

const engine = new SimulationEngine(apiKey);
engine.registerPlugin('my-product', new MyProductAdapter(config));
```

---

## Configuration Files

### File Locations

```
project/
├── .env                        # Environment variables
├── suts.config.json           # Main configuration
├── personas/
│   └── config.json            # Persona generation config
├── simulations/
│   ├── dev.config.json        # Development config
│   ├── staging.config.json    # Staging config
│   └── prod.config.json       # Production config
└── plugins/
    └── plugin-config.json     # Plugin configurations
```

### Loading Configuration

```typescript
import fs from 'fs';

// Load from file
const config = JSON.parse(
  fs.readFileSync('./suts.config.json', 'utf-8')
);

// Or use environment-specific config
const env = process.env.NODE_ENV || 'development';
const config = JSON.parse(
  fs.readFileSync(`./simulations/${env}.config.json`, 'utf-8')
);
```

### Merging Configurations

```typescript
import { mergeConfigs } from '@suts/core';

const baseConfig = loadConfig('./suts.config.json');
const envConfig = loadConfig('./suts.dev.config.json');

const finalConfig = mergeConfigs(baseConfig, envConfig);
```

---

## Best Practices

1. **Use Environment Variables** for secrets and environment-specific settings
2. **Version Control Configs** but not .env files
3. **Start Conservative** then optimize performance
4. **Enable Caching** for repeated experiments
5. **Monitor Memory** usage in production
6. **Use Time Compression** for faster iterations
7. **Profile Before Optimizing** to find bottlenecks

---

**Next**: [Plugin Development](./PLUGINS.md) | [Troubleshooting](./TROUBLESHOOTING.md)
