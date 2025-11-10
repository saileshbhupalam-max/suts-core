const fs = require('fs');

// Fix SimulationLoop unused variables
let simulationLoop = fs.readFileSync('packages/simulation/src/SimulationLoop.ts', 'utf8');

// Fix unused parameters
simulationLoop = simulationLoop.replace(
  'private checkTimeBasedTransitions(\n    state: PersonaSimulationState,\n    persona: PersonaProfile',
  'private checkTimeBasedTransitions(\n    state: PersonaSimulationState,\n    _persona: PersonaProfile'
);

simulationLoop = simulationLoop.replace(
  'private checkActionBasedTransitions(\n    state: PersonaSimulationState,\n    persona: PersonaProfile,',
  'private checkActionBasedTransitions(\n    state: PersonaSimulationState,\n    _persona: PersonaProfile,'
);

simulationLoop = simulationLoop.replace(
  'private determineActionSuccess(\n    decision: { action: ActionType; confidence: number },\n    persona: PersonaProfile,\n    product: ProductState',
  'private determineActionSuccess(\n    decision: { action: ActionType; confidence: number },\n    persona: PersonaProfile,\n    _product: ProductState'
);

// Fix the churned state check with a comment
simulationLoop = simulationLoop.replace(
  '    // Skip if churned (shouldn\'t happen, but check anyway)\n    if (state.currentState === PersonaState.CHURNED) {',
  '    // Skip if churned\n    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition\n    if (state.currentState === PersonaState.CHURNED) {'
);

fs.writeFileSync('packages/simulation/src/SimulationLoop.ts', simulationLoop);

// Fix ActionProcessor property access
let actionProcessor = fs.readFileSync('packages/simulation/src/state/ActionProcessor.ts', 'utf8');

// Fix remaining property access
actionProcessor = actionProcessor.replace(
  "stateChanges.lastActionType = action.type;",
  "stateChanges['lastActionType'] = action.type;"
);

actionProcessor = actionProcessor.replace(
  "stateChanges.lastActionTimestamp = action.timestamp;",
  "stateChanges['lastActionTimestamp'] = action.timestamp;"
);

actionProcessor = actionProcessor.replace(
  "stateChanges.totalActions = ((persona.state.totalActions as number) || 0) + 1;",
  "stateChanges['totalActions'] = ((persona.state['totalActions'] as number) || 0) + 1;"
);

fs.writeFileSync('packages/simulation/src/state/ActionProcessor.ts', actionProcessor);

console.log('Final fixes applied!');
