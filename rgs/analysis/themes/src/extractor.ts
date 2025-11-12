/**
 * RGS Analysis - Theme Extractor
 *
 * Extracts themes from web signals using Claude API.
 */

import Anthropic from '@anthropic-ai/sdk';
import { WebSignal } from '@rgs/core';
import { Logger, LogLevel } from '@rgs/utils';
import { KeywordClusterer } from './clusterer';
import {
  ExtractedTheme,
  RawThemeExtraction,
  ThemeExtractionConfig,
  DEFAULT_EXTRACTION_CONFIG,
  isRawThemeExtraction,
} from './types';

/**
 * Theme extraction prompt template
 */
const THEME_EXTRACTION_PROMPT = `Extract key themes from these developer discussions.

Discussions:
{texts}

Identify:
1. Pain points (problems, frustrations, blockers)
2. Desires (wishes, needs, requests)
3. Feature requests (specific asks)
4. Workflow patterns (how they work)
5. Comparisons (vs other tools)

Respond with ONLY a JSON array (no markdown):
[
  {
    "theme": "string",
    "keywords": ["string"],
    "category": "pain|desire|feature|workflow|comparison",
    "examples": ["string"]
  }
]

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON ARRAY.`;

/**
 * Theme extractor using Claude API
 */
export class ThemeExtractor {
  private readonly logger: Logger;

  constructor(
    private readonly claude: Anthropic,
    private readonly clusterer: KeywordClusterer,
    private readonly config: ThemeExtractionConfig = DEFAULT_EXTRACTION_CONFIG,
    logger?: Logger,
  ) {
    this.logger = logger ?? new Logger({ minLevel: LogLevel.INFO });
  }

  /**
   * Extract themes from web signals
   */
  async extract(signals: readonly WebSignal[]): Promise<ExtractedTheme[]> {
    if (signals.length === 0) {
      this.logger.warn('No signals provided for theme extraction');
      return [];
    }

    this.logger.info(`Extracting themes from ${signals.length} signals`);

    // Process signals in batches
    const batches = this.batchSignals(signals);
    const allRawThemes: RawThemeExtraction[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (batch === undefined) {
continue;
}

      this.logger.debug(`Processing batch ${i + 1}/${batches.length}`);

      try {
        const rawThemes = await this.extractFromBatch(batch);
        allRawThemes.push(...rawThemes);
      } catch (error) {
        this.logger.error(`Failed to extract themes from batch ${i + 1}`, { error });
        // Continue with other batches
      }
    }

    // Cluster keywords
    const allKeywords = allRawThemes.flatMap((t) => t.keywords);
    const clusters = this.clusterer.cluster(allKeywords);

    this.logger.debug(`Clustered ${allKeywords.length} keywords into ${clusters.length} groups`);

    // Build themes with clustered keywords
    const themes = this.buildThemes(allRawThemes);

    // Filter and rank themes
    const filtered = this.filterThemes(themes);
    const ranked = this.rankThemes(filtered);

    this.logger.info(`Extracted ${ranked.length} themes`);

    return ranked;
  }

  /**
   * Extract themes from a batch of signals using Claude
   */
  private async extractFromBatch(signals: readonly WebSignal[]): Promise<RawThemeExtraction[]> {
    // Prepare texts for Claude
    const texts = signals.map((s, i) => `[${i + 1}] ${s.content}`).join('\n\n');

    const prompt = THEME_EXTRACTION_PROMPT.replace('{texts}', texts);

    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const content = response.content[0];
      if (content === undefined || content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      const text = content.text.trim();

      // Parse JSON response
      const parsed = this.parseClaudeResponse(text);

      return parsed;
    } catch (error) {
      this.logger.error('Claude API call failed', { error });
      throw error;
    }
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(text: string): RawThemeExtraction[] {
    try {
      // Remove markdown code blocks if present
      let cleaned = text;
      if (text.startsWith('```')) {
        cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
      }

      const parsed: unknown = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array');
      }

      // Validate each theme
      const themes: RawThemeExtraction[] = [];
      for (const item of parsed) {
        if (isRawThemeExtraction(item)) {
          themes.push(item);
        } else {
          this.logger.warn('Invalid theme extraction item', { item: item as unknown });
        }
      }

      return themes;
    } catch (error) {
      this.logger.error('Failed to parse Claude response', { error, text });
      return [];
    }
  }

