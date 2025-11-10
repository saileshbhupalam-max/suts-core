#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files in packages/network/__tests__
const testFiles = glob.sync('packages/network/__tests__/**/*.test.ts', {
  cwd: path.join(__dirname, '..')
});

console.log(`Found ${testFiles.length} test files to process`);

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add import for crypto if not present
  if (!content.includes('crypto')) {
    // Add after other imports
    const importMatch = content.match(/(import.*;\n)+/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        importMatch[0] + "import { randomUUID } from 'crypto';\n"
      );
    }
  }

  // Replace TelemetryEvent objects that don't have id
  // Pattern: { personaId: -> { id: randomUUID(), personaId:
  content = content.replace(
    /(\s+){(\s+)personaId:/g,
    '$1{$2id: randomUUID(),$2personaId:'
  );

  // Also handle the NetworkSimulator.ts file
  content = content.replace(
    /({[\s\S]*?)personaId: /g,
    function(match, prefix) {
      // Only replace if id is not already present in this object
      if (!prefix.includes('id:')) {
        return prefix + 'id: randomUUID(), personaId: ';
      }
      return match;
    }
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${file}`);
});

// Also fix NetworkSimulator.ts
const networkSimPath = 'packages/network/src/NetworkSimulator.ts';
const networkSimFilePath = path.join(__dirname, '..', networkSimPath);
if (fs.existsSync(networkSimFilePath)) {
  let content = fs.readFileSync(networkSimFilePath, 'utf-8');

  // Add import
  if (!content.includes('randomUUID')) {
    const importMatch = content.match(/(import.*;\n)+/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        importMatch[0] + "import { randomUUID } from 'crypto';\n"
      );
    }
  }

  // Fix the TelemetryEvent creation on line 275
  content = content.replace(
    /personaId: this\.config\.personaId,\s*eventType:/g,
    "id: randomUUID(), personaId: this.config.personaId, eventType:"
  );

  fs.writeFileSync(networkSimFilePath, content, 'utf-8');
  console.log(`✓ Fixed ${networkSimPath}`);
}

console.log('\nAll files fixed!');
