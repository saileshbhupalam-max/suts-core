/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/prefer-optional-chain */
/**
 * LLM-based decision making for persona actions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PersonaProfile } from '@suts/persona';
import { ActionType } from '@suts/core';
import type { EmotionalState } from '@suts/core';
import type { ProductState } from '../types';

/**
 * Decision context for the LLM
 */
export interface DecisionContext {
  persona: PersonaProfile;
  productState: ProductState;
  emotionalState: EmotionalState;
  currentDay: number;
  previousActions: string[];
  availableActions: ActionType[];
}

/**
 * Decision result from the LLM
 */
export interface Decision {
  action: ActionType;
  reasoning: string;
  confidence: number;
  target?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Configuration for DecisionMaker
 */
export interface DecisionMakerConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Makes decisions for personas using LLM
 */
export class DecisionMaker {
  private client: Anthropic | null = null;
  private config: DecisionMakerConfig;
  private useMock: boolean;

  constructor(config: Partial<DecisionMakerConfig> = {}) {
    const envApiKey =
      typeof process !== 'undefined' && process.env
        ? process.env['ANTHROPIC_API_KEY']
        : undefined;

    this.config = {
      apiKey: config.apiKey ?? envApiKey ?? '',
      model: config.model ?? 'claude-sonnet-4-20250514',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 500,
    };

    // Use mock mode if no API key provided
    this.useMock = this.config.apiKey.length === 0;

    if (!this.useMock) {
      this.client = new Anthropic({ apiKey: this.config.apiKey });
    }
  }

  /**
   * Make a decision for the persona's next action
   */
  async decide(context: DecisionContext): Promise<Decision> {
    if (this.useMock) {
      return this.mockDecision(context);
    }

    const prompt = this.buildPrompt(context);

    try {
      const response = await this.client!.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content === undefined) {
        throw new Error('No content in response');
      }
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from LLM');
      }

      return this.parseDecision('text' in content ? content.text : '', context);
    } catch (_error) {
      // Fallback to mock on error
      return this.mockDecision(context);
    }
  }

  /**
   * Build prompt for LLM decision making
   */
  private buildPrompt(context: DecisionContext): string {
    const { persona, emotionalState, currentDay, previousActions } = context;

    return `You are simulating a user persona. Based on the persona's characteristics and current state, decide what action they should take next.

Persona Profile:
- Role: ${persona.role}
- Experience Level: ${persona.experienceLevel}
- Tech Stack: ${persona.techStack.join(', ')}
- Pain Points: ${persona.painPoints.join(', ')}
- Goals: ${persona.goals.join(', ')}
- Patience Level: ${persona.patienceLevel}
- Learning Style: ${persona.learningStyle}

Current Emotional State:
- Frustration: ${emotionalState.frustration.toFixed(2)}
- Confidence: ${emotionalState.confidence.toFixed(2)}
- Delight: ${emotionalState.delight.toFixed(2)}
- Confusion: ${emotionalState.confusion.toFixed(2)}

Simulation Day: ${currentDay}
Previous Actions: ${previousActions.join(', ') || 'None'}

Available Actions:
${context.availableActions.join(', ')}

Respond in JSON format:
{
  "action": "action_name",
  "reasoning": "why this action makes sense",
  "confidence": 0.8,
  "target": "optional feature or element",
  "parameters": {}
}`;
  }

  /**
   * Parse LLM response into a Decision
   */
  private parseDecision(
    response: string,
    context: DecisionContext
  ): Decision {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch === null) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as { action: string; reasoning?: string; confidence?: number; target?: string; parameters?: Record<string, unknown> };

      // Validate action is available
      const action = parsed.action.toUpperCase();
      if (!context.availableActions.includes(action as ActionType)) {
        throw new Error(`Invalid action: ${action}`);
      }

      const result: Decision = {
        action: action as ActionType,
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: parsed.confidence || 0.5,
      };

      if (parsed.target !== undefined) {
        result.target = parsed.target;
      }
      if (parsed.parameters !== undefined) {
        result.parameters = parsed.parameters;
      }

      return result;
    } catch (_error) {
      return this.mockDecision(context);
    }
  }

  /**
   * Mock decision for testing without LLM
   */
  private mockDecision(context: DecisionContext): Decision {
    const { persona, emotionalState, availableActions } = context;

    // Simple rule-based decision
    let selectedAction: ActionType;
    let reasoning: string;

    if (emotionalState.frustration > 0.7) {
      selectedAction = ActionType.SEEK_HELP;
      reasoning = 'High frustration level, seeking help';
    } else if (emotionalState.confusion > 0.6) {
      selectedAction = ActionType.READ_DOCS;
      reasoning = 'Confused, reading documentation';
    } else if (persona.experienceLevel === 'Novice' && emotionalState.confidence < 0.3) {
      selectedAction = ActionType.READ_DOCS;
      reasoning = 'Low confidence, reading documentation';
    } else if (availableActions.includes(ActionType.USE_FEATURE)) {
      selectedAction = ActionType.USE_FEATURE;
      reasoning = 'Attempting to use a feature';
    } else {
      selectedAction = availableActions[0] || ActionType.INSTALL;
      reasoning = 'Default action';
    }

    return {
      action: selectedAction,
      reasoning,
      confidence: 0.7,
    };
  }

  /**
   * Enable mock mode (for testing)
   */
  enableMockMode(): void {
    this.useMock = true;
  }

  /**
   * Disable mock mode
   */
  disableMockMode(): void {
    if (this.config.apiKey) {
      this.useMock = false;
    }
  }
}
