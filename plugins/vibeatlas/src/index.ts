/**
 * VibeAtlas Plugin Entry Point
 * Exports adapter and related types
 */

export { VibeAtlasAdapter } from './VibeAtlasAdapter';
export type { VibeAtlasState } from './models/VibeAtlasState';
export type { Feature } from './features/Feature';

// Export all features
export { TokenCounterFeature } from './features/TokenCounter';
export { ContextPreviewFeature } from './features/ContextPreview';
export { TryModeFeature } from './features/TryMode';
export { DashboardFeature } from './features/Dashboard';
export { PersistentMemoryFeature } from './features/PersistentMemory';
export { PerformanceOptFeature } from './features/PerformanceOpt';
export { AutoCaptureFeature } from './features/AutoCapture';
export { SessionReportsFeature } from './features/SessionReports';
export { MCPServerFeature } from './features/MCPServer';
