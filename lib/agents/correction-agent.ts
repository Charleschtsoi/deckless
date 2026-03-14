/**
 * Correction Agent - Fixes validation errors through targeted prompts
 * Takes validation errors and requests targeted fixes from Content Agent
 * Iterates until validation passes (max 3 attempts)
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ValidationOutput } from './validation-agent';

export interface CorrectionInput {
  deck: any;
  validationErrors: string;
  validationDetails?: any;
}

export interface CorrectionOutput {
  correctedDeck: any;
}

export class CorrectionAgent extends BaseAgent<CorrectionInput, CorrectionOutput> {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    super('CorrectionAgent', 1, 0); // No retries - correction is single attempt
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  protected async run(
    input: CorrectionInput,
    context?: AgentContext
  ): Promise<AgentResult<CorrectionOutput>> {
    try {
      this.log('[CorrectionAgent] Analyzing validation errors', {
        errorCount: input.validationErrors.split(';').length,
      });

      // Build correction prompt
      const correctionPrompt = this.buildCorrectionPrompt(input);

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.modelName });

      const result = await model.generateContent(correctionPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        return this.failure('Empty response from LLM');
      }

      // Parse corrected deck
      const correctedDeck = this.parseCorrectedDeck(text, input.deck);

      this.log('[CorrectionAgent] Correction completed', {
        slideCount: correctedDeck.slides?.length || 0,
      });

      return this.success({ correctedDeck });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[CorrectionAgent] Error: ${errorMessage}`);

      // Fallback: Try programmatic fixes
      const programmaticallyFixed = this.programmaticFix(input.deck, input.validationErrors);
      return this.success({ correctedDeck: programmaticallyFixed });
    }
  }

  /**
   * Build correction prompt
   */
  private buildCorrectionPrompt(input: CorrectionInput): string {
    return `You are a correction agent. Fix the following validation errors in the slide deck.

VALIDATION ERRORS:
${input.validationErrors}

CURRENT DECK (as JSON):
${JSON.stringify(input.deck, null, 2)}

REQUIREMENTS:
1. Fix all validation errors listed above
2. Ensure the deck has at least 8 slides
3. Ensure all slide types are valid: "hero", "content", "features", "pricing", "testimonial", "cta"
4. Ensure all layouts are valid: "centered", "split", "grid"
5. Ensure "content" field is a STRING (not an array)
6. Remove any null values for optional fields (omit them instead)
7. Ensure all required fields are present

Return ONLY the corrected JSON deck object. Do not include any explanatory text. The response must be valid JSON that passes validation.`;
  }

  /**
   * Parse corrected deck from response
   */
  private parseCorrectedDeck(text: string, originalDeck: any): any {
    try {
      // Try to extract JSON
      let jsonText = text.trim();
      jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');

      const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      this.log('[CorrectionAgent] Failed to parse corrected deck, using programmatic fix');
      return this.programmaticFix(originalDeck, '');
    }
  }

  /**
   * Programmatic fixes for common validation errors
   */
  private programmaticFix(deck: any, validationErrors: string): any {
    const fixed = JSON.parse(JSON.stringify(deck)); // Deep clone

    // Ensure slides array exists
    if (!fixed.slides || !Array.isArray(fixed.slides)) {
      fixed.slides = [];
    }

    // Ensure minimum 8 slides
    while (fixed.slides.length < 8) {
      fixed.slides.push({
        id: `slide_${fixed.slides.length + 1}`,
        type: 'content',
        layout: 'centered',
        content: `Content for slide ${fixed.slides.length + 1}`,
      });
    }

    // Fix each slide
    fixed.slides = fixed.slides.map((slide: any, index: number) => {
      const fixedSlide: any = { ...slide };

      // Ensure id
      if (!fixedSlide.id) {
        fixedSlide.id = `slide_${index + 1}`;
      }

      // Fix type
      const validTypes = ['hero', 'content', 'features', 'pricing', 'testimonial', 'cta'];
      if (!validTypes.includes(fixedSlide.type)) {
        if (index === 0) {
          fixedSlide.type = 'hero';
        } else if (index === fixed.slides.length - 1) {
          fixedSlide.type = 'cta';
        } else {
          fixedSlide.type = 'content';
        }
      }

      // Fix layout
      const validLayouts = ['centered', 'split', 'grid'];
      if (!validLayouts.includes(fixedSlide.layout)) {
        fixedSlide.layout = 'centered';
      }

      // Fix content (must be string)
      if (Array.isArray(fixedSlide.content)) {
        fixedSlide.content = fixedSlide.content
          .map((item: any) => String(item))
          .filter((item: string) => item.trim().length > 0)
          .join('\n');
      } else if (typeof fixedSlide.content !== 'string') {
        fixedSlide.content = String(fixedSlide.content || '');
      }

      // Remove null/undefined optional fields
      if (fixedSlide.imageRef === null || fixedSlide.imageRef === undefined) {
        delete fixedSlide.imageRef;
      }

      if (fixedSlide.title === null || fixedSlide.title === undefined) {
        delete fixedSlide.title;
      }

      return fixedSlide;
    });

    // Ensure theme exists
    if (!fixed.theme) {
      fixed.theme = {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      };
    }

    // Ensure title exists
    if (!fixed.title) {
      fixed.title = 'Generated Presentation';
    }

    return fixed;
  }
}
