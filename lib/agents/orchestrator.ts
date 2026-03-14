/**
 * Orchestrator coordinates the multi-agent workflow
 * Manages agent execution order, dependencies, and error recovery
 * Inspired by openimpact2's transparent agent reasoning pattern
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { SlideDeck } from '@/lib/schemas/deck-schema';

export interface OrchestrationResult {
  success: boolean;
  deck?: SlideDeck;
  error?: string;
  executionLog: ExecutionLogEntry[];
  metrics: {
    decisionTime?: number;
    researchTime?: number;
    contentTime?: number;
    validationTime?: number;
    correctionIterations?: number;
    totalTime: number;
  };
}

export interface ExecutionLogEntry {
  timestamp: string;
  agent: string;
  action: string;
  result: 'success' | 'error' | 'skipped';
  message?: string;
  data?: any;
}

export class AgentOrchestrator {
  private executionLog: ExecutionLogEntry[] = [];
  private startTime: number = 0;

  constructor(
    private decisionAgent: BaseAgent<any, any>,
    private researchAgent?: BaseAgent<any, any>,
    private contentAgent: BaseAgent<any, any>,
    private validationAgent: BaseAgent<any, any>,
    private correctionAgent?: BaseAgent<any, any>,
    private structureAgent?: BaseAgent<any, any>
  ) {}

  /**
   * Execute the full agent workflow
   */
  async execute(
    prompt: string,
    images: Array<{ base64: string; name: string; mimeType: string; type?: 'image' | 'pdf' }> = [],
    stylePreset?: { theme: any }
  ): Promise<OrchestrationResult> {
    this.startTime = Date.now();
    this.executionLog = [];
    const metrics = {
      decisionTime: 0,
      researchTime: 0,
      contentTime: 0,
      validationTime: 0,
      correctionIterations: 0,
      totalTime: 0,
    };

    const context: AgentContext = {
      prompt,
      images,
      stylePreset,
    };

    try {
      // Step 1: Decision Agent - Analyze prompt and decide what actions are needed
      this.log('decision', 'Analyzing prompt to determine required actions');
      const decisionStart = Date.now();
      const decisionResult = await this.decisionAgent.execute(prompt, context);
      metrics.decisionTime = Date.now() - decisionStart;

      if (!decisionResult.success || !decisionResult.data) {
        return this.createFailureResult(
          `Decision agent failed: ${decisionResult.error}`,
          metrics
        );
      }

      const decision = decisionResult.data;
      this.log('decision', 'Decision made', {
        needsResearch: decision.needsResearch,
        reasoning: decision.reasoning,
        promptComplexity: decision.promptComplexity,
      });

      // Step 2: Research Agent - Only if Decision Agent determines research is needed
      let researchData: any = null;
      if (decision.needsResearch && this.researchAgent) {
        this.log('research', 'Executing research based on decision agent output');
        const researchStart = Date.now();
        const researchResult = await this.researchAgent.execute(
          { prompt, decision },
          context
        );
        metrics.researchTime = Date.now() - researchStart;

        if (researchResult.success && researchResult.data) {
          researchData = researchResult.data;
          this.log('research', 'Research completed', {
            sources: researchData.sources?.length || 0,
            dataTypes: researchData.dataTypes || [],
          });
        } else {
          this.log('research', 'Research failed, continuing without research data', {
            error: researchResult.error,
          });
        }
      } else {
        this.log('research', 'Skipped - Decision agent determined research not needed');
      }

      // Step 3: Content Agent - Generate slide content
      this.log('content', 'Generating slide content');
      const contentStart = Date.now();
      const contentResult = await this.contentAgent.execute(
        {
          prompt,
          researchData,
          decision,
        },
        context
      );
      metrics.contentTime = Date.now() - contentStart;

      if (!contentResult.success || !contentResult.data) {
        return this.createFailureResult(
          `Content agent failed: ${contentResult.error}`,
          metrics
        );
      }

      let deck = contentResult.data;
      this.log('content', 'Content generated', {
        slideCount: deck.slides?.length || 0,
      });

      // Step 4: Validation Agent - Validate deck structure
      this.log('validation', 'Validating deck structure');
      const validationStart = Date.now();
      let validationResult = await this.validationAgent.execute(deck, context);
      metrics.validationTime = Date.now() - validationStart;

      // Step 5: Correction Agent - Fix validation errors if needed
      let correctionAttempts = 0;
      const maxCorrections = 3;

      while (!validationResult.success && correctionAttempts < maxCorrections && this.correctionAgent) {
        correctionAttempts++;
        metrics.correctionIterations = correctionAttempts;
        
        this.log('correction', `Attempting correction ${correctionAttempts}/${maxCorrections}`, {
          errors: validationResult.error,
        });

        const correctionResult = await this.correctionAgent.execute(
          {
            deck,
            validationErrors: validationResult.error,
            validationDetails: validationResult.metadata,
          },
          context
        );

        if (correctionResult.success && correctionResult.data) {
          // Update deck with corrected version
          deck = correctionResult.data;
          
          // Re-validate
          this.log('validation', 'Re-validating after correction');
          validationResult = await this.validationAgent.execute(deck, context);
          
          if (validationResult.success) {
            this.log('correction', 'Correction successful, validation passed');
            break;
          }
        } else {
          this.log('correction', 'Correction failed', {
            error: correctionResult.error,
          });
          break;
        }
      }

      if (!validationResult.success) {
        return this.createFailureResult(
          `Validation failed after ${correctionAttempts} correction attempts: ${validationResult.error}`,
          metrics
        );
      }

      // Step 6: Structure Agent - Final schema compliance check
      if (this.structureAgent) {
        this.log('structure', 'Ensuring final schema compliance');
        const structureResult = await this.structureAgent.execute(deck, context);

        if (structureResult.success && structureResult.data) {
          deck = structureResult.data;
          this.log('structure', 'Structure normalization completed');
        } else {
          this.log('structure', 'Structure agent failed, using validated deck', {
            error: structureResult.error,
          });
        }
      }

      metrics.totalTime = Date.now() - this.startTime;

      return {
        success: true,
        deck: deck as SlideDeck,
        executionLog: this.executionLog,
        metrics,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createFailureResult(`Orchestration failed: ${errorMessage}`, metrics);
    }
  }

  /**
   * Log execution step
   */
  private log(agent: string, action: string, data?: any): void {
    const entry: ExecutionLogEntry = {
      timestamp: new Date().toISOString(),
      agent,
      action,
      result: 'success',
      message: action,
      data,
    };

    this.executionLog.push(entry);
    console.log(`[Orchestrator] [${agent}] ${action}`, data || '');
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    error: string,
    metrics: OrchestrationResult['metrics']
  ): OrchestrationResult {
    metrics.totalTime = Date.now() - this.startTime;

    return {
      success: false,
      error,
      executionLog: this.executionLog,
      metrics,
    };
  }

  /**
   * Get execution log
   */
  getExecutionLog(): ExecutionLogEntry[] {
    return this.executionLog;
  }
}
