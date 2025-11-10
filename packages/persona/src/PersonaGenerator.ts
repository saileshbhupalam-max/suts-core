/**
 * PersonaGenerator - LLM-based persona generation implementation
 * Generates realistic user personas from stakeholder analysis using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import type { IPersonaGenerator, PersonaProfile } from '@suts/core';
import { getPersonaGenerationPrompt, personaGenerationTool } from './templates/persona-generation';
import {
  analyzeDiversity,
  validatePersonas,
  checkDuplicates,
  validatePersona as validatePersonaSchema,
} from './validation';

/**
 * Configuration options for PersonaGenerator
 */
export interface PersonaGeneratorConfig {
  /** Temperature for LLM sampling (0-1, higher = more random) */
  temperature?: number;
  /** Top-p sampling parameter (0-1) */
  topP?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Number of retry attempts for API calls */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
  /** Target diversity score (0-1) */
  diversityTarget?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<PersonaGeneratorConfig> = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 16000,
  maxRetries: 3,
  retryDelay: 1000,
  diversityTarget: 0.7,
};

/**
 * Error class for persona generation errors
 */
export class PersonaGenerationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, errorCause?: Error) {
    super(message);
    this.name = 'PersonaGenerationError';
    if (errorCause !== undefined) {
      this.cause = errorCause;
    }
  }
}

/**
 * Persona generator implementation using Claude API
 */
export class PersonaGenerator implements IPersonaGenerator {
  private client: Anthropic;
  private model: string;
  private config: Required<PersonaGeneratorConfig>;

  /**
   * Create a new PersonaGenerator
   * @param apiKey - Anthropic API key
   * @param model - Claude model to use (default: claude-sonnet-4-20250514)
   * @param config - Optional configuration
   */
  constructor(
    apiKey: string,
    model: string = 'claude-sonnet-4-20250514',
    config: PersonaGeneratorConfig = {}
  ) {
    if (apiKey.length === 0 || apiKey.trim().length === 0) {
      throw new PersonaGenerationError('API key is required');
    }

    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate personas from stakeholder analysis documents
   * @param docs - Array of analysis documents (text/markdown)
   * @param count - Number of personas to generate
   * @returns Promise resolving to array of generated personas
   */
  async generateFromAnalysis(docs: string[], count: number): Promise<PersonaProfile[]> {
    if (docs.length === 0) {
      throw new PersonaGenerationError('At least one analysis document is required');
    }

    if (count < 1 || count > 100) {
      throw new PersonaGenerationError('Count must be between 1 and 100');
    }

    // Combine analysis documents
    const analysisText = docs.join('\n\n---\n\n');

    // Generate personas with retry logic
    let personas = await this.generatePersonasWithRetry(analysisText, count);

    // Validate all personas
    const validationResults = validatePersonas(personas);
    const invalidPersonas = Array.from(validationResults.entries()).filter(
      ([, result]) => !result.valid
    );

    if (invalidPersonas.length > 0) {
      const errors = invalidPersonas
        .map(([id, result]) => `${id}: ${result.errors.join(', ')}`)
        .join('; ');
      throw new PersonaGenerationError(`Generated personas failed validation: ${errors}`);
    }

    // Check for duplicates
    const duplicates = checkDuplicates(personas);
    if (duplicates.length > 0) {
      throw new PersonaGenerationError(`Duplicate persona IDs found: ${duplicates.join(', ')}`);
    }

    // Ensure diversity
    personas = this.ensureDiversity(personas);

    return personas;
  }

  /**
   * Generate personas with retry logic
   * @param analysisText - Combined analysis text
   * @param count - Number of personas to generate
   * @returns Promise resolving to personas
   */
  private async generatePersonasWithRetry(
    analysisText: string,
    count: number
  ): Promise<PersonaProfile[]> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.generatePersonasFromAPI(analysisText, count);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw new PersonaGenerationError(
            `Non-retryable error during persona generation: ${lastError.message}`,
            lastError
          );
        }

