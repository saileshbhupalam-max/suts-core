/**
 * RGS Sentiment Analysis Prompts
 *
 * Claude API prompts for sentiment and emotion detection
 */

/**
 * Main sentiment analysis prompt for single text analysis
 */
export const SENTIMENT_PROMPT = `Analyze the sentiment of this text about developer tools.

Text: {text}

Respond with ONLY a JSON object (no markdown, no explanations):
{
  "score": number,      // -1 (very negative) to +1 (very positive)
  "magnitude": number,  // 0 (neutral) to 1 (very strong emotion)
  "emotions": string[], // ["frustrated", "hopeful"]
  "reasoning": string   // Brief explanation
}

Focus on:
- Developer pain points (bugs, friction, costs)
- Feature desires and needs
- Overall satisfaction with tools
- Emotional tone (frustrated vs delighted)

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.`;

/**
 * Batch sentiment analysis prompt for analyzing multiple texts
 */
export const BATCH_SENTIMENT_PROMPT = `Analyze the sentiment of these texts about developer tools.

Texts:
{texts}

Respond with ONLY a JSON array (no markdown, no explanations):
[
  {
    "score": number,      // -1 (very negative) to +1 (very positive)
    "magnitude": number,  // 0 (neutral) to 1 (very strong emotion)
    "emotions": string[], // ["frustrated", "hopeful"]
    "reasoning": string   // Brief explanation
  }
]

Focus on:
- Developer pain points (bugs, friction, costs)
- Feature desires and needs
- Overall satisfaction with tools
- Emotional tone (frustrated vs delighted)

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON ARRAY.`;

/**
 * Formats a single text for the sentiment prompt
 */
export function formatSentimentPrompt(text: string): string {
  return SENTIMENT_PROMPT.replace('{text}', text);
}

/**
 * Formats multiple texts for the batch sentiment prompt
 */
export function formatBatchSentimentPrompt(texts: string[]): string {
  const formattedTexts = texts
    .map((text, index) => `${index + 1}. ${text}`)
    .join('\n\n');
  return BATCH_SENTIMENT_PROMPT.replace('{texts}', formattedTexts);
}
