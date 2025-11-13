/**
 * RGS Reporter - Main Export
 *
 * Report generation for RGS insights.
 */

// Main generator
export { ReportGenerator, ReportGenerationError } from './generator';

// Formatters
export { JSONFormatter, MarkdownFormatter } from './formatters';

// Types
export type {
  ReportData,
  ReportOptions,
  ReportResult,
  ReportFormatter,
  ReportFormat,
  ReportMetadata,
  InsightSummary,
  CategorizedTheme,
} from './types';
