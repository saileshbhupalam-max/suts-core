/**
 * Tests for CLI entry point
 */

import { createProgram } from '../src/index';

describe('CLI entry point', () => {
  describe('createProgram', () => {
    it('should create a commander program', () => {
      const program = createProgram();

      expect(program).toBeDefined();
      expect(program.name()).toBe('rgs');
      expect(program.version()).toBe('0.1.0');
    });

    it('should have scrape command', () => {
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain('scrape');
    });

    it('should have analyze command', () => {
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain('analyze');
    });

    it('should have run command', () => {
      const program = createProgram();
      const commands = program.commands.map((c) => c.name());

      expect(commands).toContain('run');
    });

    it('should have correct scrape options', () => {
      const program = createProgram();
      const scrapeCommand = program.commands.find((c) => c.name() === 'scrape');

      expect(scrapeCommand).toBeDefined();
      if (scrapeCommand !== undefined) {
        const options = scrapeCommand.options.map((o) => o.long);

        expect(options).toContain('--sources');
        expect(options).toContain('--subreddits');
        expect(options).toContain('--limit');
        expect(options).toContain('--output');
      }
    });

    it('should have correct analyze options', () => {
      const program = createProgram();
      const analyzeCommand = program.commands.find((c) => c.name() === 'analyze');

      expect(analyzeCommand).toBeDefined();
      if (analyzeCommand !== undefined) {
        const options = analyzeCommand.options.map((o) => o.long);

        expect(options).toContain('--input');
        expect(options).toContain('--output');
        expect(options).toContain('--skip-sentiment');
        expect(options).toContain('--skip-themes');
      }
    });

    it('should have correct run options', () => {
      const program = createProgram();
      const runCommand = program.commands.find((c) => c.name() === 'run');

      expect(runCommand).toBeDefined();
      if (runCommand !== undefined) {
        const options = runCommand.options.map((o) => o.long);

        expect(options).toContain('--config');
        expect(options).toContain('--output');
      }
    });
  });
});
