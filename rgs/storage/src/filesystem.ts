import * as fs from 'fs/promises';
import * as path from 'path';
import {
  IStorage,
  WebSignal,
  WebSignalSchema,
  Insight,
  InsightSchema,
  SignalFilter,
  StorageError,
} from './interfaces/storage';

/**
 * File-based storage implementation for RGS data
 * Stores signals and insights in JSON files organized by date and source
 */
export class FileSystemStorage implements IStorage {
  private readonly signalsPath: string;
  private readonly insightsPath: string;

  /**
   * Creates a new FileSystemStorage instance
   * @param basePath - Base directory path for storage (default: data/rgs)
   */
  constructor(basePath: string = 'data/rgs') {
    this.signalsPath = path.join(basePath, 'signals');
    this.insightsPath = path.join(basePath, 'insights');
  }

  /**
   * Initialize storage directories
   * @throws {StorageError} If directory creation fails
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.signalsPath, { recursive: true });
      await fs.mkdir(this.insightsPath, { recursive: true });
    } catch (error) {
      throw new StorageError('Failed to initialize storage directories', error);
    }
  }

  /**
   * Save web signals to storage
   * Organizes signals by source and date: signals/{source}-YYYY-MM-DD.json
   */
  async saveSignals(signals: WebSignal[]): Promise<void> {
    if (signals.length === 0) {
      return;
    }

    try {
      // Validate signals
      signals.forEach((signal) => WebSignalSchema.parse(signal));

      // Group signals by source and date
      const grouped = this.groupSignalsBySourceAndDate(signals);

      // Save each group to its respective file
      await Promise.all(
        Array.from(grouped.entries()).map(async ([key, signalsGroup]) => {
          const filePath = path.join(this.signalsPath, `${key}.json`);
          await this.appendOrCreateFile(filePath, signalsGroup);
        })
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new StorageError('Invalid signal data', error);
      }
      throw new StorageError('Failed to save signals', error);
    }
  }

  /**
   * Load web signals from storage with optional filtering
   */
  async loadSignals(filter?: SignalFilter): Promise<WebSignal[]> {
    try {
      await this.ensureDirectoryExists(this.signalsPath);

      const files = await fs.readdir(this.signalsPath);
      const allSignals: WebSignal[] = [];

      // Read all signal files
      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(this.signalsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');

        if (content.trim() === '') {
          continue;
        }

        const signals = JSON.parse(content) as WebSignal[];
        allSignals.push(...signals);
      }

      // Apply filters
      return this.applySignalFilter(allSignals, filter);
    } catch (error) {
      throw new StorageError('Failed to load signals', error);
    }
  }

  /**
   * Save insights to storage
   * Organizes insights by date: insights/YYYY-MM-DD.json
   */
  async saveInsights(insights: Insight[]): Promise<void> {
    if (insights.length === 0) {
      return;
    }

    try {
      // Validate insights
      insights.forEach((insight) => InsightSchema.parse(insight));

      // Group insights by date
      const grouped = this.groupInsightsByDate(insights);

      // Save each group to its respective file
      await Promise.all(
        Array.from(grouped.entries()).map(async ([dateKey, insightsGroup]) => {
          const filePath = path.join(this.insightsPath, `${dateKey}.json`);
          await this.appendOrCreateFile(filePath, insightsGroup);
        })
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new StorageError('Invalid insight data', error);
      }
      throw new StorageError('Failed to save insights', error);
    }
  }

  /**
   * Load insights from storage with optional query filtering
   */
  async loadInsights(query?: string): Promise<Insight[]> {
    try {
      await this.ensureDirectoryExists(this.insightsPath);

      const files = await fs.readdir(this.insightsPath);
      const allInsights: Insight[] = [];

      // Read all insight files
      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }

        const filePath = path.join(this.insightsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');

        if (content.trim() === '') {
          continue;
        }

        const insights = JSON.parse(content) as Insight[];
        allInsights.push(...insights);
      }

      // Apply query filter
      return this.applyInsightQuery(allInsights, query);
    } catch (error) {
      throw new StorageError('Failed to load insights', error);
    }
  }

  /**
   * Group signals by source and date
   */
  private groupSignalsBySourceAndDate(signals: WebSignal[]): Map<string, WebSignal[]> {
    const grouped = new Map<string, WebSignal[]>();

    for (const signal of signals) {
      const date = new Date(signal.timestamp);
      const dateKey = this.formatDate(date);
      const key = `${signal.source}-${dateKey}`;

      const existing = grouped.get(key) ?? [];
      existing.push(signal);
      grouped.set(key, existing);
    }

    return grouped;
  }

  /**
   * Group insights by date
   */
  private groupInsightsByDate(insights: Insight[]): Map<string, Insight[]> {
    const grouped = new Map<string, Insight[]>();

    for (const insight of insights) {
      const date = new Date(insight.timestamp);
      const dateKey = this.formatDate(date);

      const existing = grouped.get(dateKey) ?? [];
      existing.push(insight);
      grouped.set(dateKey, existing);
    }

    return grouped;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Append data to file or create new file
   */
  private async appendOrCreateFile<T>(filePath: string, newData: T[]): Promise<void> {
    let existingData: T[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.trim() !== '') {
        existingData = JSON.parse(content) as T[];
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, will create new
    }

    const allData = [...existingData, ...newData];
    await fs.writeFile(filePath, JSON.stringify(allData, null, 2), 'utf-8');
  }

  /**
   * Apply signal filter
   */
  private applySignalFilter(signals: WebSignal[], filter?: SignalFilter): WebSignal[] {
    if (filter === undefined) {
      return signals;
    }

    return signals.filter((signal) => {
      if (filter.source !== undefined && signal.source !== filter.source) {
        return false;
      }

      if (filter.type !== undefined && signal.type !== filter.type) {
        return false;
      }

      if (filter.sentiment !== undefined && signal.sentiment !== filter.sentiment) {
        return false;
      }

      const signalDate = new Date(signal.timestamp);

      if (filter.startDate !== undefined && signalDate < filter.startDate) {
        return false;
      }

      if (filter.endDate !== undefined && signalDate > filter.endDate) {
        return false;
      }

      if (
        filter.tags !== undefined &&
        filter.tags.length > 0 &&
        signal.tags !== undefined &&
        !filter.tags.some((tag) => signal.tags?.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply insight query filter (simple text search)
   */
  private applyInsightQuery(insights: Insight[], query?: string): Insight[] {
    if (query === undefined || query.trim().length === 0) {
      return insights;
    }

    const lowerQuery = query.toLowerCase();

    return insights.filter(
      (insight) =>
        insight.title.toLowerCase().includes(lowerQuery) ||
        insight.summary.toLowerCase().includes(lowerQuery) ||
        insight.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}
