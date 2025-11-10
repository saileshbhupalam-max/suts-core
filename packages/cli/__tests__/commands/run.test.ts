/**
 * Tests for run command
 */

import * as fs from 'fs';
import * as path from 'path';
import { runCommand } from '../../src/commands/run';

describe('run command', () => {
  const testOutputDir = path.join(__dirname, '../test-output/simulation');
  const testConfigFile = path.join(__dirname, '../fixtures/valid-config.json');

  beforeEach(() => {
    // Clean up test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  it('should run simulation and generate all output files', async () => {
    const options = {
      config: testConfigFile,
      output: testOutputDir,
      verbose: false,
    };

    await runCommand(options);

    expect(fs.existsSync(path.join(testOutputDir, 'summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'personas.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'events.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'friction-points.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'value-moments.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'go-no-go.json'))).toBe(true);
  });

  it('should override personas from command line', async () => {
    const options = {
      config: testConfigFile,
      output: testOutputDir,
      personas: 20,
      verbose: false,
    };

    await runCommand(options);

    const personasFile = path.join(testOutputDir, 'personas.json');
    const personas = JSON.parse(fs.readFileSync(personasFile, 'utf-8'));

    expect(personas.length).toBe(20);
  });

  it('should override days from command line', async () => {
    const options = {
      config: testConfigFile,
      output: testOutputDir,
      days: 5,
      verbose: false,
    };

    await runCommand(options);

    const summaryFile = path.join(testOutputDir, 'summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));

    expect(summary.simulationDays).toBe(5);
  });

  it('should override product from command line', async () => {
    const options = {
      config: testConfigFile,
      output: testOutputDir,
      product: 'custom-product',
      verbose: false,
    };

    await runCommand(options);

    const summaryFile = path.join(testOutputDir, 'summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));

    expect(summary.productPlugin).toBe('custom-product');
  });

  it('should handle verbose mode', async () => {
    const options = {
      config: testConfigFile,
      output: testOutputDir,
      verbose: true,
    };

    await runCommand(options);

    expect(fs.existsSync(testOutputDir)).toBe(true);
  });

  it('should handle json output mode', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const options = {
      config: testConfigFile,
      output: testOutputDir,
      json: true,
    };

    await runCommand(options);

    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should use default output directory from config', async () => {
    const options = {
      config: testConfigFile,
      verbose: false,
    };

    await runCommand(options);

    const defaultDir = path.resolve('./test-output');
    expect(fs.existsSync(defaultDir)).toBe(true);

    // Clean up
    fs.rmSync(defaultDir, { recursive: true });
  });

  it('should handle non-existent config file', async () => {
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit: ${code}`);
    });

    const options = {
      config: './non-existent.json',
      output: testOutputDir,
      verbose: false,
    };

    await expect(runCommand(options)).rejects.toThrow();

    processExitSpy.mockRestore();
  });

  it('should handle invalid config file', async () => {
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit: ${code}`);
    });

    const invalidConfig = path.join(__dirname, '../fixtures/invalid-config.json');

    const options = {
      config: invalidConfig,
      output: testOutputDir,
      verbose: false,
    };

    await expect(runCommand(options)).rejects.toThrow();

    processExitSpy.mockRestore();
  });
});
