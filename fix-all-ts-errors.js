const fs = require('fs');

// Fix SimulationLoop.ts
let simulationLoop = fs.readFileSync('packages/simulation/src/SimulationLoop.ts', 'utf8');

// Fix ActionType usage
simulationLoop = simulationLoop.replace(/'INSTALL'/g, 'ActionType.INSTALL');
simulationLoop = simulationLoop.replace(/'CONFIGURE'/g, 'ActionType.CONFIGURE');
simulationLoop = simulationLoop.replace(/'USE_FEATURE'/g, 'ActionType.USE_FEATURE');
simulationLoop = simulationLoop.replace(/'READ_DOCS'/g, 'ActionType.READ_DOCS');
simulationLoop = simulationLoop.replace(/'SEEK_HELP'/g, 'ActionType.SEEK_HELP');
simulationLoop = simulationLoop.replace(/'CUSTOMIZE'/g, 'ActionType.CUSTOMIZE');
simulationLoop = simulationLoop.replace(/'SHARE'/g, 'ActionType.SHARE');
simulationLoop = simulationLoop.replace(/'UNINSTALL'/g, 'ActionType.UNINSTALL');

fs.writeFileSync('packages/simulation/src/SimulationLoop.ts', simulationLoop);

// Fix DecisionMaker.ts
let decisionMaker = fs.readFileSync('packages/simulation/src/behavior/DecisionMaker.ts', 'utf8');

// Fix ActionType usage
decisionMaker = decisionMaker.replace(/'SEEK_HELP'/g, 'ActionType.SEEK_HELP');
decisionMaker = decisionMaker.replace(/'READ_DOCS'/g, 'ActionType.READ_DOCS');
decisionMaker = decisionMaker.replace(/'USE_FEATURE'/g, 'ActionType.USE_FEATURE');

// Fix process.env access
decisionMaker = decisionMaker.replace(/process\.env\.ANTHROPIC_API_KEY/g, "process.env['ANTHROPIC_API_KEY']");

// Fix Anthropic content block access
decisionMaker = decisionMaker.replace(
  'const content = response.content[0];',
  'const content = response.content[0];\n      if (!content) {\n        throw new Error(\'No content in response\');\n      }'
);

decisionMaker = decisionMaker.replace(
  "content.text",
  "'text' in content ? content.text : ''"
);

fs.writeFileSync('packages/simulation/src/behavior/DecisionMaker.ts', decisionMaker);

// Fix types.ts
let types = fs.readFileSync('packages/simulation/src/types.ts', 'utf8');

types = types.replace(
  'export interface SimulationEngineConfig {\n  seed: number;\n  batchSize: number;\n  maxActionsPerDay: number;',
  'export interface SimulationEngineConfig {\n  seed: number;\n  batchSize?: number;\n  maxActionsPerDay?: number;'
);

fs.writeFileSync('packages/simulation/src/types.ts', types);

// Fix ActionProcessor.ts
let actionProcessor = fs.readFileSync('packages/simulation/src/state/ActionProcessor.ts', 'utf8');

actionProcessor = actionProcessor.replace(/persona\.state\.lastActionType/g, "persona.state['lastActionType']");
actionProcessor = actionProcessor.replace(/persona\.state\.lastActionTimestamp/g, "persona.state['lastActionTimestamp']");
actionProcessor = actionProcessor.replace(/persona\.state\.totalActions/g, "persona.state['totalActions']");

fs.writeFileSync('packages/simulation/src/state/ActionProcessor.ts', actionProcessor);

// Fix engine.ts
let engine = fs.readFileSync('packages/simulation/src/engine.ts', 'utf8');

engine = engine.replace(
  '    this.config = {\n      batchSize: 10,\n      maxActionsPerDay: 5,\n      ...config,\n    };',
  '    this.config = config;\n    this.config.batchSize = config.batchSize || 10;\n    this.config.maxActionsPerDay = config.maxActionsPerDay || 5;'
);

// Fix SimulationLoop call
engine = engine.replace(
  `    const loop = new SimulationLoop({
      seed: this.config.seed,
      batchSize: this.config.batchSize,
      maxActionsPerDay: this.config.maxActionsPerDay,
      apiKey: this.config.apiKey,
      model: this.config.model,
    });`,
  `    const loopConfig: any = {
      seed: this.config.seed,
      batchSize: this.config.batchSize!,
      maxActionsPerDay: this.config.maxActionsPerDay!,
    };
    if (this.config.apiKey !== undefined) {
      loopConfig.apiKey = this.config.apiKey;
    }
    if (this.config.model !== undefined) {
      loopConfig.model = this.config.model;
    }
    const loop = new SimulationLoop(loopConfig);`
);

fs.writeFileSync('packages/simulation/src/engine.ts', engine);

// Fix ProbabilityEngine.ts
let probEngine = fs.readFileSync('packages/simulation/src/behavior/ProbabilityEngine.ts', 'utf8');

probEngine = probEngine.replace(
  'return choices[choices.length - 1].value;',
  'return choices[choices.length - 1]!.value;'
);

fs.writeFileSync('packages/simulation/src/behavior/ProbabilityEngine.ts', probEngine);

console.log('All TypeScript fixes applied!');
