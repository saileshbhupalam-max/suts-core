#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`)
};

function exec(cmd, options = {}) {
  try {
    console.log(`\n> ${cmd}`);
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.allowFail) {
      log.error(`✗ Command failed: ${cmd}`);
      log.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

log.header('=========================================');
log.header('SUTS BATCH 2 + 3 - MERGE TO MAIN');
log.header('=========================================\n');

// Verify we're in the right directory
if (!fs.existsSync('package.json')) {
  log.error('✗ Not in repository root. Please cd to suts-core/');
  process.exit(1);
}

// Verify on main branch
log.info('Verifying current branch...');
const currentBranch = exec('git branch --show-current', { silent: true }).trim();
if (currentBranch !== 'main' && currentBranch !== 'master') {
  log.error(`✗ Not on main branch. Current: ${currentBranch}`);
  log.info('Run: git checkout main');
  process.exit(1);
}
log.success(`✓ On ${currentBranch} branch\n`);

// Fetch all branches
log.info('Fetching latest branches...');
exec('git fetch origin');
log.success('✓ Fetch complete\n');

// Get branch names
log.info('Finding branches to merge...');
const branchList = exec('git branch -r', { silent: true });
const branches = {
  network: branchList.split('\n').find(b => b.includes('claude/network-simulator'))?.trim().replace('origin/', ''),
  analysis: branchList.split('\n').find(b => b.includes('claude/analysis-engine'))?.trim().replace('origin/', ''),
  decision: branchList.split('\n').find(b => b.includes('claude/decision-system'))?.trim().replace('origin/', ''),
  vibeatlas: branchList.split('\n').find(b => b.includes('claude/vibeatlas-plugin'))?.trim().replace('origin/', ''),
  cli: branchList.split('\n').find(b => b.includes('claude/cli-orchestrator'))?.trim().replace('origin/', ''),
  docs: branchList.split('\n').find(b => b.includes('documentation'))?.trim().replace('origin/', '')
};

// Verify all branches found
const missing = Object.entries(branches).filter(([k, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  log.error(`✗ Missing branches: ${missing.join(', ')}`);
  log.info('Available branches:');
  console.log(branchList);
  process.exit(1);
}

log.success('✓ Found all 6 branches:');
Object.entries(branches).forEach(([key, val]) => {
  log.success(`  ✓ ${key.padEnd(12)}: ${val}`);
});
console.log('');

// Confirm merge
log.info('About to merge 6 branches in this order:');
console.log('  1. Network Simulator (Batch 2)');
console.log('  2. Analysis Engine (Batch 2)');
console.log('  3. Decision System (Batch 2)');
console.log('  4. VibeAtlas Plugin (Batch 2)');
console.log('  5. CLI Orchestrator (Batch 3)');
console.log('  6. Documentation (Batch 3)');
console.log('');

// Create checkpoint before merge
log.info('Creating pre-merge checkpoint...');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
exec(`git tag pre-merge-batch2-3-${timestamp}`);
log.success(`✓ Checkpoint: pre-merge-batch2-3-${timestamp}\n`);

// Merge Batch 2
log.header('========================================');
log.header('BATCH 2 MERGES (4 branches)');
log.header('========================================\n');

log.info('[1/6] Merging Network Simulator...');
exec(`git merge --no-ff ${branches.network} -m "chore: merge network simulator with viral spread and 95%+ coverage"`);
log.success('✓ Network Simulator merged\n');

log.info('[2/6] Merging Analysis Engine...');
exec(`git merge --no-ff ${branches.analysis} -m "chore: merge analysis engine with friction/value detection and 95%+ coverage"`);
log.success('✓ Analysis Engine merged\n');

log.info('[3/6] Merging Decision System...');
exec(`git merge --no-ff ${branches.decision} -m "chore: merge decision system with prioritization and 95%+ coverage"`);
log.success('✓ Decision System merged\n');

log.info('[4/6] Merging VibeAtlas Plugin...');
exec(`git merge --no-ff ${branches.vibeatlas} -m "chore: merge vibeatlas plugin adapter with 95%+ coverage"`);
log.success('✓ VibeAtlas Plugin merged\n');

// Merge Batch 3
log.header('========================================');
log.header('BATCH 3 MERGES (2 branches)');
log.header('========================================\n');

log.info('[5/6] Merging CLI Orchestrator...');
exec(`git merge --no-ff ${branches.cli} -m "chore: merge cli orchestrator with command-line interface"`);
log.success('✓ CLI Orchestrator merged\n');

log.info('[6/6] Merging Documentation...');
exec(`git merge --no-ff ${branches.docs} -m "chore: merge comprehensive documentation and examples"`);
log.success('✓ Documentation merged\n');

// Verify merged main
log.header('========================================');
log.header('VERIFICATION');
log.header('========================================\n');

log.info('Installing dependencies...');
exec('npm install');
log.success('✓ Dependencies installed\n');

log.info('Running CI checks on merged main...');
const ciResult = exec('npm run ci 2>&1', { silent: true, allowFail: true });
if (ciResult === null) {
  log.error('✗ CI checks failed on merged main!');
  log.error('Rolling back merge...');
  exec(`git reset --hard pre-merge-batch2-3-${timestamp}`);
  log.info('Merge rolled back. Please investigate CI failures.');
  log.info(`Checkpoint tag: pre-merge-batch2-3-${timestamp}`);
  process.exit(1);
}
log.success('✓ CI checks passed\n');

// Push to origin
log.info('Pushing to origin...');
exec('git push origin main');
log.success('✓ Pushed to origin\n');

// Tag milestone
log.info('Tagging milestone...');
exec('git tag -a v0.3.0-mvp-core -m "SUTS MVP Core Complete: All packages, CLI, and documentation"');
exec('git push origin v0.3.0-mvp-core');
log.success('✓ Tagged v0.3.0-mvp-core\n');

// Final summary
log.header('=========================================');
log.success('✓ BATCH 2 + 3 MERGED SUCCESSFULLY!');
log.header('=========================================\n');

log.info('Merged packages:');
log.success('  Batch 1 (Previously merged):');
log.success('    ✓ Core interfaces');
log.success('    ✓ Persona generator');
log.success('    ✓ Simulation engine');
log.success('    ✓ Telemetry layer');
log.success('  Batch 2 (Just merged):');
log.success('    ✓ Network simulator');
log.success('    ✓ Analysis engine');
log.success('    ✓ Decision system');
log.success('    ✓ VibeAtlas plugin');
log.success('  Batch 3 (Just merged):');
log.success('    ✓ CLI orchestrator');
log.success('    ✓ Documentation');

log.info('\nRemaining for complete MVP:');
console.log('  - Integration tests (all packages together)');
console.log('  - Optional: Docker setup');

log.info('\nCurrent version: v0.3.0-mvp-core');
log.info('Git tags:');
log.success(`  - pre-merge-batch2-3-${timestamp} (rollback checkpoint)`);
log.success('  - v0.1.0-batch1 (Batch 1 complete)');
log.success('  - v0.2.0-batch2 (Batch 2 complete)');
log.success('  - v0.3.0-mvp-core (Batch 2+3 complete)');

log.info('\nNext steps:');
console.log('1. Report: "Batch 2+3 merged successfully to main"');
console.log('2. Wait for integration tests prompt');
console.log('3. Run integration tests');
console.log('4. Tag v1.0.0-mvp when complete\n');
