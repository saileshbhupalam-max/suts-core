/**
 * Tests for ResultsWriter
 */

import * as fs from 'fs';
import * as path from 'path';
import { ResultsWriter, SimulationResults } from '../../src/output/ResultsWriter';

describe('ResultsWriter', () => {
  const testOutputDir = path.join(__dirname, '../test-output');

  beforeEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('constructor', () => {
    it('should create writer with output directory', () => {
      const writer = new ResultsWriter(testOutputDir);
      expect(writer.getOutputDirectory()).toBe(path.resolve(testOutputDir));
    });
  });

  describe('getOutputDirectory', () => {
    it('should return output directory path', () => {
      const writer = new ResultsWriter(testOutputDir);
      expect(writer.getOutputDirectory()).toBe(path.resolve(testOutputDir));
    });
  });

  describe('writeResults', () => {
    it('should write all result files', () => {
      const writer = new ResultsWriter(testOutputDir);

      const results: SimulationResults = {
        summary: {
          totalPersonas: 10,
          totalEvents: 100,
          simulationDays: 7,
          productPlugin: 'test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
        },
        personas: [
          {
            id: 'persona-1',
            name: 'User 1',
            background: 'Developer',
            goals: ['Goal 1'],
          },
        ],
        events: [
          {
            id: 'event-1',
            personaId: 'persona-1',
            timestamp: new Date().toISOString(),
            eventType: 'action',
            context: {},
          },
        ],
        frictionPoints: [
          {
            id: 'friction-1',
            description: 'Test friction',
            severity: 0.5,
            frequency: 0.3,
            affectedPersonas: ['persona-1'],
          },
        ],
        valueMoments: [
          {
            id: 'value-1',
            description: 'Test value',
            impact: 0.8,
            frequency: 0.6,
            affectedPersonas: ['persona-1'],
          },
        ],
        goNoGo: {
          decision: 'go',
          confidence: 0.85,
          reasoning: 'Test reasoning',
          metrics: {
            positioning: 0.7,
            retention: 0.8,
            viral: 0.3,
          },
        },
      };

      writer.writeResults(results);

      // Check that all files were created
      expect(fs.existsSync(path.join(testOutputDir, 'summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'personas.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'events.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'friction-points.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'value-moments.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'go-no-go.json'))).toBe(true);
    });

    it('should create output directory if it does not exist', () => {
      const writer = new ResultsWriter(testOutputDir);

      expect(fs.existsSync(testOutputDir)).toBe(false);

      const results: SimulationResults = {
        summary: {
          totalPersonas: 1,
          totalEvents: 1,
          simulationDays: 1,
          productPlugin: 'test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 100,
        },
        personas: [],
        events: [],
        frictionPoints: [],
        valueMoments: [],
        goNoGo: {
          decision: 'go',
          confidence: 0.9,
          reasoning: 'Test',
          metrics: { positioning: 0.8, retention: 0.9, viral: 0.4 },
        },
      };

      writer.writeResults(results);

      expect(fs.existsSync(testOutputDir)).toBe(true);
    });

    it('should write valid JSON', () => {
      const writer = new ResultsWriter(testOutputDir);

      const results: SimulationResults = {
        summary: {
          totalPersonas: 1,
          totalEvents: 1,
          simulationDays: 1,
          productPlugin: 'test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 100,
        },
        personas: [],
        events: [],
        frictionPoints: [],
        valueMoments: [],
        goNoGo: {
          decision: 'go',
          confidence: 0.9,
          reasoning: 'Test',
          metrics: { positioning: 0.8, retention: 0.9, viral: 0.4 },
        },
      };

      writer.writeResults(results);

      const summaryContent = fs.readFileSync(
        path.join(testOutputDir, 'summary.json'),
        'utf-8'
      );
      const summaryData = JSON.parse(summaryContent);
      expect(summaryData.totalPersonas).toBe(1);
    });

    it('should handle nested directories', () => {
      const nestedDir = path.join(testOutputDir, 'nested', 'deep');
      const writer = new ResultsWriter(nestedDir);

      const results: SimulationResults = {
        summary: {
          totalPersonas: 1,
          totalEvents: 1,
          simulationDays: 1,
          productPlugin: 'test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 100,
        },
        personas: [],
        events: [],
        frictionPoints: [],
        valueMoments: [],
        goNoGo: {
          decision: 'go',
          confidence: 0.9,
          reasoning: 'Test',
          metrics: { positioning: 0.8, retention: 0.9, viral: 0.4 },
        },
      };

      writer.writeResults(results);

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.existsSync(path.join(nestedDir, 'summary.json'))).toBe(true);
    });
  });
});
