/**
 * RGS Core - Insight Data Model
 *
 * Represents analyzed insights extracted from web signals.
 */

/**
 * Theme represents a topic or subject extracted from signals
 */
export interface Theme {
  /**
   * Name of the theme
   */
  readonly name: string;

  /**
   * Confidence score for this theme (0-1)
   */
  readonly confidence: number;

  /**
   * Number of signals supporting this theme
   */
  readonly frequency: number;

  /**
   * Related keywords for this theme
   */
  readonly keywords: string[];
}

/**
 * Sentiment analysis results
 */
export interface SentimentAnalysis {
  /**
   * Overall sentiment score (-1 to 1)
   */
  readonly overall: number;

  /**
   * Distribution of sentiment across signals
   */
  readonly distribution: {
    readonly positive: number;
    readonly neutral: number;
    readonly negative: number;
  };

  /**
   * Strongest positive signals
   */
  readonly positiveSignals: string[];

  /**
   * Strongest negative signals
   */
  readonly negativeSignals: string[];
}

/**
 * Language patterns observed in signals
 */
export interface LanguagePatterns {
  /**
   * Common phrases or expressions
   */
  readonly commonPhrases: string[];

  /**
   * Tone of the language (formal, casual, technical, etc.)
   */
  readonly tone: string;

  /**
   * Frequently used terms
   */
  readonly frequentTerms: Record<string, number>;

  /**
   * Emotional indicators found in language
   */
  readonly emotionalIndicators: string[];
}

/**
 * Complete insight extracted from web signals
 */
export interface Insight {
  /**
   * Identified themes across signals
   */
  readonly themes: Theme[];

  /**
   * Sentiment analysis results
   */
  readonly sentiment: SentimentAnalysis;

  /**
   * Pain points identified from signals
   */
  readonly painPoints: string[];

  /**
   * Desires and wants expressed in signals
   */
  readonly desires: string[];

  /**
   * Language patterns observed
   */
  readonly language: LanguagePatterns;

  /**
   * Overall confidence in the insight (0-1)
   */
  readonly confidence: number;
}

/**
 * Helper to create a Theme with validation
 */
export function createTheme(params: {
  name: string;
  confidence: number;
  frequency: number;
  keywords: string[];
}): Theme {
  if (params.confidence < 0 || params.confidence > 1) {
    throw new Error('Theme confidence must be between 0 and 1');
  }

  if (params.frequency < 0) {
    throw new Error('Theme frequency must be non-negative');
  }

  return {
    name: params.name,
    confidence: params.confidence,
    frequency: params.frequency,
    keywords: params.keywords,
  };
}

/**
 * Helper to create a SentimentAnalysis with validation
 */
export function createSentimentAnalysis(params: {
  overall: number;
  distribution: { positive: number; neutral: number; negative: number };
  positiveSignals: string[];
  negativeSignals: string[];
}): SentimentAnalysis {
  if (params.overall < -1 || params.overall > 1) {
    throw new Error('Overall sentiment must be between -1 and 1');
  }

  const { positive, neutral, negative } = params.distribution;
  const total = positive + neutral + negative;

  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error('Sentiment distribution must sum to 1.0');
  }

  return {
    overall: params.overall,
    distribution: params.distribution,
    positiveSignals: params.positiveSignals,
    negativeSignals: params.negativeSignals,
  };
}

/**
 * Helper to create an Insight with validation
 */
export function createInsight(params: {
  themes: Theme[];
  sentiment: SentimentAnalysis;
  painPoints: string[];
  desires: string[];
  language: LanguagePatterns;
  confidence: number;
}): Insight {
  if (params.confidence < 0 || params.confidence > 1) {
    throw new Error('Insight confidence must be between 0 and 1');
  }

  return {
    themes: params.themes,
    sentiment: params.sentiment,
    painPoints: params.painPoints,
    desires: params.desires,
    language: params.language,
    confidence: params.confidence,
  };
}

/**
 * Validates that a confidence score is in the correct range
 */
export function isValidConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1;
}