        // Wait before retry with exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw new PersonaGenerationError(
      `Failed to generate personas after ${this.config.maxRetries} attempts`,
      lastError
    );
  }

  /**
   * Generate personas from API
   * @param analysisText - Combined analysis text
   * @param count - Number of personas to generate
   * @returns Promise resolving to personas
   */
  private async generatePersonasFromAPI(
    analysisText: string,
    count: number
  ): Promise<PersonaProfile[]> {
    const systemPrompt = getPersonaGenerationPrompt(count);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      top_p: this.config.topP,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please analyze the following stakeholder analysis documents and generate ${count} diverse, realistic user personas.\n\n# Analysis Documents\n\n${analysisText}`,
        },
      ],
      tools: [personaGenerationTool],
      tool_choice: { type: 'tool', name: 'generate_personas' },
    });

    // Extract personas from tool use
    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === 'tool_use' && block.name === 'generate_personas'
    );

    if (toolUse === undefined || toolUse.type !== 'tool_use') {
      throw new PersonaGenerationError('No tool use found in API response');
    }

    const { personas } = toolUse.input as { personas: PersonaProfile[] };

    if (!Array.isArray(personas) || personas.length === 0) {
      throw new PersonaGenerationError('No personas returned from API');
    }

    if (personas.length !== count) {
      throw new PersonaGenerationError(`Expected ${count} personas, got ${personas.length}`);
    }

    return personas;
  }

  /**
   * Ensure diversity meets target threshold
   * @param personas - Initial personas
   * @returns Diverse personas
   */
  private ensureDiversity(personas: PersonaProfile[]): PersonaProfile[] {
    if (personas.length < 2) {
      return personas; // No diversity check needed for single persona
    }

    const diversity = analyzeDiversity(personas);

    if (diversity.diversityScore >= this.config.diversityTarget) {
      return personas; // Diversity target met
    }

    // If diversity is too low, try to regenerate with stronger diversity prompts
    // For now, we'll accept personas that are at least 65% diverse
    if (diversity.diversityScore < 0.65) {
      throw new PersonaGenerationError(
        `Personas are too similar (diversity: ${(diversity.diversityScore * 100).toFixed(1)}%, target: ${(this.config.diversityTarget * 100).toFixed(1)}%)`
      );
    }

    return personas;
  }

  /**
   * Check if an error is retryable
   * @param error - Error to check
   * @returns True if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('timeout')
    ) {
      return true;
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return true;
    }

    // Temporary server errors
    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true;
    }

    // Anthropic SDK specific errors
    if ('status' in error) {
      const status = (error as { status?: number }).status;
      return status === 429 || (status !== undefined && status >= 500 && status < 600);
    }

    return false;
  }

  /**
   * Sleep for specified duration
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the current configuration
   * @returns Current configuration
   */
  getConfig(): Required<PersonaGeneratorConfig> {
    return { ...this.config };
  }

  // ============================================================
  // IPersonaGenerator interface implementation
  // ============================================================

  /**
   * Generate personas from stakeholder analysis documents (interface method)
   * @param config - Configuration for persona generation
   * @returns Promise resolving to generated personas with metadata
   */
  async generatePersonas(
    config: import('@suts/core').PersonaGenerationConfig
  ): Promise<import('@suts/core').PersonaGenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Extract configuration
    const numPersonas = config.numPersonas ?? 30;
    const diversityWeight = config.diversityWeight ?? 0.8;

    // Load analysis documents
    let analysisDocs: string[];
    try {
      const fs = await import('node:fs/promises');
      analysisDocs = await Promise.all(
        config.analysisDocs.map(async (doc) => {
          // If it looks like a file path, read it
          if (doc.includes('/') || doc.includes('\\\\')) {
            try {
              return await fs.readFile(doc, 'utf-8');
            } catch {
              // If file read fails, assume it's content
              return doc;
            }
          }
          // Otherwise treat as content
          return doc;
        })
      );
    } catch (error) {
      throw new PersonaGenerationError(
        `Failed to load analysis documents: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Generate personas using existing method
    const personas = await this.generateFromAnalysis(analysisDocs, numPersonas);

    // Calculate diversity metrics
    const diversity = analyzeDiversity(personas);

    // Calculate distribution
    const distribution: Record<string, number> = {};
    for (const persona of personas) {
      distribution[persona.archetype] = (distribution[persona.archetype] ?? 0) + 1;
    }

    // Check diversity meets weight threshold
    if (diversity.diversityScore < diversityWeight) {
      warnings.push(
        `Diversity score ${(diversity.diversityScore * 100).toFixed(1)}% is below target ${(diversityWeight * 100).toFixed(1)}%`
      );
    }

    const generationTimeMs = Date.now() - startTime;

    return {
      personas,
      metadata: {
        distribution,
        diversity: {
          riskToleranceSpread: this.calculateSpread(personas.map((p) => p.riskTolerance)),
          experienceLevelSpread: this.calculateCategoricalSpread(
            personas.map((p) => p.experienceLevel)
          ),
          companySizeSpread: this.calculateCategoricalSpread(personas.map((p) => p.companySize)),
        },
        generationTimeMs,
        warnings,
      },
    };
  }

  /**
   * Generate a single persona based on an archetype specification
   * @param archetype - Archetype name
   * @param variation - Optional variation within archetype
   * @param context - Additional context for generation
   * @returns Promise resolving to generated persona
   */
  async generateSinglePersona(
    archetype: string,
    variation?: string,
    context?: Record<string, unknown>
  ): Promise<PersonaProfile> {
    // Create a minimal analysis doc for single persona generation
    const analysisDoc = `
# Persona Generation Request

Generate a single persona with the following specifications:
- Archetype: ${archetype}
${variation !== undefined ? `- Variation: ${variation}` : ''}
${context !== undefined ? `- Additional Context: ${JSON.stringify(context, null, 2)}` : ''}

Create a realistic, detailed user persona that matches these requirements.
`;

    const personas = await this.generateFromAnalysis([analysisDoc], 1);

    if (personas.length === 0) {
      throw new PersonaGenerationError('Failed to generate persona');
    }

    return personas[0]!;
  }

  /**
   * Validate a persona for completeness and consistency
   * @param persona - Persona to validate
   * @returns Validation result with any issues found
   */
  validatePersona(persona: PersonaProfile): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const result = validatePersonaSchema(persona);
    return {
      valid: result.valid,
      issues: result.errors,
      warnings: result.warnings,
    };
  }

  /**
   * Save personas to persistent storage
   * @param personas - Personas to save
   * @param destination - Destination file path
   * @returns Promise resolving when save is complete
   */
  async savePersonas(personas: PersonaProfile[], destination: string): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      // Ensure directory exists
      const dir = path.dirname(destination);
      await fs.mkdir(dir, { recursive: true });

      // Save as JSON
      const data = JSON.stringify(personas, null, 2);
      await fs.writeFile(destination, data, 'utf-8');
    } catch (error) {
      throw new PersonaGenerationError(
        `Failed to save personas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load personas from persistent storage
   * @param source - Source file path
   * @returns Promise resolving to loaded personas
   */
  async loadPersonas(source: string): Promise<PersonaProfile[]> {
    try {
      const fs = await import('node:fs/promises');
      const data = await fs.readFile(source, 'utf-8');
      const personas = JSON.parse(data) as unknown[];

      // Validate each persona
      const validationResults = validatePersonas(personas);
      const invalidPersonas = Array.from(validationResults.entries()).filter(
        ([, result]) => !result.valid
      );

      if (invalidPersonas.length > 0) {
        const errors = invalidPersonas
          .map(([id, result]) => `${id}: ${result.errors.join(', ')}`)
          .join('; ');
        throw new PersonaGenerationError(`Loaded personas failed validation: ${errors}`);
      }

      return personas as PersonaProfile[];
    } catch (error) {
      throw new PersonaGenerationError(
        `Failed to load personas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ============================================================
  // Private helper methods
  // ============================================================

  /**
   * Calculate numerical spread (standard deviation)
   */
  private calculateSpread(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate categorical spread (unique values / total)
   */
  private calculateCategoricalSpread(values: string[]): number {
    if (values.length === 0) {
      return 0;
    }
    const unique = new Set(values).size;
    return unique / values.length;
  }
}
