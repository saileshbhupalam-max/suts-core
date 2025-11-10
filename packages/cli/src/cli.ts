#!/usr/bin/env node
/**
 * SUTS CLI - Main entry point
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  registerRunCommand,
  registerGeneratePersonasCommand,
  registerAnalyzeCommand,
} from './commands';

/**
 * Get package version
 * @returns Package version string
 */
function getVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf-8')
    );
    return packageJson.version as string;
  } catch {
    return '1.0.0';
  }
}

/**
 * Main CLI function
 */
export function main(): void {
  const program = new Command();

  program
    .name('suts')
    .description('SUTS - Synthetic User Testing System CLI')
    .version(getVersion(), '-V, --version', 'Show version number');

  // Register commands
  registerRunCommand(program);
  registerGeneratePersonasCommand(program);
  registerAnalyzeCommand(program);

  // Add help command
  program
    .command('help [command]')
    .description('Display help for a command')
    .action((command?: string) => {
      if (command !== undefined && command !== null) {
        program.commands.find((cmd) => cmd.name() === command)?.help();
      } else {
        program.help();
      }
    });

  // Parse arguments
  program.parse(process.argv);

  // Show help if no command provided
  if (program.args.length === 0) {
    program.help();
  }
}

// Run CLI if this is the main module
if (require.main === module) {
  main();
}
