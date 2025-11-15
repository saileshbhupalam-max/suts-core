/**
 * Tests for GitHub configuration
 */

/* eslint-disable @typescript-eslint/unbound-method */

import {
  validateGitHubConfig,
  createGitHubConfig,
  loadGitHubConfigFromEnv,
  defaultGitHubConfig,
  GitHubConfigSchema,
} from '../src/config';

describe('GitHubConfig', () => {
  describe('validateGitHubConfig', () => {
    it('should validate a valid configuration', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode', 'cursor/cursor'],
        queries: ['performance', 'bug'],
        includeComments: true,
        state: 'all' as const,
        maxIssuesPerQuery: 50,
        sort: 'created' as const,
        rateLimit: {
          requestsPerHour: 5000,
        },
      };

      const validated = validateGitHubConfig(config);
      expect(validated).toEqual(config);
    });

    it('should apply defaults for optional fields', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
      };

      const validated = validateGitHubConfig(config);
      expect(validated.includeComments).toBe(true);
      expect(validated.state).toBe('all');
      expect(validated.maxIssuesPerQuery).toBe(100);
      expect(validated.sort).toBe('created');
      expect(validated.rateLimit.requestsPerHour).toBe(5000);
    });

    it('should accept different token formats', () => {
      const tokenFormats = [
        'ghp_1234567890abcdef',
        'github_pat_1234567890abcdef',
        'gho_1234567890abcdef',
        'ghs_1234567890abcdef',
      ];

      for (const token of tokenFormats) {
        const config = {
          token,
          repos: ['microsoft/vscode'],
          queries: ['performance'],
        };

        expect(() => validateGitHubConfig(config)).not.toThrow();
      }
    });

    it('should reject invalid token format', () => {
      const config = {
        token: 'invalid_token',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should reject empty token', () => {
      const config = {
        token: '',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should validate repository format', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode', 'cursor/cursor'],
        queries: ['performance'],
      };

      expect(() => validateGitHubConfig(config)).not.toThrow();
    });

    it('should reject invalid repository format', () => {
      const invalidRepos = [
        'invalidrepo',
        'owner/',
        '/repo',
        'owner//repo',
        '',
      ];

      for (const repo of invalidRepos) {
        const config = {
          token: 'ghp_1234567890abcdef',
          repos: [repo],
          queries: ['performance'],
        };

        expect(() => validateGitHubConfig(config)).toThrow();
      }
    });

    it('should require at least one repository', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: [],
        queries: ['performance'],
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should require at least one query', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: [],
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should reject empty query strings', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: [''],
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should validate issue state values', () => {
      const validStates = ['open', 'closed', 'all'] as const;

      for (const state of validStates) {
        const config = {
          token: 'ghp_1234567890abcdef',
          repos: ['microsoft/vscode'],
          queries: ['performance'],
          state,
        };

        expect(() => validateGitHubConfig(config)).not.toThrow();
      }
    });

    it('should reject invalid issue state', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        state: 'invalid',
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should validate maxIssuesPerQuery range', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        maxIssuesPerQuery: 50,
      };

      expect(() => validateGitHubConfig(config)).not.toThrow();
    });

    it('should reject maxIssuesPerQuery below 1', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        maxIssuesPerQuery: 0,
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should reject maxIssuesPerQuery above 100', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        maxIssuesPerQuery: 101,
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should validate sort options', () => {
      const validSorts = ['created', 'updated', 'comments'] as const;

      for (const sort of validSorts) {
        const config = {
          token: 'ghp_1234567890abcdef',
          repos: ['microsoft/vscode'],
          queries: ['performance'],
          sort,
        };

        expect(() => validateGitHubConfig(config)).not.toThrow();
      }
    });

    it('should reject invalid sort option', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        sort: 'invalid',
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });

    it('should validate rate limit values', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        rateLimit: {
          requestsPerHour: 3000,
        },
      };

      expect(() => validateGitHubConfig(config)).not.toThrow();
    });

    it('should reject rate limit above 5000', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        rateLimit: {
          requestsPerHour: 6000,
        },
      };

      expect(() => validateGitHubConfig(config)).toThrow();
    });
  });

  describe('createGitHubConfig', () => {
    it('should create config with defaults', () => {
      const config = createGitHubConfig({
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
      });

      expect(config.token).toBe('ghp_1234567890abcdef');
      expect(config.repos).toEqual(['microsoft/vscode']);
      expect(config.queries).toEqual(['performance']);
      expect(config.includeComments).toBe(true);
      expect(config.state).toBe('all');
      expect(config.maxIssuesPerQuery).toBe(100);
      expect(config.sort).toBe('created');
      expect(config.rateLimit.requestsPerHour).toBe(5000);
    });

    it('should override defaults with provided values', () => {
      const config = createGitHubConfig({
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
        includeComments: false,
        state: 'open',
        maxIssuesPerQuery: 50,
      });

      expect(config.includeComments).toBe(false);
      expect(config.state).toBe('open');
      expect(config.maxIssuesPerQuery).toBe(50);
    });
  });

  describe('loadGitHubConfigFromEnv', () => {
    const originalEnv = process.env['GITHUB_TOKEN'];

    afterEach(() => {
      // Restore original env
      if (originalEnv !== undefined) {
        process.env['GITHUB_TOKEN'] = originalEnv;
      } else {
        delete process.env['GITHUB_TOKEN'];
      }
    });

    it('should load token from GITHUB_TOKEN env var', () => {
      process.env['GITHUB_TOKEN'] = 'ghp_test_token';

      const config = loadGitHubConfigFromEnv();
      expect(config.token).toBe('ghp_test_token');
    });

    it('should throw if GITHUB_TOKEN is not set', () => {
      delete process.env['GITHUB_TOKEN'];

      expect(() => loadGitHubConfigFromEnv()).toThrow('GITHUB_TOKEN environment variable is required');
    });

    it('should throw if GITHUB_TOKEN is empty', () => {
      process.env['GITHUB_TOKEN'] = '   ';

      expect(() => loadGitHubConfigFromEnv()).toThrow('GITHUB_TOKEN environment variable is required');
    });
  });

  describe('defaultGitHubConfig', () => {
    it('should have correct default values', () => {
      expect(defaultGitHubConfig.includeComments).toBe(true);
      expect(defaultGitHubConfig.state).toBe('all');
      expect(defaultGitHubConfig.maxIssuesPerQuery).toBe(100);
      expect(defaultGitHubConfig.sort).toBe('created');
      expect(defaultGitHubConfig.rateLimit).toEqual({
        requestsPerHour: 5000,
      });
    });
  });

  describe('GitHubConfigSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(GitHubConfigSchema.parse).toBeDefined();
      expect(GitHubConfigSchema.safeParse).toBeDefined();
    });

    it('should parse valid config', () => {
      const config = {
        token: 'ghp_1234567890abcdef',
        repos: ['microsoft/vscode'],
        queries: ['performance'],
      };

      const result = GitHubConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid config', () => {
      const config = {
        token: 'invalid',
        repos: [],
        queries: [],
      };

      const result = GitHubConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});
