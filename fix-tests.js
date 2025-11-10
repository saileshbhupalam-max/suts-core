const fs = require('fs');

// Fix SimulationEngine.test.ts
let engineTest = fs.readFileSync('packages/simulation/__tests__/SimulationEngine.test.ts', 'utf8');

// Make batchSize and maxActionsPerDay optional by adding defaults
engineTest = engineTest.replace(
  /new SimulationEngine\(\{ seed: (\d+) \}\)/g,
  'new SimulationEngine({ seed: $1, batchSize: 10, maxActionsPerDay: 5 })'
);

engineTest = engineTest.replace(
  /new SimulationEngine\(\{ seed: (\d+), batchSize: (\d+) \}\)/g,
  'new SimulationEngine({ seed: $1, batchSize: $2, maxActionsPerDay: 5 })'
);

engineTest = engineTest.replace(
  /new SimulationEngine\(\{ seed: (\d+), maxActionsPerDay: (\d+) \}\)/g,
  'new SimulationEngine({ seed: $1, batchSize: 10, maxActionsPerDay: $2 })'
);

// Fix persona property access
engineTest = engineTest.replace(/const persona = result\.personas\[0\];/g, 'const persona = result.personas[0]!;');

// Fix persona spread in test
engineTest = engineTest.replace(
  /\.\.\.(mockPersonas\[0\]|personas\[0\]), id: 'persona-2'/g,
  '...(mockPersonas[0]!), id: \'persona-2\''
);

engineTest = engineTest.replace(
  /\.\.\.(mockPersonas\[0\]|personas\[0\]), id: 'persona-3'/g,
  '...(mockPersonas[0]!), id: \'persona-3\''
);

fs.writeFileSync('packages/simulation/__tests__/SimulationEngine.test.ts', engineTest);

console.log('Test fixes applied!');
