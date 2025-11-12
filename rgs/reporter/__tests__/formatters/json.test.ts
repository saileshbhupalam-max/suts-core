/**
 * RGS Reporter - JSON Formatter Tests
 */

import { JSONFormatter } from '../../src/formatters/json';
import { ReportData, ReportOptions } from '../../src/types';
import { generatePlaceholderReportData } from '../../src/templates';

describe('JSONFormatter', () => {
  let formatter: JSONFormatter;
  let mockData: ReportData;
  let mockOptions: ReportOptions;

  beforeEach(() => {
    formatter = new JSONFormatter();
    mockData = generatePlaceholderReportData(10);
    mockOptions = {
      format: 'json',
      outputDir: '/tmp/reports',
      maxThemes: 5,
      minThemeFrequency: 1,
    };
  });

  describe('format', () => {
    it('should format report data as valid JSON', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include summary section', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalSignals).toBe(mockData.signals.length);
      expect(parsed.summary.avgSentiment).toBeDefined();
      expect(parsed.summary.topThemes).toBeDefined();
      expect(parsed.summary.painPoints).toBeDefined();
      expect(parsed.summary.desires).toBeDefined();
    });

    it('should include themes section', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.themes).toBeDefined();
      expect(Array.isArray(parsed.themes)).toBe(true);
      expect(parsed.themes.length).toBeGreaterThan(0);
    });

    it('should include sentiment section', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.sentiment).toBeDefined();
      expect(parsed.sentiment.overall).toBeDefined();
      expect(parsed.sentiment.distribution).toBeDefined();
      expect(parsed.sentiment.positiveSignals).toBeDefined();
      expect(parsed.sentiment.negativeSignals).toBeDefined();
    });

    it('should include metadata section', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.scrapedAt).toBeDefined();
      expect(parsed.metadata.sources).toBeDefined();
      expect(parsed.metadata.totalSignals).toBe(mockData.signals.length);
    });

    it('should respect maxThemes option', () => {
      const optionsWithLimit = { ...mockOptions, maxThemes: 2 };
      const result = formatter.format(mockData, optionsWithLimit);
      const parsed = JSON.parse(result);

      expect(parsed.summary.topThemes.length).toBeLessThanOrEqual(2);
    });

    it('should exclude raw signals by default', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.signals).toBeUndefined();
    });

    it('should include raw signals when includeRawData is true', () => {
      const optionsWithRawData = { ...mockOptions, includeRawData: true };
      const result = formatter.format(mockData, optionsWithRawData);
      const parsed = JSON.parse(result);

      expect(parsed.signals).toBeDefined();
      expect(Array.isArray(parsed.signals)).toBe(true);
      expect(parsed.signals.length).toBe(mockData.signals.length);
    });

    it('should filter themes by minimum frequency', () => {
      const optionsWithMinFreq = { ...mockOptions, minThemeFrequency: 30 };
      const result = formatter.format(mockData, optionsWithMinFreq);
      const parsed = JSON.parse(result);

      const allThemesAboveMin = parsed.themes.every(
        (theme: { frequency: number }) => theme.frequency >= 30
      );
      expect(allThemesAboveMin).toBe(true);
    });

    it('should calculate average sentiment correctly', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.summary.avgSentiment).toBeGreaterThanOrEqual(-1);
      expect(parsed.summary.avgSentiment).toBeLessThanOrEqual(1);
    });

    it('should separate pain points and desires', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      const painPoints = parsed.summary.painPoints;
      const desires = parsed.summary.desires;

      expect(Array.isArray(painPoints)).toBe(true);
      expect(Array.isArray(desires)).toBe(true);

      if (painPoints.length > 0) {
        expect(painPoints.every((theme: { category: string }) => theme.category === 'pain')).toBe(
          true
        );
      }

      if (desires.length > 0) {
        expect(
          desires.every((theme: { category: string }) => theme.category === 'desire')
        ).toBe(true);
      }
    });

    it('should sort themes by frequency descending', () => {
      const result = formatter.format(mockData, mockOptions);
      const parsed = JSON.parse(result);

      const themes = parsed.themes;
      for (let i = 1; i < themes.length; i++) {
        expect(themes[i - 1].frequency).toBeGreaterThanOrEqual(themes[i].frequency);
      }
    });
  });

  describe('getExtension', () => {
    it('should return json extension', () => {
      expect(formatter.getExtension()).toBe('json');
    });
  });

  describe('edge cases', () => {
    it('should handle reports with no sentiments', () => {
      const dataWithoutSentiment: ReportData = {
        ...mockData,
        signals: mockData.signals.map((signal) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { sentiment, ...rest } = signal;
          return rest;
        }),
      };

      const result = formatter.format(dataWithoutSentiment, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.summary.avgSentiment).toBe(0);
    });

    it('should handle reports with empty themes array', () => {
      const dataWithoutThemes = {
        ...mockData,
        themes: [],
      };

      const result = formatter.format(dataWithoutThemes, mockOptions);
      const parsed = JSON.parse(result);

      expect(parsed.themes).toEqual([]);
      expect(parsed.summary.topThemes).toEqual([]);
    });

    it('should handle maxThemes larger than available themes', () => {
      const optionsWithLargeMax = { ...mockOptions, maxThemes: 100 };
      const result = formatter.format(mockData, optionsWithLargeMax);
      const parsed = JSON.parse(result);

      expect(parsed.summary.topThemes.length).toBe(mockData.themes.length);
    });
  });
});
