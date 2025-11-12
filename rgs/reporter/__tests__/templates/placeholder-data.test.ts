/**
 * RGS Reporter - Placeholder Data Tests
 */

import {
  generatePlaceholderSignals,
  generatePlaceholderThemes,
  generatePlaceholderReportData,
} from '../../src/templates';

describe('Placeholder Data', () => {
  describe('generatePlaceholderSignals', () => {
    it('should generate the requested number of signals', () => {
      const count = 10;
      const signals = generatePlaceholderSignals(count);

      expect(signals).toHaveLength(count);
    });

    it('should generate signals with required fields', () => {
      const signals = generatePlaceholderSignals(5);

      for (const signal of signals) {
        expect(signal.id).toBeDefined();
        expect(signal.source).toBeDefined();
        expect(signal.content).toBeDefined();
        expect(signal.timestamp).toBeInstanceOf(Date);
        expect(signal.url).toBeDefined();
        expect(signal.metadata).toBeDefined();
      }
    });

    it('should generate signals with sentiment scores', () => {
      const signals = generatePlaceholderSignals(5);

      for (const signal of signals) {
        expect(signal.sentiment).toBeDefined();
        expect(signal.sentiment).toBeGreaterThanOrEqual(-1);
        expect(signal.sentiment).toBeLessThanOrEqual(1);
      }
    });

    it('should generate signals with themes', () => {
      const signals = generatePlaceholderSignals(5);

      for (const signal of signals) {
        expect(signal.themes).toBeDefined();
        expect(Array.isArray(signal.themes)).toBe(true);
        if (signal.themes !== undefined) {
          expect(signal.themes.length).toBeGreaterThan(0);
        }
      }
    });

    it('should generate signals with unique IDs', () => {
      const signals = generatePlaceholderSignals(10);
      const ids = signals.map((s) => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(signals.length);
    });

    it('should generate signals with chronological timestamps', () => {
      const signals = generatePlaceholderSignals(5);

      for (let i = 1; i < signals.length; i++) {
        const prevSignal = signals[i - 1];
        const currSignal = signals[i];
        if (prevSignal !== undefined && currSignal !== undefined) {
          expect(currSignal.timestamp.getTime()).toBeGreaterThan(
            prevSignal.timestamp.getTime()
          );
        }
      }
    });

    it('should handle generating zero signals', () => {
      const signals = generatePlaceholderSignals(0);

      expect(signals).toHaveLength(0);
    });

    it('should handle generating large number of signals', () => {
      const signals = generatePlaceholderSignals(1000);

      expect(signals).toHaveLength(1000);
      const firstSignal = signals[0];
      const lastSignal = signals[999];
      if (firstSignal !== undefined) {
        expect(firstSignal.id).toBe('signal-1');
      }
      if (lastSignal !== undefined) {
        expect(lastSignal.id).toBe('signal-1000');
      }
    });
  });

  describe('generatePlaceholderThemes', () => {
    it('should generate themes with required fields', () => {
      const themes = generatePlaceholderThemes();

      for (const theme of themes) {
        expect(theme.name).toBeDefined();
        expect(theme.confidence).toBeDefined();
        expect(theme.frequency).toBeDefined();
        expect(theme.keywords).toBeDefined();
        expect(theme.category).toBeDefined();
        expect(theme.sentiment).toBeDefined();
      }
    });

    it('should generate themes with valid confidence scores', () => {
      const themes = generatePlaceholderThemes();

      for (const theme of themes) {
        expect(theme.confidence).toBeGreaterThanOrEqual(0);
        expect(theme.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should generate themes with valid sentiment scores', () => {
      const themes = generatePlaceholderThemes();

      for (const theme of themes) {
        expect(theme.sentiment).toBeGreaterThanOrEqual(-1);
        expect(theme.sentiment).toBeLessThanOrEqual(1);
      }
    });

    it('should generate themes with valid categories', () => {
      const themes = generatePlaceholderThemes();
      const validCategories = ['pain', 'desire', 'neutral'];

      for (const theme of themes) {
        expect(validCategories).toContain(theme.category);
      }
    });

    it('should generate themes with non-empty keywords', () => {
      const themes = generatePlaceholderThemes();

      for (const theme of themes) {
        expect(theme.keywords.length).toBeGreaterThan(0);
      }
    });

    it('should generate themes with positive frequencies', () => {
      const themes = generatePlaceholderThemes();

      for (const theme of themes) {
        expect(theme.frequency).toBeGreaterThan(0);
      }
    });

    it('should generate themes sorted by frequency descending', () => {
      const themes = generatePlaceholderThemes();

      for (let i = 1; i < themes.length; i++) {
        const prevTheme = themes[i - 1];
        const currTheme = themes[i];
        if (prevTheme !== undefined && currTheme !== undefined) {
          expect(prevTheme.frequency).toBeGreaterThanOrEqual(currTheme.frequency);
        }
      }
    });

    it('should generate at least one theme', () => {
      const themes = generatePlaceholderThemes();

      expect(themes.length).toBeGreaterThan(0);
    });

    it('should generate both pain and desire themes', () => {
      const themes = generatePlaceholderThemes();

      const hasPain = themes.some((theme) => theme.category === 'pain');
      const hasDesire = themes.some((theme) => theme.category === 'desire');

      expect(hasPain).toBe(true);
      expect(hasDesire).toBe(true);
    });
  });

  describe('generatePlaceholderReportData', () => {
    it('should generate complete report data structure', () => {
      const data = generatePlaceholderReportData();

      expect(data.signals).toBeDefined();
      expect(data.themes).toBeDefined();
      expect(data.sentiment).toBeDefined();
      expect(data.metadata).toBeDefined();
    });

    it('should generate the requested number of signals', () => {
      const signalCount = 50;
      const data = generatePlaceholderReportData(signalCount);

      expect(data.signals).toHaveLength(signalCount);
      expect(data.metadata.totalSignals).toBe(signalCount);
    });

    it('should generate sentiment with valid distribution', () => {
      const data = generatePlaceholderReportData();

      const { positive, neutral, negative } = data.sentiment.distribution;
      const sum = positive + neutral + negative;

      expect(sum).toBeCloseTo(1.0, 2);
      expect(positive).toBeGreaterThanOrEqual(0);
      expect(neutral).toBeGreaterThanOrEqual(0);
      expect(negative).toBeGreaterThanOrEqual(0);
    });

    it('should generate sentiment with overall score in range', () => {
      const data = generatePlaceholderReportData();

      expect(data.sentiment.overall).toBeGreaterThanOrEqual(-1);
      expect(data.sentiment.overall).toBeLessThanOrEqual(1);
    });

    it('should generate sentiment with positive and negative signals', () => {
      const data = generatePlaceholderReportData();

      expect(Array.isArray(data.sentiment.positiveSignals)).toBe(true);
      expect(Array.isArray(data.sentiment.negativeSignals)).toBe(true);
      expect(data.sentiment.positiveSignals.length).toBeGreaterThan(0);
      expect(data.sentiment.negativeSignals.length).toBeGreaterThan(0);
    });

    it('should generate metadata with required fields', () => {
      const data = generatePlaceholderReportData();

      expect(data.metadata.scrapedAt).toBeInstanceOf(Date);
      expect(data.metadata.generatedAt).toBeInstanceOf(Date);
      expect(data.metadata.sources).toBeDefined();
      expect(Array.isArray(data.metadata.sources)).toBe(true);
      expect(data.metadata.totalSignals).toBeDefined();
      expect(data.metadata.version).toBeDefined();
    });

    it('should generate metadata with correct signal count', () => {
      const signalCount = 25;
      const data = generatePlaceholderReportData(signalCount);

      expect(data.metadata.totalSignals).toBe(signalCount);
      expect(data.signals.length).toBe(signalCount);
    });

    it('should use default signal count if not specified', () => {
      const data = generatePlaceholderReportData();

      expect(data.signals.length).toBe(150);
      expect(data.metadata.totalSignals).toBe(150);
    });

    it('should generate themes with categories', () => {
      const data = generatePlaceholderReportData();

      for (const theme of data.themes) {
        expect(theme.category).toBeDefined();
        expect(['pain', 'desire', 'neutral']).toContain(theme.category);
      }
    });

    it('should handle zero signals', () => {
      const data = generatePlaceholderReportData(0);

      expect(data.signals).toHaveLength(0);
      expect(data.metadata.totalSignals).toBe(0);
    });

    it('should generate report with version', () => {
      const data = generatePlaceholderReportData();

      expect(data.metadata.version).toBe('1.0.0');
    });

    it('should generate report with sources', () => {
      const data = generatePlaceholderReportData();

      expect(data.metadata.sources).toContain('reddit');
    });
  });
});
