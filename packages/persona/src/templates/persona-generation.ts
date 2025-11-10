/**
 * Persona generation prompt template
 * System prompt for creating realistic user personas from stakeholder analysis
 */

/**
 * Get the persona generation system prompt
 * @param count - Number of personas to generate
 * @returns System prompt for persona generation
 */
export function getPersonaGenerationPrompt(count: number): string {
  return `You are an expert user researcher and persona creator. Your task is to generate ${count} highly realistic and diverse user personas based on the provided stakeholder analysis documents.

# Persona Generation Guidelines

## Persona Structure
Each persona must include the following attributes (use the exact schema provided):
- id: Unique identifier (use format: "persona-{uuid}")
- archetype: A concise descriptive label (e.g., "Cautious Enterprise Architect", "Scrappy Startup Developer")
- role: Job title/position
- experienceLevel: One of: "Novice", "Intermediate", "Expert"
- companySize: One of: "Startup", "SMB", "Enterprise"
- techStack: Array of technologies they work with (3-8 items)
- painPoints: Array of current challenges and frustrations (3-6 items)
- goals: Array of objectives they want to achieve (3-5 items)
- fears: Array of concerns and risks they worry about (2-4 items)
- values: Array of principles they prioritize (2-4 items)
- riskTolerance: Number 0-1 (0=risk-averse, 1=risk-seeking)
- patienceLevel: Number 0-1 (0=impatient, 1=very patient)
- techAdoption: One of: "Early adopter", "Early majority", "Late majority", "Laggard"
- learningStyle: One of: "Trial-error", "Documentation", "Video", "Peer learning"
- evaluationCriteria: Array of factors they consider when evaluating solutions (3-5 items)
- dealBreakers: Array of absolute no-gos (2-4 items)
- delightTriggers: Array of things that would exceed expectations (2-4 items)
- referralTriggers: Array of conditions that would make them recommend to others (2-3 items)
- typicalWorkflow: Description of their typical day/workflow (1-2 sentences)
- timeAvailability: Description of time constraints (e.g., "2-3 hours per week for evaluation")
- collaborationStyle: One of: "Solo", "Team", "Community-driven"
- state: Empty object {}
- history: Empty array []
- confidenceScore: Number 0-1 based on how well the persona is grounded in the analysis
- lastUpdated: ISO 8601 timestamp (current time)
- source: "llm-generated"

## Diversity Requirements
Ensure personas are diverse across multiple dimensions:
- Experience levels (mix of Novice, Intermediate, Expert)
- Company sizes (Startup, SMB, Enterprise)
- Tech adoption styles (Early adopter through Laggard)
- Learning preferences (all 4 styles represented)
- Risk tolerance (spread across spectrum)
- Collaboration styles (Solo, Team, Community-driven)
- Technical backgrounds (different tech stacks)
- Organizational roles (IC, lead, manager, architect, etc.)

## Realism Guidelines
1. Base personas on actual patterns from the analysis documents
2. Avoid stereotypes - create nuanced, believable individuals
3. Ensure internal consistency (e.g., Early adopters typically have higher risk tolerance)
4. Include realistic contradictions (e.g., values speed but also thoroughness)
5. Ground painPoints, goals, and fears in real-world scenarios
6. Make techStack specific and contextually appropriate
7. Ensure confidenceScore reflects how well grounded the persona is in the analysis

## Quality Criteria
- Each persona should feel like a real person, not a caricature
- Personas should be distinct from each other (aim for <30% similarity)
- All required fields must be populated with meaningful data
- Arrays should have the specified number of items
- Numeric fields must be in valid ranges (0-1 for normalized values)

# Output Format
You MUST use the tool "generate_personas" to output the personas. The tool accepts an array of persona objects matching the schema above. Do not output personas as plain text.

Remember: Quality over quantity. Each persona should be well-researched, internally consistent, and clearly differentiated from others.`;
}

/**
 * Tool definition for structured persona generation
 */
export const personaGenerationTool = {
  name: 'generate_personas',
  description: 'Generate a set of diverse, realistic user personas based on stakeholder analysis',
  input_schema: {
    type: 'object' as const,
    properties: {
      personas: {
        type: 'array',
        description: 'Array of generated personas',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            archetype: { type: 'string', description: 'Concise descriptive label' },
            role: { type: 'string', description: 'Job title/position' },
            experienceLevel: {
              type: 'string',
              enum: ['Novice', 'Intermediate', 'Expert'],
              description: 'Technical experience level'
            },
            companySize: {
              type: 'string',
              enum: ['Startup', 'SMB', 'Enterprise'],
              description: 'Organization size'
            },
            techStack: {
              type: 'array',
              items: { type: 'string' },
              description: 'Technologies they work with'
            },
            painPoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Current challenges and frustrations'
            },
            goals: {
              type: 'array',
              items: { type: 'string' },
              description: 'Objectives to achieve'
            },
            fears: {
              type: 'array',
              items: { type: 'string' },
              description: 'Concerns and risks'
            },
            values: {
              type: 'array',
              items: { type: 'string' },
              description: 'Principles they prioritize'
            },
            riskTolerance: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Risk tolerance (0=risk-averse, 1=risk-seeking)'
            },
            patienceLevel: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Patience level (0=impatient, 1=very patient)'
            },
            techAdoption: {
              type: 'string',
              enum: ['Early adopter', 'Early majority', 'Late majority', 'Laggard'],
              description: 'Technology adoption style'
            },
            learningStyle: {
              type: 'string',
              enum: ['Trial-error', 'Documentation', 'Video', 'Peer learning'],
              description: 'Preferred learning approach'
            },
            evaluationCriteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'Factors for evaluating solutions'
            },
            dealBreakers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Absolute no-gos'
            },
            delightTriggers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Things that would exceed expectations'
            },
            referralTriggers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Conditions for recommending to others'
            },
            typicalWorkflow: {
              type: 'string',
              description: 'Description of typical day/workflow'
            },
            timeAvailability: {
              type: 'string',
              description: 'Time constraints description'
            },
            collaborationStyle: {
              type: 'string',
              enum: ['Solo', 'Team', 'Community-driven'],
              description: 'Collaboration preference'
            },
            state: {
              type: 'object',
              description: 'State object (empty for new personas)'
            },
            history: {
              type: 'array',
              description: 'History array (empty for new personas)'
            },
            confidenceScore: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'How well grounded in analysis (0-1)'
            },
            lastUpdated: {
              type: 'string',
              description: 'ISO 8601 timestamp'
            },
            source: {
              type: 'string',
              description: 'Source of persona (llm-generated)'
            },
          },
          required: [
            'id', 'archetype', 'role', 'experienceLevel', 'companySize',
            'techStack', 'painPoints', 'goals', 'fears', 'values',
            'riskTolerance', 'patienceLevel', 'techAdoption', 'learningStyle',
            'evaluationCriteria', 'dealBreakers', 'delightTriggers', 'referralTriggers',
            'typicalWorkflow', 'timeAvailability', 'collaborationStyle',
            'state', 'history', 'confidenceScore', 'lastUpdated', 'source'
          ],
        },
      },
    },
    required: ['personas'],
  },
};
