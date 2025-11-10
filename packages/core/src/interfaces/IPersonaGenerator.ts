/**
 * IPersonaGenerator Interface
 * Defines contract for generating user personas from analysis documents
 */

import { PersonaProfile } from '../models/index';

/**
 * Configuration for persona generation
 */
export interface PersonaGenerationConfig {
  /**
   * Source documents for persona generation (file paths or content)
   */
  analysisDocs: string[];

  /**
   * Number of personas to generate
   * @default 30
   */
  numPersonas?: number;

  /**
   * Diversity weight (0-1, higher = more diverse set)
   * @default 0.8
   */
  diversityWeight?: number;

  /**
   * Additional context or constraints for generation
   */
  context?: Record<string, unknown>;
}

/**
 * Result of persona generation
 */
export interface PersonaGenerationResult {
  /**
   * Generated personas
   */
  personas: PersonaProfile[];

  /**
   * Metadata about generation process
   */
  metadata: {
    /**
     * Distribution of personas across archetypes
     */
    distribution: Record<string, number>;

    /**
     * Diversity metrics
     */
    diversity: {
      riskToleranceSpread: number;
      experienceLevelSpread: number;
      companySizeSpread: number;
    };

    /**
     * Time taken to generate (ms)
     */
    generationTimeMs: number;

    /**
     * Any warnings or issues during generation
     */
    warnings: string[];
  };
}

/**
 * IPersonaGenerator Interface
 * Generate realistic, diverse user personas that act as autonomous agents
 */
export interface IPersonaGenerator {
  /**
   * Generate personas from stakeholder analysis documents
   *
   * @param config - Configuration for persona generation
   * @returns Promise resolving to generated personas with metadata
   * @throws Error if generation fails
   *
   * @example
   * ```typescript
   * const result = await generator.generatePersonas({
   *   analysisDocs: ['analysis1.md', 'analysis2.md'],
   *   numPersonas: 30,
   *   diversityWeight: 0.8
   * });
   * console.log(`Generated ${result.personas.length} personas`);
   * ```
   */
  generatePersonas(config: PersonaGenerationConfig): Promise<PersonaGenerationResult>;

  /**
   * Generate a single persona based on an archetype specification
   *
   * @param archetype - Archetype name
   * @param variation - Optional variation within archetype
   * @param context - Additional context for generation
   * @returns Promise resolving to generated persona
   * @throws Error if generation fails
   */
  generateSinglePersona(
    archetype: string,
    variation?: string,
    context?: Record<string, unknown>
  ): Promise<PersonaProfile>;

  /**
   * Validate a persona for completeness and consistency
   *
   * @param persona - Persona to validate
   * @returns Validation result with any issues found
   */
  validatePersona(persona: PersonaProfile): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  };

  /**
   * Save personas to persistent storage
   *
   * @param personas - Personas to save
   * @param destination - Destination path or identifier
   * @returns Promise resolving when save is complete
   * @throws Error if save fails
   */
  savePersonas(personas: PersonaProfile[], destination: string): Promise<void>;

  /**
   * Load personas from persistent storage
   *
   * @param source - Source path or identifier
   * @returns Promise resolving to loaded personas
   * @throws Error if load fails
   */
  loadPersonas(source: string): Promise<PersonaProfile[]>;
}
