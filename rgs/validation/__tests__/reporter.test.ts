/**
 * Tests for validation reporter
 */

import { generateReport, generateJSONReport, generateCSVReport } from '../src/reporter';
import type { ValidationResult } from '../src/types';

describe('Reporter', () => {
  const mockValidationResult: ValidationResult = {
    baseAccuracy: 85.5,
    groundedAccuracy: 92.3,
    improvement: 6.8,
    confidence: 0.95,
    breakdown: {
      positioning: { base: 84.0, grounded: 91.0 },
      retention: { base: 86.0, grounded: 93.0 },
      viral: { base: 87.0, grounded: 93.5 },
    },
    sampleSize: 50,
    testDuration: '5000ms',
    timestamp: new Date('2025-01-15T10:00:00Z').toISOString(),
    metadata: {
      baseTestId: 'base-123',
      groundedTestId: 'grounded-456',
      validatorVersion: '1.0.0',
    },
  };

  describe('generateReport', () => {
    it('should generate markdown report', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    it('should include header section', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('# RGS Validation Report');
      expect(report).toContain('Generated:');
      expect(report).toContain('Validator Version:');
      expect(report).toContain('1.0.0');
    });

    it('should include summary section', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('## Summary');
      expect(report).toContain('Base Accuracy');
      expect(report).toContain('Grounded Accuracy');
      expect(report).toContain('Improvement');
      expect(report).toContain('Confidence');
      expect(report).toContain('Sample Size');
      expect(report).toContain('85.50%');
      expect(report).toContain('92.30%');
      expect(report).toContain('+6.80pp');
      expect(report).toContain('95.0%');
      expect(report).toContain('50 personas');
    });

    it('should include breakdown section', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('## Accuracy Breakdown');
      expect(report).toContain('### Positioning Accuracy');
      expect(report).toContain('### Retention Accuracy');
      expect(report).toContain('### Viral Coefficient Accuracy');
      expect(report).toContain('84.00%');
      expect(report).toContain('91.00%');
      expect(report).toContain('86.00%');
      expect(report).toContain('93.00%');
      expect(report).toContain('87.00%');
      expect(report).toContain('93.50%');
    });

    it('should include metadata section', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('## Test Metadata');
      expect(report).toContain('Base Test ID');
      expect(report).toContain('Grounded Test ID');
      expect(report).toContain('base-123');
      expect(report).toContain('grounded-456');
    });

    it('should include conclusion section', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('## Conclusion');
      expect(report).toContain('Confidence Level');
    });

    it('should show success when target is met', () => {
      const report = generateReport(mockValidationResult);

      expect(report).toContain('TARGET MET');
      expect(report).toContain('Success');
    });

    it('should show warning when target is not met', () => {
      const belowTargetResult: ValidationResult = {
        ...mockValidationResult,
        groundedAccuracy: 88.0,
        improvement: 2.5,
      };

      const report = generateReport(belowTargetResult);

      expect(report).toContain('TARGET NOT MET');
      expect(report).toContain('Target Not Met');
    });

    it('should handle negative improvement', () => {
      const negativeImprovement: ValidationResult = {
        ...mockValidationResult,
        groundedAccuracy: 80.0,
        improvement: -5.5,
      };

      const report = generateReport(negativeImprovement);

      expect(report).toContain('-5.50pp');
      expect(report).toContain('decline');
    });

    it('should throw error for null result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateReport(null as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });

    it('should throw error for undefined result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateReport(undefined as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });

    it('should format changes with positive sign', () => {
      const report = generateReport(mockValidationResult);

      // Positioning improvement: 91.0 - 84.0 = +7.00pp
      expect(report).toMatch(/\+7\.00pp/);
    });

    it('should format changes with negative sign', () => {
      const negativeChange: ValidationResult = {
        ...mockValidationResult,
        breakdown: {
          positioning: { base: 90.0, grounded: 85.0 },
          retention: { base: 86.0, grounded: 93.0 },
          viral: { base: 87.0, grounded: 93.5 },
        },
      };

      const report = generateReport(negativeChange);

      expect(report).toMatch(/-5\.00pp/);
    });

    it('should handle zero change', () => {
      const zeroChange: ValidationResult = {
        ...mockValidationResult,
        breakdown: {
          positioning: { base: 85.0, grounded: 85.0 },
          retention: { base: 86.0, grounded: 93.0 },
          viral: { base: 87.0, grounded: 93.5 },
        },
      };

      const report = generateReport(zeroChange);

      expect(report).toMatch(/0\.00pp/);
    });
  });

  describe('generateJSONReport', () => {
    it('should generate JSON report', () => {
      const report = generateJSONReport(mockValidationResult);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });

    it('should be valid JSON', () => {
      const report = generateJSONReport(mockValidationResult);

      expect(() => JSON.parse(report)).not.toThrow();
    });

    it('should contain all result fields', () => {
      const report = generateJSONReport(mockValidationResult);
      const parsed = JSON.parse(report);

      expect(parsed.baseAccuracy).toBe(85.5);
      expect(parsed.groundedAccuracy).toBe(92.3);
      expect(parsed.improvement).toBe(6.8);
      expect(parsed.confidence).toBe(0.95);
      expect(parsed.sampleSize).toBe(50);
      expect(parsed.breakdown).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it('should be formatted with indentation', () => {
      const report = generateJSONReport(mockValidationResult);

      // Pretty-printed JSON should have newlines and spaces
      expect(report).toContain('\n');
      expect(report).toContain('  ');
    });

    it('should throw error for null result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateJSONReport(null as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });

    it('should throw error for undefined result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateJSONReport(undefined as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });
  });

  describe('generateCSVReport', () => {
    it('should generate CSV report', () => {
      const report = generateCSVReport(mockValidationResult);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });

    it('should have header row', () => {
      const report = generateCSVReport(mockValidationResult);
      const lines = report.split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(2);

      const header = lines[0];
      expect(header).toBeDefined();
      if (header !== undefined) {
        expect(header).toContain('timestamp');
        expect(header).toContain('base_accuracy');
        expect(header).toContain('grounded_accuracy');
        expect(header).toContain('improvement');
        expect(header).toContain('confidence');
        expect(header).toContain('sample_size');
        expect(header).toContain('positioning_base');
        expect(header).toContain('positioning_grounded');
        expect(header).toContain('retention_base');
        expect(header).toContain('retention_grounded');
        expect(header).toContain('viral_base');
        expect(header).toContain('viral_grounded');
      }
    });

    it('should have data row', () => {
      const report = generateCSVReport(mockValidationResult);
      const lines = report.split('\n');

      expect(lines.length).toBe(2);

      const dataRow = lines[1];
      expect(dataRow).toBeDefined();
      if (dataRow !== undefined) {
        expect(dataRow).toContain('85.5');
        expect(dataRow).toContain('92.3');
        expect(dataRow).toContain('6.8');
        expect(dataRow).toContain('0.95');
        expect(dataRow).toContain('50');
      }
    });

    it('should include breakdown values', () => {
      const report = generateCSVReport(mockValidationResult);
      const lines = report.split('\n');

      const dataRow = lines[1];
      expect(dataRow).toBeDefined();
      if (dataRow !== undefined) {
        expect(dataRow).toContain('84');
        expect(dataRow).toContain('91');
        expect(dataRow).toContain('86');
        expect(dataRow).toContain('93');
        expect(dataRow).toContain('87');
        expect(dataRow).toContain('93.5');
      }
    });

    it('should throw error for null result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateCSVReport(null as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });

    it('should throw error for undefined result', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => generateCSVReport(undefined as any)).toThrow(
        'Validation result cannot be null or undefined'
      );
    });
  });
});
