/**
 * Tests for generate-personas command
 */

import * as fs from 'fs';
import * as path from 'path';
import { generatePersonasCommand } from '../../src/commands/generate-personas';

describe('generate-personas command', () => {
  const testOutputFile = path.join(__dirname, '../test-output/test-personas.json');

  beforeEach(() => {
    // Clean up test files
    const dir = path.dirname(testOutputFile);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    const dir = path.dirname(testOutputFile);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  });

  it('should generate personas and save to file', async () => {
    const options = {
      count: 10,
      output: testOutputFile,
      verbose: false,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(testOutputFile)).toBe(true);

    const content = fs.readFileSync(testOutputFile, 'utf-8');
    const personas = JSON.parse(content);

    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBe(10);
    expect(personas[0]).toHaveProperty('id');
    expect(personas[0]).toHaveProperty('name');
    expect(personas[0]).toHaveProperty('background');
    expect(personas[0]).toHaveProperty('goals');
  });

  it('should generate personas with default diversity', async () => {
    const options = {
      count: 5,
      output: testOutputFile,
      verbose: false,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(testOutputFile)).toBe(true);
  });

  it('should generate personas with custom diversity', async () => {
    const options = {
      count: 5,
      output: testOutputFile,
      diversity: 0.5,
      verbose: false,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(testOutputFile)).toBe(true);
  });

  it('should save to default location when output not specified', async () => {
    const defaultOutput = path.resolve('./personas.json');

    const options = {
      count: 5,
      verbose: false,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(defaultOutput)).toBe(true);

    // Clean up
    fs.unlinkSync(defaultOutput);
  });

  it('should handle verbose mode', async () => {
    const options = {
      count: 3,
      output: testOutputFile,
      verbose: true,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(testOutputFile)).toBe(true);
  });

  it('should handle json output mode', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const options = {
      count: 3,
      output: testOutputFile,
      json: true,
    };

    await generatePersonasCommand(options);

    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should generate varied persona backgrounds', async () => {
    const options = {
      count: 20,
      output: testOutputFile,
      diversity: 0.9,
      verbose: false,
    };

    await generatePersonasCommand(options);

    const content = fs.readFileSync(testOutputFile, 'utf-8');
    const personas = JSON.parse(content);

    // Check that personas have different backgrounds
    const backgrounds = new Set(personas.map((p: { background: string }) => p.background));
    expect(backgrounds.size).toBeGreaterThan(1);
  });

  it('should generate personas with varied goals', async () => {
    const options = {
      count: 15,
      output: testOutputFile,
      verbose: false,
    };

    await generatePersonasCommand(options);

    const content = fs.readFileSync(testOutputFile, 'utf-8');
    const personas = JSON.parse(content);

    // Check that personas have goals
    personas.forEach((persona: { goals: string[] }) => {
      expect(Array.isArray(persona.goals)).toBe(true);
      expect(persona.goals.length).toBeGreaterThan(0);
    });
  });

  it('should handle diversity parameter', async () => {
    const options = {
      count: 10,
      output: testOutputFile,
      diversity: 0.1,
      verbose: false,
    };

    await generatePersonasCommand(options);

    expect(fs.existsSync(testOutputFile)).toBe(true);
  });

  it('should generate unique persona IDs', async () => {
    const options = {
      count: 25,
      output: testOutputFile,
      verbose: false,
    };

    await generatePersonasCommand(options);

    const content = fs.readFileSync(testOutputFile, 'utf-8');
    const personas = JSON.parse(content);

    const ids = personas.map((p: { id: string }) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(personas.length);
  });
});
