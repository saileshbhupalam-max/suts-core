/**
 * Claude prompts for enhanced sentiment analysis
 */

/**
 * Enhanced sentiment analysis prompt template
 */
export const ENHANCED_SENTIMENT_PROMPT = `Analyze the sentiment of this developer feedback with high granularity.

Text: {text}

Respond with ONLY a JSON object (no markdown, no explanations):
{
  "scale": number,           // 1=very negative, 2=negative, 3=neutral, 4=positive, 5=very positive
  "magnitude": number,       // 0.0 (weak) to 1.0 (strong emotion)
  "emotions": [              // Top 1-3 emotions detected
    {
      "label": "string",     // e.g., "frustrated", "excited", "confused"
      "intensity": number    // 0.0 to 1.0
    }
  ],
  "confidence": number,      // 0.0 to 1.0
  "reasoning": "string"      // Brief 1-sentence explanation
}

Emotion labels (choose 1-3):
Negative: frustrated, angry, disappointed, annoyed
Neutral-negative: confused, overwhelmed, anxious, skeptical
Neutral: indifferent, curious, uncertain
Neutral-positive: hopeful, interested, satisfied
Positive: excited, delighted, grateful, impressed

Guidelines:
- Scale 1 (very negative): "This is terrible", "Unusable", "Waste of money"
- Scale 2 (negative): "Frustrating", "Doesn't work well", "Too expensive"
- Scale 3 (neutral): "It's okay", "Mixed feelings", "Could be better"
- Scale 4 (positive): "Pretty good", "Helpful", "Worth trying"
- Scale 5 (very positive): "Amazing", "Love it", "Game changer"

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.`;

/**
 * Formats prompt with text content
 *
 * @param text - Text to analyze
 * @returns Formatted prompt
 */
export function formatPrompt(text: string): string {
  return ENHANCED_SENTIMENT_PROMPT.replace('{text}', text);
}
