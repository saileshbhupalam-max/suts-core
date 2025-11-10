/**
 * Tests for ConfigSchema
 */

import {
  SutsConfigSchema,
  SimulationConfigSchema,
  PersonaConfigSchema,
  OutputConfigSchema,
  ThresholdConfigSchema,
} from '../../src/config/ConfigSchema';

describe('SimulationConfigSchema', () => {
  it('should validate valid simulation config', () => {
    const config = {
      personas: 100,
      days: 7,
      product: 'vibeatlas',
    };

    const result = SimulationConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should apply default values', () => {
    const config = {
      product: 'vibeatlas',
    };

    const result = SimulationConfigSchema.parse(config);
    expect(result.personas).toBe(100);
    expect(result.days).toBe(7);
    expect(result.product).toBe('vibeatlas');
  });

  it('should reject negative personas', () => {
    const config = {
      personas: -1,
      days: 7,
      product: 'vibeatlas',
    };

    expect(() => SimulationConfigSchema.parse(config)).toThrow();
  });

  it('should reject zero personas', () => {
    const config = {
      personas: 0,
      days: 7,
      product: 'vibeatlas',
    };

    expect(() => SimulationConfigSchema.parse(config)).toThrow();
  });

  it('should reject non-integer personas', () => {
    const config = {
      personas: 1.5,
      days: 7,
      product: 'vibeatlas',
    };

    expect(() => SimulationConfigSchema.parse(config)).toThrow();
  });

  it('should reject empty product', () => {
    const config = {
      personas: 100,
      days: 7,
      product: '',
    };

    expect(() => SimulationConfigSchema.parse(config)).toThrow();
  });
});

describe('PersonaConfigSchema', () => {
  it('should validate valid persona config', () => {
    const config = {
      analysisFiles: ['file1.md', 'file2.md'],
      diversity: 0.8,
    };

    const result = PersonaConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should apply default diversity', () => {
    const config = {};

    const result = PersonaConfigSchema.parse(config);
    expect(result.diversity).toBe(0.8);
  });

  it('should accept missing analysisFiles', () => {
    const config = {
      diversity: 0.5,
    };

    const result = PersonaConfigSchema.parse(config);
    expect(result.analysisFiles).toBeUndefined();
  });

  it('should reject diversity > 1', () => {
    const config = {
      diversity: 1.5,
    };

    expect(() => PersonaConfigSchema.parse(config)).toThrow();
  });

  it('should reject diversity < 0', () => {
    const config = {
      diversity: -0.1,
    };

    expect(() => PersonaConfigSchema.parse(config)).toThrow();
  });
});

describe('OutputConfigSchema', () => {
  it('should validate valid output config', () => {
    const config = {
      directory: './output',
      format: 'json' as const,
      generateReport: true,
    };

    const result = OutputConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should apply default values', () => {
    const config = {};

    const result = OutputConfigSchema.parse(config);
    expect(result.directory).toBe('./suts-output');
    expect(result.format).toBe('json');
    expect(result.generateReport).toBe(true);
  });

  it('should accept csv format', () => {
    const config = {
      format: 'csv' as const,
    };

    const result = OutputConfigSchema.parse(config);
    expect(result.format).toBe('csv');
  });

  it('should accept html format', () => {
    const config = {
      format: 'html' as const,
    };

    const result = OutputConfigSchema.parse(config);
    expect(result.format).toBe('html');
  });

  it('should reject invalid format', () => {
    const config = {
      format: 'xml',
    };

    expect(() => OutputConfigSchema.parse(config)).toThrow();
  });
});

describe('ThresholdConfigSchema', () => {
  it('should validate valid threshold config', () => {
    const config = {
      positioning: 0.6,
      retention: 0.8,
      viral: 0.25,
    };

    const result = ThresholdConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should apply default values', () => {
    const config = {};

    const result = ThresholdConfigSchema.parse(config);
    expect(result.positioning).toBe(0.6);
    expect(result.retention).toBe(0.8);
    expect(result.viral).toBe(0.25);
  });

  it('should reject threshold > 1', () => {
    const config = {
      positioning: 1.5,
    };

    expect(() => ThresholdConfigSchema.parse(config)).toThrow();
  });

  it('should reject threshold < 0', () => {
    const config = {
      positioning: -0.1,
    };

    expect(() => ThresholdConfigSchema.parse(config)).toThrow();
  });
});

describe('SutsConfigSchema', () => {
  it('should validate complete valid config', () => {
    const config = {
      simulation: {
        personas: 100,
        days: 7,
        product: 'vibeatlas',
      },
      personas: {
        analysisFiles: ['file.md'],
        diversity: 0.8,
      },
      output: {
        directory: './output',
        format: 'json' as const,
        generateReport: true,
      },
      thresholds: {
        positioning: 0.6,
        retention: 0.8,
        viral: 0.25,
      },
    };

    const result = SutsConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should validate minimal valid config', () => {
    const config = {
      simulation: {
        product: 'vibeatlas',
      },
    };

    const result = SutsConfigSchema.parse(config);
    expect(result.simulation.personas).toBe(100);
    expect(result.simulation.days).toBe(7);
    expect(result.simulation.product).toBe('vibeatlas');
  });

  it('should reject config without simulation', () => {
    const config = {};

    expect(() => SutsConfigSchema.parse(config)).toThrow();
  });

  it('should reject config without product', () => {
    const config = {
      simulation: {
        personas: 100,
        days: 7,
      },
    };

    expect(() => SutsConfigSchema.parse(config)).toThrow();
  });
});
