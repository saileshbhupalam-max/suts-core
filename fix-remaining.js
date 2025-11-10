const fs = require('fs');

// Fix unused persona parameter
let simulationLoop = fs.readFileSync('packages/simulation/src/SimulationLoop.ts', 'utf8');

simulationLoop = simulationLoop.replace(
  'private checkTimeBasedTransitions(\n    state: PersonaSimulationState,\n    persona: PersonaProfile\n  ): void {',
  'private checkTimeBasedTransitions(\n    state: PersonaSimulationState,\n    _persona: PersonaProfile\n  ): void {'
);

fs.writeFileSync('packages/simulation/src/SimulationLoop.ts', simulationLoop);

// Fix ActionProcessor property access
let actionProcessor = fs.readFileSync('packages/simulation/src/state/ActionProcessor.ts', 'utf8');
actionProcessor = actionProcessor.replace(
  "stateChanges['totalActions'] = ((persona.state.totalActions as number) || 0) + 1;",
  "stateChanges['totalActions'] = ((persona.state['totalActions'] as number) || 0) + 1;"
);
fs.writeFileSync('packages/simulation/src/state/ActionProcessor.ts', actionProcessor);

console.log('Final remaining fixes applied');
