/**
 * Tests for analyze command
 */

import * as fs from 'fs';
import * as path from 'path';
import { analyzeCommand } from '../../src/commands/analyze';

describe('analyze command', () => {
  const testOutputDir = path.join(__dirname, '../test-output/analysis');
  const testEventsFile = path.join(__dirname, '../fixtures/test-events.json');

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

  it('should analyze events and save results', async () => {
    const options = {
      events: testEventsFile,
      output: testOutputDir,
      verbose: false,
    };

    await analyzeCommand(options);

    expect(fs.existsSync(path.join(testOutputDir, 'friction-points.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'value-moments.json'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'go-no-go.json'))).toBe(true);
  });

  it('should use default output directory when not specified', async () => {
    const defaultOutput = path.resolve('./suts-analysis');

    const options = {
      events: testEventsFile,
      verbose: false,
    };

    await analyzeCommand(options);

    expect(fs.existsSync(path.join(defaultOutput, 'friction-points.json'))).toBe(true);

    // Clean up
    fs.rmSync(defaultOutput, { recursive: true });
  });

  it('should handle verbose mode', async () => {
    const options = {
      events: testEventsFile,
      output: testOutputDir,
      verbose: true,
    };

    await analyzeCommand(options);

    expect(fs.existsSync(testOutputDir)).toBe(true);
  });

  it('should handle json output mode', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const options = {
      events: testEventsFile,
      output: testOutputDir,
      json: true,
    };

    await analyzeCommand(options);

    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should handle non-existent events file', async () => {
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit: ${code}`);
    });

    const options = {
      events: './non-existent.json',
      output: testOutputDir,
      verbose: false,
    };

    await expect(analyzeCommand(options)).rejects.toThrow();

    processExitSpy.mockRestore();
  });
});
