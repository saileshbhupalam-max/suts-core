/**
 * Run command - Execute full simulation
 */

import { Command } from 'commander';
import { ConfigLoader, SutsConfig } from '../config';
import { StatusReporter } from '../progress';
import {
  ResultsWriter,
  SummaryGenerator,
  SimulationResults,
  PersonaData,
  EventData,
  FrictionPoint,
  ValueMoment,
} from '../output';
import { ErrorHandler } from '../errors';

/**
 * Options for run command
 */
export interface RunOptions {
  config: string;
  output?: string;
  personas?: number;
  days?: number;
  product?: string;
  verbose?: boolean;
  json?: boolean;
}

/**
 * Run command handler
 * @param options - Command options
 */
export async function runCommand(options: RunOptions): Promise<void> {
  try {
    // Load and validate configuration
    const config = loadConfiguration(options);

    // Initialize status reporter
    const reporter = new StatusReporter(
      Boolean(options.verbose),
      !(options.json ?? false)
    );

    // Start simulation
    reporter.getLogger().info('Starting SUTS simulation...');
    reporter.getLogger().debug(`Configuration: ${JSON.stringify(config)}`);

    // Execute simulation phases
    const results = await executeSimulation(config, reporter);

    // Write results
    const outputDir = options.output ?? config.output?.directory ?? './suts-output';
    const writer = new ResultsWriter(outputDir);
    writer.writeResults(results);

    // Display summary
    if (!(options.json ?? false)) {
      const summary = SummaryGenerator.generateTextSummary(results);
      // eslint-disable-next-line no-console
      console.log(summary);
      reporter.getLogger().success(`Results saved to: ${outputDir}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error) {
    ErrorHandler.handle(error, Boolean(options.verbose));
  }
}

/**
 * Load and merge configuration
 * @param options - Command options
 * @returns Merged configuration
 */
function loadConfiguration(options: RunOptions): SutsConfig {
  const config = ConfigLoader.load(options.config);

  // Override with command-line options
  if (options.personas !== undefined) {
    config.simulation.personas = options.personas;
  }
  if (options.days !== undefined) {
    config.simulation.days = options.days;
  }
  if (options.product !== undefined) {
    config.simulation.product = options.product;
  }
  if (options.output !== undefined) {
    if (config.output === undefined) {
      config.output = { directory: options.output, format: 'json', generateReport: true };
    } else {
      config.output.directory = options.output;
    }
  }

  return config;
}

/**
 * Execute the complete simulation
 * @param config - Simulation configuration
 * @param reporter - Status reporter
 * @returns Simulation results
 */
async function executeSimulation(
  config: SutsConfig,
  reporter: StatusReporter
): Promise<SimulationResults> {
  const startTime = new Date();

  // Phase 1: Generate personas
  reporter.startOperation(4, 'Simulation');
  reporter.updateProgress(1, 'Generating personas...');
  const personas = await generatePersonas(config, reporter);

  // Phase 2: Run simulation
  reporter.updateProgress(2, 'Running simulation...');
  const events = await runSimulation(config, personas, reporter);

  // Phase 3: Analyze results
  reporter.updateProgress(3, 'Analyzing results...');
  const { frictionPoints, valueMoments } = await analyzeResults(
    events,
    reporter
  );

  // Phase 4: Generate decision
  reporter.updateProgress(4, 'Generating go/no-go decision...');
  const goNoGo = await generateDecision(
    frictionPoints,
    valueMoments,
    config,
    reporter
  );

  reporter.completeOperation('Simulation completed successfully');

  const endTime = new Date();
  const summary = SummaryGenerator.generateSummaryData(
    startTime,
    endTime,
    personas.length,
    events.length,
    config.simulation.days,
    config.simulation.product
  );

  return {
    summary,
    personas,
    events,
    frictionPoints,
    valueMoments,
    goNoGo,
  };
}

/**
 * Generate personas (mocked for now)
 * @param config - Configuration
 * @param reporter - Status reporter
 * @returns Generated personas
 */
async function generatePersonas(
  config: SutsConfig,
  reporter: StatusReporter
): Promise<PersonaData[]> {
  reporter.getLogger().debug(`Generating ${config.simulation.personas} personas`);

  // Mock persona generation
  const personas: PersonaData[] = [];
  for (let i = 0; i < config.simulation.personas; i++) {
    personas.push({
      id: `persona-${i + 1}`,
      name: `User ${i + 1}`,
      background: `Background for user ${i + 1}`,
      goals: ['Goal 1', 'Goal 2'],
    });
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  reporter.getLogger().debug(`Generated ${personas.length} personas`);
  return personas;
}

/**
 * Run simulation (mocked for now)
 * @param config - Configuration
 * @param personas - Personas to simulate
 * @param reporter - Status reporter
 * @returns Simulation events
 */
async function runSimulation(
  config: SutsConfig,
  personas: PersonaData[],
  reporter: StatusReporter
): Promise<EventData[]> {
  reporter
    .getLogger()
    .debug(`Running simulation for ${config.simulation.days} days`);

  // Mock simulation
  const events: EventData[] = [];
  const eventsPerPersona = config.simulation.days * 5; // 5 events per day

  for (const persona of personas) {
    for (let i = 0; i < eventsPerPersona; i++) {
      events.push({
        id: `event-${persona.id}-${i + 1}`,
        personaId: persona.id,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        eventType: 'action',
        action: 'use_feature',
        context: { feature: 'main' },
      });
    }
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 200));

  reporter.getLogger().debug(`Generated ${events.length} events`);
  return events;
}

/**
 * Analyze results (mocked for now)
 * @param events - Simulation events
 * @param reporter - Status reporter
 * @returns Friction points and value moments
 */
async function analyzeResults(
  events: EventData[],
  reporter: StatusReporter
): Promise<{ frictionPoints: FrictionPoint[]; valueMoments: ValueMoment[] }> {
  reporter.getLogger().debug(`Analyzing ${events.length} events`);

  // Mock analysis
  const frictionPoints: FrictionPoint[] = [
    {
      id: 'friction-1',
      description: 'Complex onboarding process',
      severity: 0.7,
      frequency: 0.3,
      affectedPersonas: ['persona-1', 'persona-2'],
    },
  ];

  const valueMoments: ValueMoment[] = [
    {
      id: 'value-1',
      description: 'Successful feature usage',
      impact: 0.8,
      frequency: 0.6,
      affectedPersonas: ['persona-1', 'persona-2', 'persona-3'],
    },
  ];

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 150));

  reporter
    .getLogger()
    .debug(
      `Found ${frictionPoints.length} friction points and ${valueMoments.length} value moments`
    );
  return { frictionPoints, valueMoments };
}

/**
 * Generate go/no-go decision (mocked for now)
 * @param frictionPoints - Detected friction points
 * @param valueMoments - Detected value moments
 * @param config - Configuration with thresholds
 * @param reporter - Status reporter
 * @returns Go/No-Go decision
 */
async function generateDecision(
  _frictionPoints: FrictionPoint[],
  _valueMoments: ValueMoment[],
  _config: SutsConfig,
  reporter: StatusReporter
): Promise<SimulationResults['goNoGo']> {
  reporter.getLogger().debug('Generating go/no-go decision');

  // Mock decision based on thresholds (TODO: use actual analysis data)
  const positioningScore = Math.max(0.65, Math.random() * 0.4 + 0.5);
  const retentionScore = Math.max(0.75, Math.random() * 0.3 + 0.6);
  const viralScore = Math.max(0.2, Math.random() * 0.4 + 0.15);

  const decision = SummaryGenerator.generateGoNoGoDecision(
    positioningScore,
    retentionScore,
    viralScore
  );

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  reporter.getLogger().debug(`Decision: ${decision.decision}`);
  return decision;
}

/**
 * Register run command with Commander
 * @param program - Commander program
 */
export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Run a complete SUTS simulation')
    .requiredOption('-c, --config <file>', 'Simulation configuration file')
    .option('-o, --output <dir>', 'Output directory (default: ./suts-output)')
    .option('-p, --personas <number>', 'Number of personas to generate', parseInt)
    .option('-d, --days <number>', 'Number of simulation days', parseInt)
    .option('--product <plugin>', 'Product plugin to use')
    .option('-v, --verbose', 'Verbose logging')
    .option('-j, --json', 'Output JSON only (no progress bars)')
    .action(runCommand);
}
