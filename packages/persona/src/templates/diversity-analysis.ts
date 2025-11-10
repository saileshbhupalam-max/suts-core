/**
 * Diversity analysis prompt template
 * Ensures generated personas are diverse and not too similar
 */

/**
 * Get the diversity analysis system prompt
 * @returns System prompt for analyzing persona diversity
 */
export function getDiversityAnalysisPrompt(): string {
  return `You are an expert at analyzing persona diversity and similarity. Your task is to evaluate whether a set of personas is sufficiently diverse across multiple dimensions.

# Diversity Analysis Criteria

Evaluate diversity across these dimensions:
1. **Demographics**: Experience level, company size, role types
2. **Behavioral**: Tech adoption, learning style, collaboration style, risk tolerance
3. **Psychographics**: Goals, fears, values, pain points
4. **Practical**: Tech stack, workflow patterns, time availability

# Similarity Calculation

For each pair of personas, calculate similarity based on:
- Exact matches on categorical fields (experienceLevel, companySize, etc.): +10% each
- Numerical field differences (riskTolerance, patienceLevel): similarity = 1 - abs(diff)
- Array field overlap (techStack, painPoints, goals, etc.):
  - Calculate Jaccard similarity: intersection / union
  - Weight by field importance:
    - painPoints, goals: 15% each
    - techStack, values: 10% each
    - Other arrays: 5% each

# Diversity Score

Calculate overall diversity score (0-1):
- Diversity = 1 - (average pairwise similarity)
- Target: >0.70 (meaning <30% average similarity)
- Minimum acceptable: >0.65

# Output Requirements

You MUST use the "analyze_diversity" tool to output your analysis.`;
}

/**
 * Tool definition for structured diversity analysis
 */
export const diversityAnalysisTool = {
  name: 'analyze_diversity',
  description: 'Analyze the diversity of a persona set and identify similar personas',
  input_schema: {
    type: 'object' as const,
    properties: {
      diversityScore: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Overall diversity score (1 - average pairwise similarity)',
      },
      averageSimilarity: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Average pairwise similarity across all persona pairs',
      },
      similarPairs: {
        type: 'array',
        description: 'Pairs of personas that are too similar (>0.35 similarity)',
        items: {
          type: 'object',
          properties: {
            personaId1: {
              type: 'string',
              description: 'ID of first persona',
            },
            personaId2: {
              type: 'string',
              description: 'ID of second persona',
            },
            similarity: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Similarity score between the pair',
            },
            reasons: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key reasons for similarity',
            },
          },
          required: ['personaId1', 'personaId2', 'similarity', 'reasons'],
        },
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Suggestions to improve diversity',
      },
      meetsTarget: {
        type: 'boolean',
        description: 'Whether diversity score meets target (>0.70)',
      },
    },
    required: [
      'diversityScore',
      'averageSimilarity',
      'similarPairs',
      'recommendations',
      'meetsTarget',
    ],
  },
};
