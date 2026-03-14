/**
 * Validation Agent - Validates generated deck against Zod schema
 * Checks slide count, valid types/layouts, and content quality
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { validateSlideDeck, SlideDeck, SlideDeckSchema } from '@/lib/schemas/deck-schema';
import { z } from 'zod';

export interface ValidationInput {
  deck: any;
}

export interface ValidationOutput {
  isValid: boolean;
  errors: string[];
  details?: z.ZodError;
}

export class ValidationAgent extends BaseAgent<ValidationInput, ValidationOutput> {
  constructor() {
    super('ValidationAgent', 1, 0); // No retries needed for validation
  }

  protected async run(
    input: ValidationInput,
    context?: AgentContext
  ): Promise<AgentResult<ValidationOutput>> {
    try {
      this.log('[ValidationAgent] Starting validation');

      // Validate against Zod schema
      const result = SlideDeckSchema.safeParse(input.deck);

      if (result.success) {
        this.log('[ValidationAgent] Validation passed');
        return this.success({
          isValid: true,
          errors: [],
        });
      } else {
        // Extract validation errors
        const errors = result.error.issues.map((issue) => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });

        this.log('[ValidationAgent] Validation failed', {
          errorCount: errors.length,
          errors: errors.slice(0, 3), // Log first 3 errors
        });

        return this.success({
          isValid: false,
          errors,
          details: result.error,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[ValidationAgent] Exception: ${errorMessage}`);

      return this.failure(`Validation exception: ${errorMessage}`, {
        exception: true,
      });
    }
  }

  /**
   * Quick validation check (non-throwing)
   */
  static quickValidate(deck: any): ValidationOutput {
    const result = SlideDeckSchema.safeParse(deck);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
      };
    } else {
      return {
        isValid: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
        details: result.error,
      };
    }
  }
}
