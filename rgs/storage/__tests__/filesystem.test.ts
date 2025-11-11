import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemStorage } from '../src/filesystem';
import { WebSignal, Insight, StorageError } from '../src/interfaces/storage';

describe('FileSystemStorage', () => {
  const testBasePath = '.test-data/rgs';
  let storage: FileSystemStorage;

  beforeEach(async () => {
    storage = new FileSystemStorage(testBasePath);
    await storage.initialize();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(testBasePath, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('initialize', () => {
    it('should create storage directories', async () => {
      const signalsPath = path.join(testBasePath, 'signals');
      const insightsPath = path.join(testBasePath, 'insights');

      const signalsStat = await fs.stat(signalsPath);
      const insightsStat = await fs.stat(insightsPath);

      expect(signalsStat.isDirectory()).toBe(true);
      expect(insightsStat.isDirectory()).toBe(true);
    });

    it('should not fail if directories already exist', async () => {
      await expect(storage.initialize()).resolves.not.toThrow();
    });
  });

  describe('saveSignals', () => {
    const mockSignals: WebSignal[] = [
      {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test post content',
        author: 'testuser',
        url: 'https://reddit.com/r/test/1',
        timestamp: '2025-01-15T10:00:00.000Z',
        sentiment: 'positive',
        tags: ['test', 'feature'],
      },
      {
        id: 'signal-2',
        source: 'reddit',
        type: 'comment',
        content: 'Test comment content',
        author: 'testuser2',
        url: 'https://reddit.com/r/test/2',
        timestamp: '2025-01-15T11:00:00.000Z',
        sentiment: 'neutral',
      },
    ];

    it('should save signals to file', async () => {
      await storage.saveSignals(mockSignals);

      const filePath = path.join(testBasePath, 'signals', 'reddit-2025-01-15.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const savedSignals = JSON.parse(content) as WebSignal[];

      expect(savedSignals).toHaveLength(2);
      expect(savedSignals[0]?.id).toBe('signal-1');
      expect(savedSignals[1]?.id).toBe('signal-2');
    });

    it('should append to existing file', async () => {
      await storage.saveSignals([mockSignals[0] as WebSignal]);
      await storage.saveSignals([mockSignals[1] as WebSignal]);

      const filePath = path.join(testBasePath, 'signals', 'reddit-2025-01-15.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const savedSignals = JSON.parse(content) as WebSignal[];

      expect(savedSignals).toHaveLength(2);
    });

    it('should group signals by source and date', async () => {
      const twitterSignal: WebSignal = {
        id: 'signal-3',
        source: 'twitter',
        type: 'tweet',
        content: 'Test tweet',
        author: 'testuser3',
        url: 'https://twitter.com/test/1',
        timestamp: '2025-01-16T10:00:00.000Z',
      };

      await storage.saveSignals([...mockSignals, twitterSignal]);

      const redditFile = path.join(testBasePath, 'signals', 'reddit-2025-01-15.json');
      const twitterFile = path.join(testBasePath, 'signals', 'twitter-2025-01-16.json');

      expect(
        await fs
          .access(redditFile)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);
      expect(
        await fs
          .access(twitterFile)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);
    });

    it('should handle empty array', async () => {
      await expect(storage.saveSignals([])).resolves.not.toThrow();
    });

    it('should throw StorageError for invalid data', async () => {
      const invalidSignal = {
        id: 'signal-invalid',
        source: 'invalid-source',
      } as unknown as WebSignal;

      await expect(storage.saveSignals([invalidSignal])).rejects.toThrow(StorageError);
    });
  });

  describe('loadSignals', () => {
    const mockSignals: WebSignal[] = [
      {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test post',
        author: 'user1',
        url: 'https://reddit.com/1',
        timestamp: '2025-01-15T10:00:00.000Z',
        sentiment: 'positive',
        tags: ['feature'],
      },
      {
        id: 'signal-2',
        source: 'twitter',
        type: 'tweet',
        content: 'Test tweet',
        author: 'user2',
        url: 'https://twitter.com/1',
        timestamp: '2025-01-16T10:00:00.000Z',
        sentiment: 'negative',
        tags: ['bug'],
      },
    ];

    beforeEach(async () => {
      await storage.saveSignals(mockSignals);
    });

    it('should load all signals', async () => {
      const signals = await storage.loadSignals();
      expect(signals).toHaveLength(2);
    });

    it('should filter by source', async () => {
      const signals = await storage.loadSignals({ source: 'reddit' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.source).toBe('reddit');
    });

    it('should filter by type', async () => {
      const signals = await storage.loadSignals({ type: 'post' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.type).toBe('post');
    });

    it('should filter by sentiment', async () => {
      const signals = await storage.loadSignals({ sentiment: 'positive' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.sentiment).toBe('positive');
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-15T00:00:00.000Z');
      const endDate = new Date('2025-01-15T23:59:59.999Z');

      const signals = await storage.loadSignals({ startDate, endDate });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-1');
    });

    it('should filter by tags', async () => {
      const signals = await storage.loadSignals({ tags: ['feature'] });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.tags).toContain('feature');
    });

    it('should return empty array when no matches', async () => {
      const signals = await storage.loadSignals({ source: 'github' });
      expect(signals).toHaveLength(0);
    });

    it('should return empty array when no files exist', async () => {
      const emptyStorage = new FileSystemStorage('.test-data/empty');
      await emptyStorage.initialize();

      const signals = await emptyStorage.loadSignals();
      expect(signals).toHaveLength(0);

      await fs.rm('.test-data/empty', { recursive: true, force: true });
    });
  });

  describe('saveInsights', () => {
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        title: 'Feature Request Trend',
        summary: 'Users are requesting dark mode',
        category: 'feature-request',
        confidence: 0.85,
        sources: ['signal-1', 'signal-2'],
        timestamp: '2025-01-15T12:00:00.000Z',
      },
      {
        id: 'insight-2',
        title: 'Bug Report Pattern',
        summary: 'Login issues reported',
        category: 'bug-report',
        confidence: 0.92,
        sources: ['signal-3'],
        timestamp: '2025-01-15T13:00:00.000Z',
      },
    ];

    it('should save insights to file', async () => {
      await storage.saveInsights(mockInsights);

      const filePath = path.join(testBasePath, 'insights', '2025-01-15.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const savedInsights = JSON.parse(content) as Insight[];

      expect(savedInsights).toHaveLength(2);
      expect(savedInsights[0]?.id).toBe('insight-1');
    });

    it('should append to existing file', async () => {
      await storage.saveInsights([mockInsights[0] as Insight]);
      await storage.saveInsights([mockInsights[1] as Insight]);

      const filePath = path.join(testBasePath, 'insights', '2025-01-15.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const savedInsights = JSON.parse(content) as Insight[];

      expect(savedInsights).toHaveLength(2);
    });

    it('should handle empty array', async () => {
      await expect(storage.saveInsights([])).resolves.not.toThrow();
    });

    it('should throw StorageError for invalid data', async () => {
      const invalidInsight = {
        id: 'invalid',
        title: 'Test',
      } as unknown as Insight;

      await expect(storage.saveInsights([invalidInsight])).rejects.toThrow(StorageError);
    });
  });

  describe('loadInsights', () => {
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        title: 'Feature Request Trend',
        summary: 'Users want dark mode',
        category: 'feature-request',
        confidence: 0.85,
        sources: ['signal-1'],
        timestamp: '2025-01-15T12:00:00.000Z',
      },
      {
        id: 'insight-2',
        title: 'Bug Report Pattern',
        summary: 'Login issues',
        category: 'bug-report',
        confidence: 0.92,
        sources: ['signal-2'],
        timestamp: '2025-01-15T13:00:00.000Z',
      },
    ];

    beforeEach(async () => {
      await storage.saveInsights(mockInsights);
    });

    it('should load all insights', async () => {
      const insights = await storage.loadInsights();
      expect(insights).toHaveLength(2);
    });

    it('should filter by query in title', async () => {
      const insights = await storage.loadInsights('feature');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.title).toContain('Feature');
    });

    it('should filter by query in summary', async () => {
      const insights = await storage.loadInsights('login');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.summary).toContain('Login');
    });

    it('should filter by query in category', async () => {
      const insights = await storage.loadInsights('bug-report');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.category).toBe('bug-report');
    });

    it('should be case insensitive', async () => {
      const insights = await storage.loadInsights('FEATURE');
      expect(insights).toHaveLength(1);
    });

    it('should return all insights when query is empty', async () => {
      const insights = await storage.loadInsights('');
      expect(insights).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      const insights = await storage.loadInsights('nonexistent');
      expect(insights).toHaveLength(0);
    });
  });

  describe('Error Handling - Directory Initialization', () => {
    it('should handle directory creation failure', async () => {
      // Create storage with a path that will fail on Windows (invalid characters)
      const invalidStorage = new FileSystemStorage('test-data/rgs\x00invalid');

      await expect(invalidStorage.initialize()).rejects.toThrow(StorageError);
      await expect(invalidStorage.initialize()).rejects.toThrow(
        'Failed to initialize storage directories'
      );
    });
  });

  describe('Error Handling - Signal Operations', () => {
    it('should throw StorageError with ZodError cause for invalid signal data', async () => {
      const invalidSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user',
        url: 'not-a-valid-url', // Invalid URL
        timestamp: '2025-01-15T10:00:00.000Z',
      } as unknown as WebSignal;

      await expect(storage.saveSignals([invalidSignal])).rejects.toThrow(StorageError);
      await expect(storage.saveSignals([invalidSignal])).rejects.toThrow('Invalid signal data');
    });

    it('should handle file read errors in loadSignals', async () => {
      // Create a directory where a file should be (will cause read error)
      const problematicPath = '.test-data/error-test';
      const errorStorage = new FileSystemStorage(problematicPath);
      await errorStorage.initialize();

      const signalFilePath = path.join(problematicPath, 'signals', 'test-signal.json');

      // Create directory with name of expected file to cause error
      await fs.mkdir(signalFilePath, { recursive: true });

      await expect(errorStorage.loadSignals()).rejects.toThrow(StorageError);
      await expect(errorStorage.loadSignals()).rejects.toThrow('Failed to load signals');

      // Cleanup
      await fs.rm(problematicPath, { recursive: true, force: true });
    });

    it('should handle empty file content in loadSignals', async () => {
      const emptyFilePath = path.join(testBasePath, 'signals', 'empty-2025-01-15.json');

      // Create empty file
      await fs.writeFile(emptyFilePath, '', 'utf-8');

      const signals = await storage.loadSignals();

      // Should return empty array, not throw
      expect(signals).toHaveLength(0);
    });

    it('should handle whitespace-only file content in loadSignals', async () => {
      const whitespaceFilePath = path.join(testBasePath, 'signals', 'whitespace-2025-01-15.json');

      // Create file with only whitespace
      await fs.writeFile(whitespaceFilePath, '   \n\t  \n', 'utf-8');

      const signals = await storage.loadSignals();

      // Should return empty array, not throw
      expect(signals).toHaveLength(0);
    });
  });

  describe('Error Handling - Insight Operations', () => {
    it('should throw StorageError with ZodError cause for invalid insight data', async () => {
      const invalidInsight = {
        id: 'insight-1',
        title: 'Test',
        summary: 'Test summary',
        category: 'invalid-category', // Invalid category
        confidence: 0.5,
        sources: ['signal-1'],
        timestamp: '2025-01-15T10:00:00.000Z',
      } as unknown as Insight;

      await expect(storage.saveInsights([invalidInsight])).rejects.toThrow(StorageError);
      await expect(storage.saveInsights([invalidInsight])).rejects.toThrow('Invalid insight data');
    });

    it('should handle file read errors in loadInsights', async () => {
      // Create a directory where a file should be (will cause read error)
      const problematicPath = '.test-data/error-test-insights';
      const errorStorage = new FileSystemStorage(problematicPath);
      await errorStorage.initialize();

      const insightFilePath = path.join(problematicPath, 'insights', 'test-insight.json');

      // Create directory with name of expected file to cause error
      await fs.mkdir(insightFilePath, { recursive: true });

      await expect(errorStorage.loadInsights()).rejects.toThrow(StorageError);
      await expect(errorStorage.loadInsights()).rejects.toThrow('Failed to load insights');

      // Cleanup
      await fs.rm(problematicPath, { recursive: true, force: true });
    });

    it('should handle empty file content in loadInsights', async () => {
      const emptyFilePath = path.join(testBasePath, 'insights', 'empty-2025-01-15.json');

      // Create empty file
      await fs.writeFile(emptyFilePath, '', 'utf-8');

      const insights = await storage.loadInsights();

      // Should return empty array, not throw
      expect(insights).toHaveLength(0);
    });

    it('should handle whitespace-only file content in loadInsights', async () => {
      const whitespaceFilePath = path.join(testBasePath, 'insights', 'whitespace-2025-01-15.json');

      // Create file with only whitespace
      await fs.writeFile(whitespaceFilePath, '   \n\t  \n', 'utf-8');

      const insights = await storage.loadInsights();

      // Should return empty array, not throw
      expect(insights).toHaveLength(0);
    });
  });

  describe('Error Handling - File Operations', () => {
    it('should handle file write errors in appendOrCreateFile', async () => {
      const writeErrorPath = '.test-data/write-error-test';
      const writeErrorStorage = new FileSystemStorage(writeErrorPath);
      await writeErrorStorage.initialize();

      const signalFilePath = path.join(writeErrorPath, 'signals', 'reddit-2025-01-15.json');

      // Create directory with name of expected file to block write
      await fs.mkdir(signalFilePath, { recursive: true });

      const validSignal: WebSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user',
        url: 'https://reddit.com/test',
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      await expect(writeErrorStorage.saveSignals([validSignal])).rejects.toThrow(StorageError);

      // Cleanup
      await fs.rm(writeErrorPath, { recursive: true, force: true });
    });
  });

  describe('Edge Cases - Signal Filters', () => {
    const mockSignals: WebSignal[] = [
      {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test post',
        author: 'user1',
        url: 'https://reddit.com/1',
        timestamp: '2025-01-15T10:00:00.000Z',
        sentiment: 'positive',
        tags: ['feature', 'ui'],
      },
      {
        id: 'signal-2',
        source: 'twitter',
        type: 'tweet',
        content: 'Test tweet',
        author: 'user2',
        url: 'https://twitter.com/1',
        timestamp: '2025-01-16T10:00:00.000Z',
        sentiment: 'negative',
        tags: ['bug'],
      },
      {
        id: 'signal-3',
        source: 'github',
        type: 'issue',
        content: 'Test issue',
        author: 'user3',
        url: 'https://github.com/test/1',
        timestamp: '2025-01-17T10:00:00.000Z',
        sentiment: 'neutral',
        // No tags
      },
    ];

    beforeEach(async () => {
      await storage.saveSignals(mockSignals);
    });

    it('should handle filter with tags when signal has no tags', async () => {
      const signals = await storage.loadSignals({ tags: ['feature'] });

      // Line 276: signal.tags !== undefined check means signals without tags pass through
      // This covers the branch at line 276-277
      expect(signals).toHaveLength(2);
      expect(signals.find((s) => s.id === 'signal-1')).toBeDefined();
      expect(signals.find((s) => s.id === 'signal-3')).toBeDefined(); // Has no tags, passes through
    });

    it('should handle filter with empty tags array', async () => {
      const signals = await storage.loadSignals({ tags: [] });

      // Empty tags array (length === 0) bypasses the filter entirely (line 275)
      expect(signals).toHaveLength(3);
    });

    it('should handle filter with tags matching multiple criteria', async () => {
      const signals = await storage.loadSignals({
        tags: ['feature', 'bug'],
        source: 'reddit',
      });

      // Should match source AND tags
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-1');
    });

    it('should handle filter with tags that match no signals with tags', async () => {
      const signals = await storage.loadSignals({ tags: ['nonexistent-tag'] });

      // Line 277: !filter.tags.some(...) returns true when no tags match
      // This means signals with non-matching tags are filtered out, but signals without tags pass through
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-3'); // Signal without tags passes through
    });

    it('should filter by startDate boundary - signals on or after startDate', async () => {
      const startDate = new Date('2025-01-16T00:00:00.000Z');
      const signals = await storage.loadSignals({ startDate });

      // Line 265: Tests signalDate < filter.startDate (false branch - dates are equal or after)
      expect(signals).toHaveLength(2);
      expect(signals.find((s) => s.id === 'signal-2')).toBeDefined();
      expect(signals.find((s) => s.id === 'signal-3')).toBeDefined();
    });

    it('should filter by startDate - exclude signals before startDate', async () => {
      const startDate = new Date('2025-01-16T11:00:00.000Z');
      const signals = await storage.loadSignals({ startDate });

      // Line 266: Tests signalDate < filter.startDate (true branch - return false)
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-3');
    });
  });

  describe('Edge Cases - Non-JSON Files', () => {
    it('should skip non-JSON files in signals directory', async () => {
      // Create a non-JSON file in signals directory
      const nonJsonFile = path.join(testBasePath, 'signals', 'readme.txt');
      await fs.writeFile(nonJsonFile, 'This is a text file', 'utf-8');

      const validSignal: WebSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user',
        url: 'https://reddit.com/test',
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      await storage.saveSignals([validSignal]);

      // Line 86-87: Should skip non-.json files
      const signals = await storage.loadSignals();
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-1');
    });

    it('should skip non-JSON files in insights directory', async () => {
      // Create a non-JSON file in insights directory
      const nonJsonFile = path.join(testBasePath, 'insights', 'readme.md');
      await fs.writeFile(nonJsonFile, '# Insights', 'utf-8');

      const validInsight: Insight = {
        id: 'insight-1',
        title: 'Test',
        summary: 'Test summary',
        category: 'feature-request',
        confidence: 0.9,
        sources: ['signal-1'],
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      await storage.saveInsights([validInsight]);

      // Line 151-152: Should skip non-.json files
      const insights = await storage.loadInsights();
      expect(insights).toHaveLength(1);
      expect(insights[0]?.id).toBe('insight-1');
    });
  });

  describe('Error Handling - Non-ENOENT File Errors', () => {
    it('should throw non-ENOENT errors when reading existing file fails', async () => {
      const errorPath = '.test-data/read-error-test';
      const errorStorage = new FileSystemStorage(errorPath);
      await errorStorage.initialize();

      const signalFilePath = path.join(errorPath, 'signals', 'reddit-2025-01-15.json');

      // Create a valid JSON file first
      const validSignal: WebSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user',
        url: 'https://reddit.com/test',
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      await errorStorage.saveSignals([validSignal]);

      // Now replace it with a directory (will cause EISDIR error on read)
      await fs.rm(signalFilePath, { force: true });
      await fs.mkdir(signalFilePath, { recursive: true });

      const anotherSignal: WebSignal = {
        id: 'signal-2',
        source: 'reddit',
        type: 'post',
        content: 'Test 2',
        author: 'user2',
        url: 'https://reddit.com/test2',
        timestamp: '2025-01-15T11:00:00.000Z',
      };

      // Line 233: Should throw non-ENOENT error (EISDIR in this case)
      await expect(errorStorage.saveSignals([anotherSignal])).rejects.toThrow();

      // Cleanup
      await fs.rm(errorPath, { recursive: true, force: true });
    });
  });

  describe('Error Handling - Generic Errors', () => {
    it('should throw generic StorageError for non-Zod errors in saveSignals', async () => {
      const errorPath = '.test-data/generic-error-signals';
      const errorStorage = new FileSystemStorage(errorPath);
      await errorStorage.initialize();

      // Create directory where file should be to trigger write error
      const filePath = path.join(errorPath, 'signals', 'reddit-2025-01-15.json');
      await fs.mkdir(filePath, { recursive: true });

      const validSignal: WebSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user',
        url: 'https://reddit.com/test',
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      // Line 87: Should hit catch block with non-ZodError
      await expect(errorStorage.saveSignals([validSignal])).rejects.toThrow(StorageError);
      await expect(errorStorage.saveSignals([validSignal])).rejects.toThrow(
        'Failed to save signals'
      );

      // Cleanup
      await fs.rm(errorPath, { recursive: true, force: true });
    });

    it('should throw generic StorageError for non-Zod errors in saveInsights', async () => {
      const errorPath = '.test-data/generic-error-insights';
      const errorStorage = new FileSystemStorage(errorPath);
      await errorStorage.initialize();

      // Create directory where file should be to trigger write error
      const filePath = path.join(errorPath, 'insights', '2025-01-15.json');
      await fs.mkdir(filePath, { recursive: true });

      const validInsight: Insight = {
        id: 'insight-1',
        title: 'Test',
        summary: 'Test summary',
        category: 'feature-request',
        confidence: 0.9,
        sources: ['signal-1'],
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      // Line 135: Should hit catch block with non-ZodError
      await expect(errorStorage.saveInsights([validInsight])).rejects.toThrow(StorageError);
      await expect(errorStorage.saveInsights([validInsight])).rejects.toThrow(
        'Failed to save insights'
      );

      // Cleanup
      await fs.rm(errorPath, { recursive: true, force: true });
    });
  });

  describe('Directory Utilities', () => {
    it('should create directory when it does not exist', async () => {
      const newPath = '.test-data/new-dir-test';

      // Ensure directory doesn't exist
      await fs.rm(newPath, { recursive: true, force: true });

      const newStorage = new FileSystemStorage(newPath);

      // Line 311: Should create directory via mkdir
      await newStorage.initialize();

      const signalsPath = path.join(newPath, 'signals');
      const stat = await fs.stat(signalsPath);
      expect(stat.isDirectory()).toBe(true);

      // Cleanup
      await fs.rm(newPath, { recursive: true, force: true });
    });
  });
});
