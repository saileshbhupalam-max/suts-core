# Plugin Development Guide

Learn how to build custom product adapters and extend SUTS for your specific use case.

## Table of Contents

1. [Plugin System Overview](#plugin-system-overview)
2. [Creating a Product Adapter](#creating-a-product-adapter)
3. [Implementing Telemetry Integration](#implementing-telemetry-integration)
4. [Testing Plugins](#testing-plugins)
5. [Publishing Plugins](#publishing-plugins)
6. [Best Practices](#best-practices)

---

## Plugin System Overview

SUTS plugins allow you to adapt the framework for your specific product without modifying core packages. A plugin typically includes:

- **Product Adapter**: Maps generic SUTS concepts to your product's features
- **Telemetry Integration**: Defines how to track product-specific events
- **Custom Analyzers**: Product-specific pattern detection
- **Scenario Definitions**: Common user journeys for your product

### Plugin Architecture

```
┌─────────────────────────────────────────┐
│         SUTS Core Packages              │
│  (persona, simulation, telemetry)       │
└─────────────────┬───────────────────────┘
                  │
                  │ Plugin Interface
                  │
┌─────────────────▼───────────────────────┐
│         Your Product Plugin             │
│                                         │
│  • ProductAdapter                       │
│  • TelemetryMapper                      │
│  • CustomAnalyzer                       │
│  • ScenarioDefinitions                  │
└─────────────────────────────────────────┘
```

---

## Creating a Product Adapter

A product adapter implements the `IProductAdapter` interface to bridge SUTS and your product.

### Step 1: Setup Plugin Structure

```bash
# Create plugin directory
mkdir -p plugins/my-product/src

cd plugins/my-product

# Initialize package
npm init -y

# Install dependencies
npm install @suts/core @suts/simulation @suts/telemetry
npm install --save-dev typescript @types/node
```

### Step 2: Create Adapter Class

Create `src/MyProductAdapter.ts`:

```typescript
import type {
  ProductState,
  SimulationSession,
  PersonaProfile
} from '@suts/core';

/**
 * Adapter for MyProduct
 */
export class MyProductAdapter {
  private productName: string;
  private version: string;

  constructor(productName: string, version: string) {
    this.productName = productName;
    this.version = version;
  }

  /**
   * Convert generic product state to MyProduct format
   */
  adaptProductState(genericState: ProductState): MyProductState {
    return {
      name: this.productName,
      version: this.version,
      features: this.mapFeatures(genericState.features),
      configuration: this.extractConfiguration(genericState)
    };
  }

  /**
   * Map generic features to product-specific features
   */
  private mapFeatures(
    genericFeatures: Record<string, any>
  ): MyProductFeatures {
    return {
      dashboard: genericFeatures.dashboard?.enabled ?? false,
      analytics: genericFeatures.analytics?.enabled ?? false,
      collaboration: genericFeatures.collaboration?.enabled ?? false,
      customization: {
        themes: genericFeatures.themes?.enabled ?? false,
        layouts: genericFeatures.layouts?.enabled ?? false
      }
    };
  }

  /**
   * Extract product-specific configuration
   */
  private extractConfiguration(state: ProductState): MyProductConfig {
    return {
      api: {
        endpoint: state.apiEndpoint || 'https://api.myproduct.com',
        version: state.apiVersion || 'v2'
      },
      limits: {
        maxUsers: state.maxUsers || 100,
        maxProjects: state.maxProjects || 50
      }
    };
  }

  /**
   * Simulate a product-specific user action
   */
  async simulateAction(
    action: string,
    persona: PersonaProfile,
    context: MyProductState
  ): Promise<ActionResult> {
    switch (action) {
      case 'create_project':
        return this.simulateCreateProject(persona, context);
      case 'invite_teammate':
        return this.simulateInviteTeammate(persona, context);
      case 'export_data':
        return this.simulateExportData(persona, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async simulateCreateProject(
    persona: PersonaProfile,
    context: MyProductState
  ): Promise<ActionResult> {
    // Simulate creating a project based on persona behavior
    const complexity = persona.experienceLevel === 'novice' ? 'simple' : 'complex';
    const success = Math.random() > 0.1; // 90% success rate

    return {
      success,
      duration: complexity === 'simple' ? 30000 : 60000, // ms
      emotionalImpact: {
        frustration: success ? 0 : 0.3,
        confidence: success ? 0.2 : -0.1,
        delight: success ? 0.4 : 0,
        confusion: complexity === 'simple' ? 0 : 0.2
      },
      telemetry: {
        event: 'project_created',
        properties: {
          complexity,
          success,
          personaExperience: persona.experienceLevel
        }
      }
    };
  }

  private async simulateInviteTeammate(
    persona: PersonaProfile,
    context: MyProductState
  ): Promise<ActionResult> {
    const isCollaborative = persona.collaborationStyle !== 'solo';
    const success = isCollaborative ? 0.95 : 0.6;

    return {
      success: Math.random() < success,
      duration: 15000,
      emotionalImpact: {
        frustration: 0,
        confidence: 0.1,
        delight: isCollaborative ? 0.3 : 0.1,
        confusion: 0
      },
      telemetry: {
        event: 'teammate_invited',
        properties: {
          collaborationStyle: persona.collaborationStyle
        }
      }
    };
  }

  private async simulateExportData(
    persona: PersonaProfile,
    context: MyProductState
  ): Promise<ActionResult> {
    const needsExport = persona.dealBreakers.includes('vendor-lock-in');
    const success = context.features.exportEnabled ? 0.95 : 0;

    return {
      success: Math.random() < success,
      duration: 20000,
      emotionalImpact: {
        frustration: success === 0 ? 0.8 : 0,
        confidence: success > 0 ? 0.3 : 0,
        delight: needsExport && success > 0 ? 0.6 : 0,
        confusion: success === 0 ? 0.4 : 0
      },
      telemetry: {
        event: 'data_exported',
        properties: {
          success: Math.random() < success,
          format: 'json',
          needsExport
        }
      }
    };
  }
}

// Type definitions
interface MyProductState {
  name: string;
  version: string;
  features: MyProductFeatures;
  configuration: MyProductConfig;
}

interface MyProductFeatures {
  dashboard: boolean;
  analytics: boolean;
  collaboration: boolean;
  customization: {
    themes: boolean;
    layouts: boolean;
  };
  exportEnabled?: boolean;
}

interface MyProductConfig {
  api: {
    endpoint: string;
    version: string;
  };
  limits: {
    maxUsers: number;
    maxProjects: number;
  };
}

interface ActionResult {
  success: boolean;
  duration: number;
  emotionalImpact: {
    frustration: number;
    confidence: number;
    delight: number;
    confusion: number;
  };
  telemetry: {
    event: string;
    properties: Record<string, any>;
  };
}
```

### Step 3: Define Scenarios

Create `src/scenarios.ts`:

```typescript
import type { PersonaProfile } from '@suts/core';

/**
 * Product-specific user scenarios
 */
export const scenarios = {
  /**
   * New user onboarding flow
   */
  onboarding: {
    name: 'New User Onboarding',
    description: 'First-time user completes setup',
    steps: [
      'signup',
      'verify_email',
      'complete_profile',
      'take_tutorial',
      'create_first_project'
    ],
    estimatedDuration: 600000, // 10 minutes
    criticalPath: true
  },

  /**
   * Daily active user workflow
   */
  dailyUsage: {
    name: 'Daily Active User',
    description: 'Typical day of product usage',
    steps: [
      'login',
      'check_notifications',
      'review_dashboard',
      'work_on_project',
      'collaborate_with_team',
      'logout'
    ],
    estimatedDuration: 1800000, // 30 minutes
    frequency: 'daily'
  },

  /**
   * Power user advanced features
   */
  powerUser: {
    name: 'Power User Workflow',
    description: 'Expert user leveraging advanced features',
    steps: [
      'login',
      'use_keyboard_shortcuts',
      'customize_workspace',
      'use_advanced_features',
      'integrate_with_tools',
      'export_data'
    ],
    estimatedDuration: 3600000, // 1 hour
    requiredExperience: 'expert'
  }
};

/**
 * Select scenario based on persona characteristics
 */
export function selectScenario(
  persona: PersonaProfile,
  sessionNumber: number
): string {
  if (sessionNumber === 1) {
    return 'onboarding';
  }

  if (persona.experienceLevel === 'expert') {
    return 'powerUser';
  }

  return 'dailyUsage';
}
```

---

## Implementing Telemetry Integration

Map product events to SUTS telemetry.

### Telemetry Mapper

Create `src/TelemetryMapper.ts`:

```typescript
import type { TelemetryEvent } from '@suts/telemetry';

export class MyProductTelemetryMapper {
  /**
   * Map product event to SUTS telemetry format
   */
  mapEvent(productEvent: any): TelemetryEvent {
    return {
      type: this.classifyEventType(productEvent.name),
      timestamp: productEvent.timestamp,
      personaId: productEvent.userId,
      sessionId: productEvent.sessionId,
      data: {
        event: productEvent.name,
        properties: productEvent.properties,
        category: this.categorizeEvent(productEvent.name),
        success: productEvent.success ?? true
      }
    };
  }

  /**
   * Classify event type for analysis
   */
  private classifyEventType(eventName: string): string {
    const frictionEvents = [
      'error_encountered',
      'feature_not_found',
      'timeout',
      'validation_failed'
    ];

    const valueEvents = [
      'project_created',
      'goal_achieved',
      'time_saved',
      'problem_solved'
    ];

    const viralEvents = [
      'teammate_invited',
      'content_shared',
      'review_written'
    ];

    if (frictionEvents.includes(eventName)) {
      return 'FRICTION_POINT';
    }

    if (valueEvents.includes(eventName)) {
      return 'VALUE_MOMENT';
    }

    if (viralEvents.includes(eventName)) {
      return 'VIRAL_TRIGGER';
    }

    return 'GENERIC_EVENT';
  }

  /**
   * Categorize event for grouping
   */
  private categorizeEvent(eventName: string): string {
    const categories: Record<string, string[]> = {
      onboarding: ['signup', 'tutorial', 'first_project'],
      core_workflow: ['create', 'edit', 'delete', 'save'],
      collaboration: ['invite', 'share', 'comment', 'review'],
      customization: ['theme_changed', 'layout_updated', 'preferences_set'],
      integration: ['api_called', 'webhook_triggered', 'import', 'export']
    };

    for (const [category, events] of Object.entries(categories)) {
      if (events.some(e => eventName.includes(e))) {
        return category;
      }
    }

    return 'other';
  }
}
```

---

## Testing Plugins

### Unit Tests

Create `__tests__/MyProductAdapter.test.ts`:

```typescript
import { MyProductAdapter } from '../src/MyProductAdapter';
import type { PersonaProfile, ProductState } from '@suts/core';

describe('MyProductAdapter', () => {
  let adapter: MyProductAdapter;
  let mockPersona: PersonaProfile;
  let mockProductState: ProductState;

  beforeEach(() => {
    adapter = new MyProductAdapter('MyProduct', '2.0.0');

    mockPersona = {
      id: 'p-001',
      archetype: 'Power User',
      experienceLevel: 'expert',
      collaborationStyle: 'team',
      dealBreakers: ['vendor-lock-in'],
      // ... other required fields
    } as PersonaProfile;

    mockProductState = {
      version: '2.0.0',
      features: {
        dashboard: { enabled: true },
        analytics: { enabled: true }
      }
    } as ProductState;
  });

  describe('adaptProductState', () => {
    it('should convert generic state to product-specific state', () => {
      const adapted = adapter.adaptProductState(mockProductState);

      expect(adapted.name).toBe('MyProduct');
      expect(adapted.version).toBe('2.0.0');
      expect(adapted.features.dashboard).toBe(true);
    });
  });

  describe('simulateAction', () => {
    it('should successfully simulate project creation', async () => {
      const result = await adapter.simulateAction(
        'create_project',
        mockPersona,
        adapter.adaptProductState(mockProductState)
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('emotionalImpact');
      expect(result).toHaveProperty('telemetry');
    });

    it('should throw error for unknown action', async () => {
      await expect(
        adapter.simulateAction('unknown_action', mockPersona, {} as any)
      ).rejects.toThrow('Unknown action');
    });
  });
});
```

### Integration Tests

Create `__tests__/integration.test.ts`:

```typescript
import { SimulationEngine } from '@suts/simulation';
import { MyProductAdapter } from '../src/MyProductAdapter';
import { PersonaGenerator } from '@suts/persona';

describe('MyProduct Integration', () => {
  it('should run full simulation with plugin', async () => {
    const adapter = new MyProductAdapter('MyProduct', '2.0.0');
    const generator = new PersonaGenerator(process.env.ANTHROPIC_API_KEY!);
    const engine = new SimulationEngine(process.env.ANTHROPIC_API_KEY!);

    // Generate test persona
    const personas = await generator.generateFromStakeholderAnalysis(
      ['./test-analysis.md'],
      1,
      0.8
    );

    // Run simulation with plugin
    const sessions = await engine.simulateUserJourney(
      personas[0],
      adapter.adaptProductState({ version: '2.0.0', features: {} }),
      7,
      1.0
    );

    expect(sessions.length).toBe(7);
  });
});
```

---

## Publishing Plugins

### Step 1: Prepare Package

```json
{
  "name": "@suts/plugin-myproduct",
  "version": "1.0.0",
  "description": "SUTS plugin for MyProduct",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "suts",
    "plugin",
    "myproduct",
    "synthetic-users"
  ],
  "peerDependencies": {
    "@suts/core": "^0.3.0",
    "@suts/simulation": "^0.3.0"
  }
}
```

### Step 2: Build and Test

```bash
npm run build
npm test
npm run lint
```

### Step 3: Publish

```bash
npm publish --access public
```

---

## Best Practices

1. **Keep Adapters Lightweight**: Delegate complex logic to helper functions
2. **Use TypeScript**: Full type safety for better DX
3. **Write Tests**: Minimum 90% coverage for plugins
4. **Document Scenarios**: Clear descriptions of user journeys
5. **Version Carefully**: Follow semver strictly
6. **Handle Errors Gracefully**: Don't crash the simulation
7. **Optimize Performance**: Cache repeated operations
8. **Contribute Back**: Share useful plugins with the community

---

**Next**: [CLI Reference](./CLI_REFERENCE.md) | [API Reference](./API_REFERENCE.md)
