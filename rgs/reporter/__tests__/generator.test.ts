/**
 * RGS Reporter - Report Generator Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ReportGenerator, ReportGenerationError } from '../src/generator';
import { ReportData, ReportOptions } from '../src/types';
import { generatePlaceholderReportData } from '../src/templates';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  let mockData: ReportData;
  let testOutputDir: string;

  beforeEach(() => {
    generator = new ReportGenerator();
    mockData = generatePlaceholderReportData(10);
    testOutputDir = path.join(__dirname, '__test-output__', `test-${Date.now()}`);
  });

  afterEach(async () => {
    // Cleanup test files
    try {
      const files = ['insights.json', 'INSIGHTS.md'];
      for (const file of files) {
        const filePath = path.join(testOutputDir, file);
        try {
          await unlink(filePath);
        } catch {
          // File doesn't exist, ignore
        }
      }
      await rmdir(testOutputDir);
      await rmdir(path.dirname(testOutputDir));
    } catch {
      // Directory doesn't exist, ignore
    }
  });

  describe('generate', () => {
    it('should generate JSON report when format is json', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(mockData, options);

      expect(result.filePaths).toHaveLength(1);
      expect(result.filePaths[0]).toContain('insights.json');

      // Verify file exists and is valid JSON
      const filePath = result.filePaths[0];
      if (filePath === undefined) {
        throw new Error('File path is undefined');
      }
      const content = await readFile(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should generate Markdown report when format is markdown', async () => {
      const options: ReportOptions = {
        format: 'markdown',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(mockData, options);

      expect(result.filePaths).toHaveLength(1);
      expect(result.filePaths[0]).toContain('INSIGHTS.md');

      // Verify file exists
      const filePath = result.filePaths[0];
      if (filePath === undefined) {
        throw new Error('File path is undefined');
      }
      const content = await readFile(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should generate both reports when format is both', async () => {
      const options: ReportOptions = {
        format: 'both',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(mockData, options);

      expect(result.filePaths).toHaveLength(2);
      expect(result.filePaths.some((p) => p.includes('insights.json'))).toBe(true);
      expect(result.filePaths.some((p) => p.includes('INSIGHTS.md'))).toBe(true);
    });

    it('should return summary in result', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(mockData, options);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalSignals).toBe(mockData.signals.length);
      expect(result.summary.avgSentiment).toBeDefined();
      expect(result.summary.topThemes).toBeDefined();
      expect(result.summary.painPoints).toBeDefined();
      expect(result.summary.desires).toBeDefined();
    });

    it('should return generatedAt timestamp in result', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(mockData, options);

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.generatedAt).toEqual(mockData.metadata.generatedAt);
    });

    it('should create output directory if it does not exist', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      await generator.generate(mockData, options);

      expect(fs.existsSync(testOutputDir)).toBe(true);
    });

    it('should respect maxThemes option', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        maxThemes: 2,
      };

      const result = await generator.generate(mockData, options);

      expect(result.summary.topThemes.length).toBeLessThanOrEqual(2);
    });

    it('should respect minThemeFrequency option', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        minThemeFrequency: 30,
      };

      const result = await generator.generate(mockData, options);

      const allThemesAboveMin = result.summary.topThemes.every(
        (theme) => theme.frequency >= 30
      );
      expect(allThemesAboveMin).toBe(true);
    });

    it('should include raw data when includeRawData is true', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        includeRawData: true,
      };

      const result = await generator.generate(mockData, options);

      const filePath = result.filePaths[0];
      if (filePath === undefined) {
        throw new Error('File path is undefined');
      }
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.signals).toBeDefined();
      expect(parsed.signals.length).toBe(mockData.signals.length);
    });
  });

  describe('validation', () => {
    it('should throw error if data has no signals', async () => {
      const invalidData = {
        ...mockData,
        signals: [],
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      await expect(generator.generate(invalidData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if data has no themes', async () => {
      const invalidData = {
        ...mockData,
        themes: [],
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      await expect(generator.generate(invalidData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if sentiment distribution does not sum to 1', async () => {
      const invalidData = {
        ...mockData,
        sentiment: {
          ...mockData.sentiment,
          distribution: {
            positive: 0.3,
            neutral: 0.2,
            negative: 0.2, // Sum is 0.7, not 1.0
          },
        },
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      await expect(generator.generate(invalidData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if overall sentiment is out of range', async () => {
      const invalidData = {
        ...mockData,
        sentiment: {
          ...mockData.sentiment,
          overall: 1.5, // Out of range
        },
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      await expect(generator.generate(invalidData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if outputDir is empty', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: '',
      };

      await expect(generator.generate(mockData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if maxThemes is less than 1', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        maxThemes: 0,
      };

      await expect(generator.generate(mockData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should throw error if minThemeFrequency is negative', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        minThemeFrequency: -1,
      };

      await expect(generator.generate(mockData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });
  });

  describe('error handling', () => {
    it('should throw ReportGenerationError with cause on write failure', async () => {
      // Use a path with invalid characters that will definitely cause a write error
      const options: ReportOptions = {
        format: 'json',
        outputDir: '/proc/invalid\x00path/that/does/not/exist',
      };

      await expect(generator.generate(mockData, options)).rejects.toThrow(
        ReportGenerationError
      );
    });

    it('should wrap validation errors in ReportGenerationError', async () => {
      const invalidData = {
        ...mockData,
        signals: [],
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      try {
        await generator.generate(invalidData, options);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ReportGenerationError);
        expect((error as Error).message).toContain('Invalid report data');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle signals without sentiment scores', async () => {
      const dataWithoutSentiment: ReportData = {
        ...mockData,
        signals: mockData.signals.map((signal) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { sentiment, ...rest } = signal;
          return rest;
        }),
      };

      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
      };

      const result = await generator.generate(dataWithoutSentiment, options);

      expect(result.summary.avgSentiment).toBe(0);
    });

    it('should handle maxThemes larger than available themes', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        maxThemes: 100,
      };

      const result = await generator.generate(mockData, options);

      expect(result.summary.topThemes.length).toBe(mockData.themes.length);
    });

    it('should handle all themes below minThemeFrequency', async () => {
      const options: ReportOptions = {
        format: 'json',
        outputDir: testOutputDir,
        minThemeFrequency: 1000,
      };

      const result = await generator.generate(mockData, options);

      expect(result.summary.topThemes.length).toBe(0);
    });
  });
});
