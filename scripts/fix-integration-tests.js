/**
 * Fix integration test files to match correct API signatures
 */

const fs = require('fs');
const path = require('path');

const testDirs = [
  'tests/integration/smoke',
  'tests/integration/contracts',
  'tests/integration/e2e',
  'tests/integration/stress',
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix: Remove adapter from SimulationEngine config
  const adapterConfigRegex = /const engine = new SimulationEngine\(\{\s*adapter,\s*timeStep: \d+,\s*maxStepsPerDay: (\d+),?\s*\}\);/g;
  if (adapterConfigRegex.test(content)) {
    content = content.replace(
      adapterConfigRegex,
      (match, maxStepsPerDay) => `const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: ${maxStepsPerDay},
    });`
    );
    modified = true;
  }

  // Fix: Change engine.run() from object to positional args
  const runObjectRegex = /engine\.run\(\{\s*personas,\s*productState,\s*days: (\d+),?\s*\}\)/g;
  if (runObjectRegex.test(content)) {
    content = content.replace(
      runObjectRegex,
      (match, days) => `engine.run(personas, productState, ${days})`
    );
    modified = true;
  }

  // Fix: Remove unused variable 'i' in concurrent tests
  content = content.replace(
    /\.map\(\(_, i\) => \{(\s+const personas)/g,
    '.map(() => {$1'
  );

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

function processDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(fullPath);
  for (const file of files) {
    if (file.endsWith('.test.ts')) {
      const filePath = path.join(fullPath, file);
      fixFile(filePath);
    }
  }
}

console.log('Fixing integration test files...\n');

for (const dir of testDirs) {
  processDirectory(dir);
}

console.log('\nDone!');
