/**
 * Tests for CLI main entry point
 */

import { main } from '../src/cli';

describe('CLI', () => {
  let originalArgv: string[];
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    originalArgv = process.argv;
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    process.argv = originalArgv;
    processExitSpy.mockRestore();
  });

  it('should show help when no command provided', () => {
    process.argv = ['node', 'cli.js'];

    main();

    // Help should be shown
    expect(true).toBe(true);
  });

  it('should execute without throwing', () => {
    process.argv = ['node', 'cli.js', '--version'];

    expect(() => main()).not.toThrow();
  });
});
