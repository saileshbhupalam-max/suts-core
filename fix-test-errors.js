const fs = require('fs');
const glob = require('glob');

// Fix all test files
const testFiles = glob.sync('packages/simulation/__tests__/**/*.test.ts');

testFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix ActionType string literals
  content = content.replace(/type: 'INSTALL'/g, "type: ActionType.INSTALL");
  content = content.replace(/type: 'CONFIGURE'/g, "type: ActionType.CONFIGURE");
  content = content.replace(/type: 'USE_FEATURE'/g, "type: ActionType.USE_FEATURE");
  content = content.replace(/type: 'READ_DOCS'/g, "type: ActionType.READ_DOCS");
  content = content.replace(/type: 'SEEK_HELP'/g, "type: ActionType.SEEK_HELP");
  content = content.replace(/type: 'CUSTOMIZE'/g, "type: ActionType.CUSTOMIZE");
  content = content.replace(/type: 'SHARE'/g, "type: ActionType.SHARE");
  content = content.replace(/type: 'UNINSTALL'/g, "type: ActionType.UNINSTALL");
  
  // Fix availableActions arrays
  content = content.replace(/availableActions: \['([A-Z_]+)'(, '([A-Z_]+)')*\]/g, (match) => {
    return match.replace(/'([A-Z_]+)'/g, 'ActionType.$1');
  });
  
  // Add ActionType import if not present
  if (!content.includes('import { ActionType }') && !content.includes('import type { ActionType }')) {
    if (content.includes("from '@suts/core'")) {
      content = content.replace(
        /import (.*) from '@suts\/core';/,
        "import { ActionType } from '@suts/core';\nimport $1 from '@suts/core';"
      );
    } else {
      const firstImport = content.indexOf('import');
      if (firstImport >= 0) {
        const endOfLine = content.indexOf('\n', firstImport);
        content = content.slice(0, endOfLine + 1) + "import { ActionType } from '@suts/core';\n" + content.slice(endOfLine + 1);
      }
    }
  }
  
  // Fix property access
  content = content.replace(/event\.context\.sessionId/g, "event.context['sessionId']");
  content = content.replace(/event\.context\.day/g, "event.context['day']");
  content = content.replace(/event\.context\.success/g, "event.context['success']");
  content = content.replace(/event\.context\.observation/g, "event.context['observation']");
  content = content.replace(/event\.context\.trigger/g, "event.context['trigger']");
  content = content.replace(/result\.stateChanges\.lastActionType/g, "result.stateChanges['lastActionType']");
  content = content.replace(/result\.stateChanges\.lastActionTimestamp/g, "result.stateChanges['lastActionTimestamp']");
  content = content.replace(/result\.stateChanges\.totalActions/g, "result.stateChanges['totalActions']");
  
  //Fix possibly undefined
  content = content.replace(/const persona = result\.personas\[0\];/g, "const persona = result.personas[0]!;");
  content = content.replace(/const personaState = tracker\.getState\(mockPersona\.id\);/g, "const personaState = tracker.getState(mockPersona.id)!;");
  content = content.replace(/expect\(result1\.personas\[0\]\.finalState\)/g, "expect(result1.personas[0]!.finalState)");
  content = content.replace(/expect\(result1\.personas\[0\]\.totalActions\)/g, "expect(result1.personas[0]!.totalActions)");
  content = content.replace(/expect\(result2\.personas\[0\]\.finalState\)/g, "expect(result2.personas[0]!.finalState)");
  content = content.replace(/expect\(result2\.personas\[0\]\.totalActions\)/g, "expect(result2.personas[0]!.totalActions)");
  content = content.replace(/const isDifferent =/g, "const isDifferent: boolean =");
  
  // Fix personas spreading
  content = content.replace(/\.\.\.personas\[0\], id:/g, "...personas[0]!, id:");
  content = content.replace(/\.\.\.mockPersonas\[0\], id:/g, "...mockPersonas[0]!, id:");
  
  fs.writeFileSync(file, content);
});

console.log(`Fixed ${testFiles.length} test files`);
