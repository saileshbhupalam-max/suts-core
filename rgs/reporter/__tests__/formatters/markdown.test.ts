/**
 * RGS Reporter - Markdown Formatter Tests
 */

import { MarkdownFormatter } from '../../src/formatters/markdown';
import { ReportData, ReportOptions } from '../../src/types';
import { generatePlaceholderReportData } from '../../src/templates';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;
  let mockData: ReportData;
  let mockOptions: ReportOptions;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
    mockData = generatePlaceholderReportData(10);
    mockOptions = {
      format: 'markdown',
      outputDir: '/tmp/reports',
      maxThemes: 5,
      minThemeFrequency: 1,
    };
  });

  describe('format', () => {
    it('should format report data as valid Markdown', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include main heading', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('# RGS Insights Report');
    });

    it('should include summary section', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('## Summary');
      expect(result).toContain('Total Signals:');
      expect(result).toContain('Average Sentiment:');
      expect(result).toContain('Sources:');
    });

    it('should include top themes section', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('## Top Themes');
    });

    it('should include pain points section when pain points exist', () => {
      const result = formatter.format(mockData, mockOptions);

      const hasPainPoints = mockData.themes.some((theme) => theme.category === 'pain');
      if (hasPainPoints) {
        expect(result).toContain('## Pain Points');
      }
    });

    it('should include desires section when desires exist', () => {
      const result = formatter.format(mockData, mockOptions);

      const hasDesires = mockData.themes.some((theme) => theme.category === 'desire');
      if (hasDesires) {
        expect(result).toContain('## Desires');
      }
    });

    it('should include sentiment analysis section', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('## Sentiment Analysis');
      expect(result).toContain('Overall Sentiment:');
      expect(result).toContain('Distribution:');
    });

    it('should include metadata section', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('## Metadata');
      expect(result).toContain('Total Signals Processed:');
      expect(result).toContain('Data Sources:');
    });

    it('should respect maxThemes option', () => {
      const optionsWithLimit = { ...mockOptions, maxThemes: 2 };
      const result = formatter.format(mockData, optionsWithLimit);

      // Count numbered list items in Top Themes section
      const themesSection = result.split('## Top Themes')[1]?.split('##')[0];
      const themeCount = (themesSection?.match(/^\d+\.\s/gm) ?? []).length;

      expect(themeCount).toBeLessThanOrEqual(2);
    });

    it('should format sentiment scores with signs', () => {
      const result = formatter.format(mockData, mockOptions);

      // Positive sentiment should have + sign
      if (mockData.sentiment.overall > 0) {
        expect(result).toMatch(/\+\d+\.\d+/);
      }

      // Negative sentiment should have - sign
      if (mockData.sentiment.overall < 0) {
        expect(result).toMatch(/-\d+\.\d+/);
      }
    });

    it('should include sentiment labels', () => {
      const result = formatter.format(mockData, mockOptions);

      const sentimentLabels = [
        'very positive',
        'slightly positive',
        'neutral',
        'slightly negative',
        'very negative',
      ];

      const hasLabel = sentimentLabels.some((label) => result.includes(label));
      expect(hasLabel).toBe(true);
    });

    it('should include sentiment icons', () => {
      const result = formatter.format(mockData, mockOptions);

      const icons = ['✅', '❌', '➖'];
      const hasIcon = icons.some((icon) => result.includes(icon));
      expect(hasIcon).toBe(true);
    });

    it('should filter themes by minimum frequency', () => {
      const optionsWithMinFreq = { ...mockOptions, minThemeFrequency: 30 };
      const result = formatter.format(mockData, optionsWithMinFreq);

      // Themes with frequency < 30 should not appear
      const lowFreqThemes = mockData.themes.filter((theme) => theme.frequency < 30);

      for (const theme of lowFreqThemes) {
        // Theme name might still appear in other sections, so check in Top Themes section
        const themesSection = result.split('## Top Themes')[1]?.split('##')[0];
        if (themesSection !== undefined) {
          expect(themesSection.includes(`**${theme.name}**`)).toBe(false);
        }
      }
    });

    it('should display theme keywords', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('Keywords:');
    });

    it('should display theme categories', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toContain('Category:');
    });

    it('should include percentage calculations in sentiment distribution', () => {
      const result = formatter.format(mockData, mockOptions);

      expect(result).toMatch(/Positive:.*\d+%/);
      expect(result).toMatch(/Neutral:.*\d+%/);
      expect(result).toMatch(/Negative:.*\d+%/);
    });
  });

  describe('getExtension', () => {
    it('should return md extension', () => {
      expect(formatter.getExtension()).toBe('md');
    });
  });

  describe('edge cases', () => {
    it('should handle reports with no themes', () => {
      const dataWithoutThemes = {
        ...mockData,
        themes: [],
      };

      const result = formatter.format(dataWithoutThemes, mockOptions);

      expect(result).toContain('No themes identified');
    });

    it('should handle reports with no positive signals', () => {
      const dataWithoutPositive = {
        ...mockData,
        sentiment: {
          ...mockData.sentiment,
          positiveSignals: [],
        },
      };

      const result = formatter.format(dataWithoutPositive, mockOptions);

      expect(result).not.toContain('Top Positive Signals:');
    });

    it('should handle reports with no negative signals', () => {
      const dataWithoutNegative = {
        ...mockData,
        sentiment: {
          ...mockData.sentiment,
          negativeSignals: [],
        },
      };

      const result = formatter.format(dataWithoutNegative, mockOptions);

      expect(result).not.toContain('Top Negative Signals:');
    });

    it('should handle zero sentiment scores', () => {
      const dataWithZeroSentiment = {
        ...mockData,
        sentiment: {
          ...mockData.sentiment,
          overall: 0,
        },
      };

      const result = formatter.format(dataWithZeroSentiment, mockOptions);

      expect(result).toContain('+0.00');
      expect(result).toContain('neutral');
    });
  });
});