  /**
   * Build ExtractedThemes from raw themes
   */
  private buildThemes(
    rawThemes: readonly RawThemeExtraction[],
  ): ExtractedTheme[] {
    // Group raw themes by name
    const themeGroups = new Map<string, RawThemeExtraction[]>();

    for (const raw of rawThemes) {
      const normalized = raw.theme.toLowerCase().trim();
      const existing = themeGroups.get(normalized);

      if (existing !== undefined) {
        existing.push(raw);
      } else {
        themeGroups.set(normalized, [raw]);
      }
    }

    // Build ExtractedThemes
    const themes: ExtractedTheme[] = [];

    for (const [name, group] of themeGroups) {
      const allKeywords = group.flatMap((t) => t.keywords);
      const uniqueKeywords = Array.from(new Set(allKeywords));

      const allExamples = group.flatMap((t) => t.examples);
      const uniqueExamples = Array.from(new Set(allExamples)).slice(0, this.config.maxExamples);

      // Use most common category
      const category = this.getMostCommonCategory(group);

      // Calculate sentiment from category
      const sentiment = this.calculateSentiment(category);

      const firstTheme = group[0];
      if (firstTheme === undefined) {
continue;
}

      const theme: ExtractedTheme = {
        id: this.generateThemeId(name),
        name: firstTheme.theme, // Use original casing
        keywords: uniqueKeywords,
        category,
        frequency: group.length,
        sentiment,
        confidence: this.calculateConfidence(group.length, uniqueKeywords.length),
        examples: uniqueExamples,
      };

      themes.push(theme);
    }

    return themes;
  }

  /**
   * Calculate sentiment score based on category
   */
  private calculateSentiment(category: string): number {
    // Simple heuristic based on category
    switch (category) {
      case 'pain':
      case 'frustration':
        return -0.6;
      case 'desire':
      case 'request':
        return 0.3;
      case 'feature':
        return 0.5;
      case 'workflow':
        return 0.1;
      case 'comparison':
        return 0.0;
      default:
        return 0.0;
    }
  }

  /**
   * Get most common category from group
   */
  private getMostCommonCategory(group: readonly RawThemeExtraction[]): RawThemeExtraction['category'] {
    const counts = new Map<string, number>();

    for (const item of group) {
      const count = counts.get(item.category) ?? 0;
      counts.set(item.category, count + 1);
    }

    const firstItem = group[0];
    let maxCategory: RawThemeExtraction['category'] = firstItem !== undefined ? firstItem.category : 'pain';
    let maxCount = 0;

    for (const [category, count] of counts) {
      if (count > maxCount) {
        maxCategory = category as RawThemeExtraction['category'];
        maxCount = count;
      }
    }

    return maxCategory;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(frequency: number, keywordCount: number): number {
    // Higher frequency and more keywords = higher confidence
    const frequencyScore = Math.min(frequency / 10, 1.0);
    const keywordScore = Math.min(keywordCount / 5, 1.0);

    return (frequencyScore * 0.7 + keywordScore * 0.3);
  }

  /**
   * Generate unique theme ID
   */
  private generateThemeId(name: string): string {
    const normalized = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const timestamp = Date.now().toString(36);
    return `${normalized}-${timestamp}`;
  }

  /**
   * Filter themes based on configuration
   */
  private filterThemes(themes: readonly ExtractedTheme[]): ExtractedTheme[] {
    return themes.filter((theme) => {
      if (theme.frequency < this.config.minFrequency) {
        return false;
      }

      if (!this.config.includeLowConfidence && theme.confidence < this.config.minConfidence) {
        return false;
      }

      return true;
    });
  }

  /**
   * Rank themes by importance
   */
  private rankThemes(themes: readonly ExtractedTheme[]): ExtractedTheme[] {
    return [...themes].sort((a, b) => {
      // Sort by frequency first, then confidence
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Batch signals for processing
   */
  private batchSignals(signals: readonly WebSignal[]): WebSignal[][] {
    const batches: WebSignal[][] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < signals.length; i += batchSize) {
      batches.push([...signals.slice(i, i + batchSize)]);
    }

    return batches;
  }
}

/**
 * Create a theme extractor with default configuration
 */
export function createThemeExtractor(
  claude: Anthropic,
  clusterer: KeywordClusterer,
  config?: Partial<ThemeExtractionConfig>,
  logger?: Logger,
): ThemeExtractor {
  const fullConfig = {
    ...DEFAULT_EXTRACTION_CONFIG,
    ...config,
  };
  return new ThemeExtractor(claude, clusterer, fullConfig, logger);
}
