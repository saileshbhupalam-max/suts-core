/**
 * Generate personas command
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorHandler, SimulationError } from '../errors';
import { Logger } from '../progress';
import { PersonaData } from '../output';

/**
 * Options for generate-personas command
 */
export interface GeneratePersonasOptions {
  count: number;
  output?: string;
  diversity?: number;
  verbose?: boolean;
  json?: boolean;
}

/**
 * Generate personas command handler
 * @param options - Command options
 */
export async function generatePersonasCommand(
  options: GeneratePersonasOptions
): Promise<void> {
  try {
    const logger = new Logger(Boolean(options.verbose));

    logger.info(`Generating ${options.count} personas...`);

    // Generate personas
    const personas = await generatePersonas(options.count, options.diversity ?? 0.8);

    // Save to file
    const outputPath = options.output ?? './personas.json';
    const absolutePath = path.resolve(outputPath);

    try {
      fs.writeFileSync(
        absolutePath,
        JSON.stringify(personas, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new SimulationError(
        `Failed to write personas file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!options.json) {
      logger.success(`Generated ${personas.length} personas`);
      logger.info(`Saved to: ${absolutePath}`);
    } else {
      console.log(JSON.stringify(personas, null, 2));
    }
  } catch (error) {
    ErrorHandler.handle(error, Boolean(options.verbose));
  }
}

/**
 * Generate mock personas
 * @param count - Number of personas to generate
 * @param diversity - Diversity factor (0-1)
 * @returns Array of personas
 */
async function generatePersonas(
  count: number,
  _diversity: number
): Promise<PersonaData[]> {
  // TODO: Use diversity parameter to vary persona generation
  const personas: PersonaData[] = [];

  const backgrounds = [
    'Software developer',
    'Marketing professional',
    'Student',
    'Designer',
    'Data analyst',
  ];

  const goals = [
    'Increase productivity',
    'Learn new skills',
    'Complete projects faster',
    'Collaborate with team',
    'Automate workflows',
  ];

  for (let i = 0; i < count; i++) {
    const backgroundIndex = Math.floor(Math.random() * backgrounds.length);
    const numGoals = Math.floor(Math.random() * 3) + 1;
    const personaGoals: string[] = [];

    for (let j = 0; j < numGoals; j++) {
      const goalIndex = Math.floor(Math.random() * goals.length);
      if (!personaGoals.includes(goals[goalIndex] ?? '')) {
        const goal = goals[goalIndex];
        if (goal !== undefined) {
          personaGoals.push(goal);
        }
      }
    }

    personas.push({
      id: `persona-${i + 1}`,
      name: `User ${i + 1}`,
      background: backgrounds[backgroundIndex] ?? 'Professional',
      goals: personaGoals,
    });
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 50));

  return personas;
}

/**
 * Register generate-personas command with Commander
 * @param program - Commander program
 */
export function registerGeneratePersonasCommand(program: Command): void {
  program
    .command('generate-personas')
    .description('Generate personas only')
    .requiredOption('-n, --count <number>', 'Number of personas to generate', parseInt)
    .option('-o, --output <file>', 'Output file (default: ./personas.json)')
    .option('-d, --diversity <number>', 'Diversity factor 0-1 (default: 0.8)', parseFloat)
    .option('-v, --verbose', 'Verbose logging')
    .option('-j, --json', 'Output JSON only')
    .action(generatePersonasCommand);
}
