/**
 * RGS Structured Logging Module
 *
 * Provides JSON-formatted logging with:
 * - Different log levels (debug, info, warn, error)
 * - Structured context data
 * - Timestamp and level metadata
 */

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to output in JSON format (default: true) */
  json?: boolean;
  /** Custom output function (default: console.log) */
  output?: (entry: LogEntry) => void;
}

/**
 * Structured logger for RGS scrapers
 *
 * Outputs JSON-formatted logs with timestamps and context data
 */
export class Logger {
  private readonly minLevel: LogLevel;
  private readonly json: boolean;
  private readonly output: (entry: LogEntry) => void;

  private static readonly LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  /**
   * Creates a new Logger instance
   *
   * @param options - Logger configuration options
   */
  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.json = options.json ?? true;
    this.output = options.output ?? this.defaultOutput.bind(this);
  }

  /**
   * Default output function that writes to console
   */
  private defaultOutput(entry: LogEntry): void {
    if (this.json) {
      console.log(JSON.stringify(entry));
    } else {
      const contextStr = entry.context !== undefined ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error !== undefined ? ` [${entry.error.name}: ${entry.error.message}]` : '';
      console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`);
    }
  }

  /**
   * Checks if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return Logger.LEVEL_PRIORITY[level] >= Logger.LEVEL_PRIORITY[this.minLevel];
  }

  /**
   * Creates a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    if (context !== undefined && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error !== undefined) {
      const errorEntry: { name: string; message: string; stack?: string; cause?: unknown } = {
        name: error.name,
        message: error.message
      };

      if (error.stack !== undefined) {
        errorEntry.stack = error.stack;
      }

      if (error.cause !== undefined) {
        errorEntry.cause = error.cause;
      }

      entry.error = errorEntry;
    }

    return entry;
  }

  /**
   * Logs a message at the specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, context, error);
    this.output(entry);
  }

  /**
   * Logs a debug message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an info message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   *
   * @param message - Log message
   * @param context - Optional context data
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message
   *
   * @param message - Log message
   * @param context - Optional context data
   * @param error - Optional error object
   */
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Creates a child logger with additional context
   *
   * @param context - Context to add to all log messages
   */
  child(context: Record<string, unknown>): Logger {
    const parentOutput = this.output;
    return new Logger({
      minLevel: this.minLevel,
      json: this.json,
      output: (entry: LogEntry) => {
        const enhancedEntry: LogEntry = {
          ...entry,
          context: {
            ...context,
            ...entry.context
          }
        };
        parentOutput(enhancedEntry);
      }
    });
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger();
