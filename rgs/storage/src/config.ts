import * as fs from 'fs/promises';
import { z } from 'zod';

/**
 * Source configuration for web scraping
 */
export const SourceConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['reddit', 'twitter', 'github', 'stackoverflow', 'hackernews']),
  enabled: z.boolean(),
  config: z.record(z.unknown()),
});

export type SourceConfig = z.infer<typeof SourceConfigSchema>;

/**
 * RGS configuration schema
 */
export const RGSConfigSchema = z.object({
  storage: z.object({
    type: z.enum(['filesystem', 'memory']),
    path: z.string().optional(),
  }),
  scraping: z.object({
    rateLimit: z.number().min(1).max(1000), // requests per minute
    timeout: z.number().min(1000).max(60000), // ms
    retries: z.number().min(0).max(10),
  }),
  sources: z.array(SourceConfigSchema),
});

export type RGSConfig = z.infer<typeof RGSConfigSchema>;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: RGSConfig = {
  storage: {
    type: 'filesystem',
    path: 'data/rgs',
  },
  scraping: {
    rateLimit: 60, // 60 requests per minute
    timeout: 10000, // 10 seconds
    retries: 3,
  },
  sources: [],
};

/**
 * Configuration loader for RGS
 * Loads configuration from .env and rgs.config.json
 */
export class ConfigLoader {
  private config: RGSConfig;
  private readonly configPath: string;

  /**
   * Creates a new ConfigLoader instance
   * @param configPath - Path to rgs.config.json (default: ./rgs.config.json)
   */
  constructor(configPath: string = './rgs.config.json') {
    this.configPath = configPath;
    // Deep copy to avoid mutating DEFAULT_CONFIG
    this.config = {
      storage: { ...DEFAULT_CONFIG.storage },
      scraping: { ...DEFAULT_CONFIG.scraping },
      sources: [...DEFAULT_CONFIG.sources],
    };
  }

  /**
   * Load configuration from file and environment
   * @throws {Error} If configuration is invalid
   */
  async load(): Promise<RGSConfig> {
    // Load from config file if it exists
    try {
      const fileConfig = await this.loadFromFile();
      this.config = this.mergeConfigs(this.config, fileConfig);
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        // Config file doesn't exist, use defaults
      } else {
        throw error;
      }
    }

    // Override with environment variables
    this.loadFromEnv();

    // Validate final configuration
    return RGSConfigSchema.parse(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): RGSConfig {
    return { ...this.config };
  }

  /**
   * Save configuration to file
   */
  async save(config?: RGSConfig): Promise<void> {
    const configToSave = config ?? this.config;

    // Validate before saving
    RGSConfigSchema.parse(configToSave);

    const content = JSON.stringify(configToSave, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');
  }

  /**
   * Load configuration from JSON file
   */
  private async loadFromFile(): Promise<Partial<RGSConfig>> {
    const content = await fs.readFile(this.configPath, 'utf-8');
    return JSON.parse(content) as Partial<RGSConfig>;
  }

  /**
   * Load configuration overrides from environment variables
   */
  private loadFromEnv(): void {
    // Storage type
    const storageType = process.env['RGS_STORAGE_TYPE'];
    if (storageType !== undefined && storageType.length > 0) {
      if (storageType === 'filesystem' || storageType === 'memory') {
        this.config.storage.type = storageType;
      }
    }

    // Storage path
    const storagePath = process.env['RGS_STORAGE_PATH'];
    if (storagePath !== undefined && storagePath.length > 0) {
      this.config.storage.path = storagePath;
    }

    // Rate limit
    const rateLimitStr = process.env['RGS_RATE_LIMIT'];
    if (rateLimitStr !== undefined && rateLimitStr.length > 0) {
      const rateLimit = parseInt(rateLimitStr, 10);
      if (!isNaN(rateLimit) && rateLimit > 0) {
        this.config.scraping.rateLimit = rateLimit;
      }
    }

    // Timeout
    const timeoutStr = process.env['RGS_TIMEOUT'];
    if (timeoutStr !== undefined && timeoutStr.length > 0) {
      const timeout = parseInt(timeoutStr, 10);
      if (!isNaN(timeout) && timeout > 0) {
        this.config.scraping.timeout = timeout;
      }
    }

    // Retries
    const retriesStr = process.env['RGS_RETRIES'];
    if (retriesStr !== undefined && retriesStr.length > 0) {
      const retries = parseInt(retriesStr, 10);
      if (!isNaN(retries) && retries >= 0) {
        this.config.scraping.retries = retries;
      }
    }
  }

  /**
   * Merge two configuration objects
   */
  private mergeConfigs(base: RGSConfig, override: Partial<RGSConfig>): RGSConfig {
    return {
      storage: {
        ...base.storage,
        ...override.storage,
      },
      scraping: {
        ...base.scraping,
        ...override.scraping,
      },
      sources: override.sources ?? base.sources,
    };
  }
}

/**
 * Create and load configuration
 * @param configPath - Path to rgs.config.json
 * @returns Loaded configuration
 */
export async function loadConfig(configPath?: string): Promise<RGSConfig> {
  const loader = new ConfigLoader(configPath);
  return loader.load();
}

/**
 * Validate configuration
 * @param config - Configuration to validate
 * @returns True if valid, throws error otherwise
 */
export function validateConfig(config: unknown): config is RGSConfig {
  RGSConfigSchema.parse(config);
  return true;
}
