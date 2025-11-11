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

      expect(await fs.access(redditFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(twitterFile).then(() => true).catch(() => false)).toBe(true);
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
});
