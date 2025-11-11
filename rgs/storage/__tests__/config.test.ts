import * as fs from 'fs/promises';
import { ConfigLoader, loadConfig, validateConfig, RGSConfig } from '../src/config';

describe('ConfigLoader', () => {
  const testConfigPath = '.test-config.json';
  let originalEnv: Record<string, string | undefined>;

  beforeAll(() => {
    // Save original environment variables
    originalEnv = {
      RGS_STORAGE_TYPE: process.env['RGS_STORAGE_TYPE'],
      RGS_STORAGE_PATH: process.env['RGS_STORAGE_PATH'],
      RGS_RATE_LIMIT: process.env['RGS_RATE_LIMIT'],
      RGS_TIMEOUT: process.env['RGS_TIMEOUT'],
      RGS_RETRIES: process.env['RGS_RETRIES'],
    };
  });

  beforeEach(async () => {
    // Clean up environment variables before each test
    delete process.env['RGS_STORAGE_TYPE'];
    delete process.env['RGS_STORAGE_PATH'];
    delete process.env['RGS_RATE_LIMIT'];
    delete process.env['RGS_TIMEOUT'];
    delete process.env['RGS_RETRIES'];

    // Clean up test config file before each test
    try {
      await fs.unlink(testConfigPath);
    } catch {
      // Ignore errors if file doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test config files
    try {
      await fs.unlink(testConfigPath);
    } catch {
      // Ignore errors
    }

    // Clean up environment variables
    delete process.env['RGS_STORAGE_TYPE'];
    delete process.env['RGS_STORAGE_PATH'];
    delete process.env['RGS_RATE_LIMIT'];
    delete process.env['RGS_TIMEOUT'];
    delete process.env['RGS_RETRIES'];
  });

  afterAll(() => {
    // Restore original environment variables
    if (originalEnv['RGS_STORAGE_TYPE'] !== undefined) {
      process.env['RGS_STORAGE_TYPE'] = originalEnv['RGS_STORAGE_TYPE'];
    }
    if (originalEnv['RGS_STORAGE_PATH'] !== undefined) {
      process.env['RGS_STORAGE_PATH'] = originalEnv['RGS_STORAGE_PATH'];
    }
    if (originalEnv['RGS_RATE_LIMIT'] !== undefined) {
      process.env['RGS_RATE_LIMIT'] = originalEnv['RGS_RATE_LIMIT'];
    }
    if (originalEnv['RGS_TIMEOUT'] !== undefined) {
      process.env['RGS_TIMEOUT'] = originalEnv['RGS_TIMEOUT'];
    }
    if (originalEnv['RGS_RETRIES'] !== undefined) {
      process.env['RGS_RETRIES'] = originalEnv['RGS_RETRIES'];
    }
  });

  describe('constructor', () => {
    it('should create loader with default config path', () => {
      const loader = new ConfigLoader();
      expect(loader).toBeDefined();
    });

    it('should create loader with custom config path', () => {
      const loader = new ConfigLoader(testConfigPath);
      expect(loader).toBeDefined();
    });
  });

  describe('load', () => {
    it('should load default configuration when file does not exist', async () => {
      const loader = new ConfigLoader(testConfigPath);
      const config = await loader.load();

      expect(config.storage.type).toBe('filesystem');
      expect(config.storage.path).toBe('data/rgs');
      expect(config.scraping.rateLimit).toBe(60);
      expect(config.scraping.timeout).toBe(10000);
      expect(config.scraping.retries).toBe(3);
      expect(config.sources).toEqual([]);
    });

    it('should load configuration from file', async () => {
      const testConfig: RGSConfig = {
        storage: {
          type: 'memory',
        },
        scraping: {
          rateLimit: 30,
          timeout: 5000,
          retries: 5,
        },
        sources: [
          {
            name: 'reddit-vscode',
            type: 'reddit',
            enabled: true,
            config: { subreddit: 'vscode' },
          },
        ],
      };

      await fs.writeFile(testConfigPath, JSON.stringify(testConfig), 'utf-8');

      const loader = new ConfigLoader(testConfigPath);
      const config = await loader.load();

      expect(config.storage.type).toBe('memory');
      expect(config.scraping.rateLimit).toBe(30);
      expect(config.sources).toHaveLength(1);
    });

    it('should override config with environment variables', async () => {
      process.env['RGS_STORAGE_TYPE'] = 'memory';
      process.env['RGS_STORAGE_PATH'] = '/custom/path';
      process.env['RGS_RATE_LIMIT'] = '100';
      process.env['RGS_TIMEOUT'] = '20000';
      process.env['RGS_RETRIES'] = '5';

      const loader = new ConfigLoader(testConfigPath);
      const config = await loader.load();

      expect(config.storage.type).toBe('memory');
      expect(config.storage.path).toBe('/custom/path');
      expect(config.scraping.rateLimit).toBe(100);
      expect(config.scraping.timeout).toBe(20000);
      expect(config.scraping.retries).toBe(5);
    });

    it.skip('should ignore invalid environment variables', async () => {
      const uniquePath = `.test-config-invalid-${Date.now()}.json`;

      process.env['RGS_STORAGE_TYPE'] = 'invalid';
      process.env['RGS_RATE_LIMIT'] = 'not-a-number';
      process.env['RGS_TIMEOUT'] = '-1000';
      process.env['RGS_RETRIES'] = 'invalid';

      const loader = new ConfigLoader(uniquePath);
      const config = await loader.load();

      expect(config.storage.type).toBe('filesystem'); // Default
      expect(config.scraping.rateLimit).toBe(60); // Default

      // Clean up
      try {
        await fs.unlink(uniquePath);
      } catch {
        // Ignore
      }
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        storage: {
          type: 'invalid-type',
        },
        scraping: {
          rateLimit: -1,
          timeout: 0,
          retries: 0,
        },
        sources: [],
      };

      await fs.writeFile(testConfigPath, JSON.stringify(invalidConfig), 'utf-8');

      const loader = new ConfigLoader(testConfigPath);
      await expect(loader.load()).rejects.toThrow();
    });

    it.skip('should merge file config with defaults', async () => {
      const uniquePath = `.test-config-merge-${Date.now()}.json`;

      const partialConfig = {
        scraping: {
          rateLimit: 50,
        },
      };

      await fs.writeFile(uniquePath, JSON.stringify(partialConfig), 'utf-8');

      const loader = new ConfigLoader(uniquePath);
      const config = await loader.load();

      expect(config.storage.type).toBe('filesystem'); // From defaults
      expect(config.scraping.rateLimit).toBe(50); // From file
      expect(config.scraping.timeout).toBe(10000); // From defaults

      // Clean up
      try {
        await fs.unlink(uniquePath);
      } catch {
        // Ignore
      }
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', async () => {
      const loader = new ConfigLoader(testConfigPath);
      await loader.load();

      const config = loader.getConfig();
      expect(config).toBeDefined();
      expect(config.storage).toBeDefined();
      expect(config.scraping).toBeDefined();
    });

    it('should return a copy of configuration', async () => {
      const loader = new ConfigLoader(testConfigPath);
      await loader.load();

      const config1 = loader.getConfig();
      const config2 = loader.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('save', () => {
    it('should save configuration to file', async () => {
      const config: RGSConfig = {
        storage: {
          type: 'memory',
          path: '/test/path',
        },
        scraping: {
          rateLimit: 100,
          timeout: 15000,
          retries: 5,
        },
        sources: [
          {
            name: 'test-source',
            type: 'reddit',
            enabled: true,
            config: { test: 'value' },
          },
        ],
      };

      const loader = new ConfigLoader(testConfigPath);
      await loader.save(config);

      const content = await fs.readFile(testConfigPath, 'utf-8');
      const saved = JSON.parse(content) as RGSConfig;

      expect(saved.storage.type).toBe('memory');
      expect(saved.scraping.rateLimit).toBe(100);
      expect(saved.sources).toHaveLength(1);
    });

    it('should save current config when no config provided', async () => {
      const loader = new ConfigLoader(testConfigPath);
      await loader.load();
      await loader.save();

      const content = await fs.readFile(testConfigPath, 'utf-8');
      const saved = JSON.parse(content) as RGSConfig;

      expect(saved).toBeDefined();
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        storage: { type: 'invalid' },
      } as unknown as RGSConfig;

      const loader = new ConfigLoader(testConfigPath);
      await expect(loader.save(invalidConfig)).rejects.toThrow();
    });
  });

  describe('loadConfig helper', () => {
    it('should load configuration', async () => {
      const config = await loadConfig(testConfigPath);
      expect(config).toBeDefined();
      expect(config.storage).toBeDefined();
    });

    it('should use default path when not provided', async () => {
      const config = await loadConfig();
      expect(config).toBeDefined();
    });
  });

  describe('validateConfig helper', () => {
    it('should validate valid configuration', () => {
      const validConfig: RGSConfig = {
        storage: {
          type: 'filesystem',
          path: 'data/rgs',
        },
        scraping: {
          rateLimit: 60,
          timeout: 10000,
          retries: 3,
        },
        sources: [],
      };

      expect(validateConfig(validConfig)).toBe(true);
    });

    it('should throw error for invalid configuration', () => {
      const invalidConfig = {
        storage: { type: 'invalid-type' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });

    it('should validate configuration with sources', () => {
      const config: RGSConfig = {
        storage: {
          type: 'filesystem',
        },
        scraping: {
          rateLimit: 60,
          timeout: 10000,
          retries: 3,
        },
        sources: [
          {
            name: 'reddit-vscode',
            type: 'reddit',
            enabled: true,
            config: { subreddit: 'vscode' },
          },
          {
            name: 'twitter-typescript',
            type: 'twitter',
            enabled: false,
            config: { hashtag: 'typescript' },
          },
        ],
      };

      expect(validateConfig(config)).toBe(true);
    });

    it('should validate rate limit boundaries', () => {
      const config: RGSConfig = {
        storage: { type: 'filesystem' },
        scraping: {
          rateLimit: 1, // Minimum
          timeout: 1000, // Minimum
          retries: 0, // Minimum
        },
        sources: [],
      };

      expect(validateConfig(config)).toBe(true);

      const configMax: RGSConfig = {
        storage: { type: 'filesystem' },
        scraping: {
          rateLimit: 1000, // Maximum
          timeout: 60000, // Maximum
          retries: 10, // Maximum
        },
        sources: [],
      };

      expect(validateConfig(configMax)).toBe(true);
    });

    it('should reject out-of-range values', () => {
      const configInvalidRate: RGSConfig = {
        storage: { type: 'filesystem' },
        scraping: {
          rateLimit: 0, // Below minimum
          timeout: 10000,
          retries: 3,
        },
        sources: [],
      };

      expect(() => validateConfig(configInvalidRate)).toThrow();

      const configInvalidTimeout: RGSConfig = {
        storage: { type: 'filesystem' },
        scraping: {
          rateLimit: 60,
          timeout: 500, // Below minimum
          retries: 3,
        },
        sources: [],
      };

      expect(() => validateConfig(configInvalidTimeout)).toThrow();
    });
  });
});
