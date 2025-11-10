/**
 * Results writer for saving simulation outputs
 */

import * as fs from 'fs';
import * as path from 'path';
import { SimulationError } from '../errors';

/**
 * Result data types
 */
export interface SimulationResults {
  summary: SummaryData;
  personas: PersonaData[];
  events: EventData[];
  frictionPoints: FrictionPoint[];
  valueMoments: ValueMoment[];
  goNoGo: GoNoGoDecision;
}

export interface SummaryData {
  totalPersonas: number;
  totalEvents: number;
  simulationDays: number;
  productPlugin: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface PersonaData {
  id: string;
  name: string;
  background: string;
  goals: string[];
}

export interface EventData {
  id: string;
  personaId: string;
  timestamp: string;
  eventType: string;
  action?: string;
  context: Record<string, unknown>;
}

export interface FrictionPoint {
  id: string;
  description: string;
  severity: number;
  frequency: number;
  affectedPersonas: string[];
}

export interface ValueMoment {
  id: string;
  description: string;
  impact: number;
  frequency: number;
  affectedPersonas: string[];
}

export interface GoNoGoDecision {
  decision: 'go' | 'no-go';
  confidence: number;
  reasoning: string;
  metrics: {
    positioning: number;
    retention: number;
    viral: number;
  };
}

/**
 * Writer for simulation results
 */
export class ResultsWriter {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = path.resolve(outputDir);
  }

  /**
   * Ensure output directory exists
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      try {
        fs.mkdirSync(this.outputDir, { recursive: true });
      } catch (error) {
        throw new SimulationError(
          `Failed to create output directory: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Write JSON file
   * @param filename - Name of the file
   * @param data - Data to write
   */
  private writeJSON(filename: string, data: unknown): void {
    const filePath = path.join(this.outputDir, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new SimulationError(
        `Failed to write ${filename}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Write all simulation results
   * @param results - Simulation results to write
   */
  public writeResults(results: SimulationResults): void {
    this.ensureDirectory();

    this.writeJSON('summary.json', results.summary);
    this.writeJSON('personas.json', results.personas);
    this.writeJSON('events.json', results.events);
    this.writeJSON('friction-points.json', results.frictionPoints);
    this.writeJSON('value-moments.json', results.valueMoments);
    this.writeJSON('go-no-go.json', results.goNoGo);
  }

  /**
   * Get the output directory path
   * @returns Output directory path
   */
  public getOutputDirectory(): string {
    return this.outputDir;
  }
}
