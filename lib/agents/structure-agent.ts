/**
 * Structure Agent - Final pass to ensure schema compliance
 * Normalizes field types, removes invalid properties
 * Guarantees valid Zod schema output
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { SlideDeck, SlideTypeSchema, LayoutSchema } from '@/lib/schemas/deck-schema';

export interface StructureInput {
  deck: any;
}

export interface StructureOutput {
  deck: SlideDeck;
}

export class StructureAgent extends BaseAgent<StructureInput, StructureOutput> {
  constructor() {
    super('StructureAgent', 1, 0);
  }

  protected async run(
    input: StructureInput,
    context?: AgentContext
  ): Promise<AgentResult<StructureOutput>> {
    try {
      this.log('[StructureAgent] Normalizing deck structure');

      const normalizedDeck = this.normalizeDeck(input.deck);

      this.log('[StructureAgent] Structure normalization completed', {
        slideCount: normalizedDeck.slides.length,
      });

      return this.success({
        deck: normalizedDeck,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[StructureAgent] Error: ${errorMessage}`);

      return this.failure(`Structure normalization failed: ${errorMessage}`);
    }
  }

  /**
   * Normalize deck structure to match schema
   */
  private normalizeDeck(deck: any): SlideDeck {
    const validTypes = ['hero', 'content', 'features', 'pricing', 'testimonial', 'cta'];
    const validLayouts = ['centered', 'split', 'grid'];

    // Ensure slides array exists and has at least 8 slides
    let slides = Array.isArray(deck.slides) ? deck.slides : [];
    
    // Normalize each slide
    slides = slides.map((slide: any, index: number) => {
      const normalized: any = {
        id: slide.id || `slide_${index + 1}`,
        type: this.normalizeType(slide.type, validTypes),
        layout: this.normalizeLayout(slide.layout, validLayouts),
        content: this.normalizeContent(slide.content),
      };

      // Optional fields
      if (slide.title && typeof slide.title === 'string') {
        normalized.title = slide.title;
      }

      if (slide.imageRef && typeof slide.imageRef === 'string') {
        normalized.imageRef = slide.imageRef;
      }

      if (slide.speakerNotes && typeof slide.speakerNotes === 'string') {
        normalized.speakerNotes = slide.speakerNotes;
      }

      if (Array.isArray(slide.keyPoints)) {
        normalized.keyPoints = slide.keyPoints.filter(
          (kp: any) => typeof kp === 'string'
        );
      }

      if (slide.dataPoints && typeof slide.dataPoints === 'object') {
        normalized.dataPoints = slide.dataPoints;
      }

      return normalized;
    });

    // Ensure minimum 8 slides
    while (slides.length < 8) {
      slides.push({
        id: `slide_${slides.length + 1}`,
        type: 'content',
        layout: 'centered',
        content: `Content for slide ${slides.length + 1}`,
      });
    }

    // Normalize theme
    const theme = {
      primaryColor: deck.theme?.primaryColor || '#3b82f6',
      secondaryColor: deck.theme?.secondaryColor || '#8b5cf6',
      backgroundColor: deck.theme?.backgroundColor || '#ffffff',
      textColor: deck.theme?.textColor || '#1f2937',
      fontFamily: deck.theme?.fontFamily || 'system-ui',
    };

    return {
      title: deck.title || 'Generated Presentation',
      slides: slides as any,
      theme,
    };
  }

  /**
   * Normalize slide type
   */
  private normalizeType(type: any, validTypes: string[]): string {
    if (typeof type === 'string' && validTypes.includes(type)) {
      return type;
    }

    // Map common invalid types to valid ones
    if (typeof type === 'string') {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('title') || lowerType.includes('cover')) {
        return 'hero';
      }
      if (lowerType.includes('feature')) {
        return 'features';
      }
      if (lowerType.includes('action') || lowerType.includes('next')) {
        return 'cta';
      }
      if (lowerType.includes('price')) {
        return 'pricing';
      }
      if (lowerType.includes('testimonial') || lowerType.includes('review')) {
        return 'testimonial';
      }
    }

    return 'content'; // Default
  }

  /**
   * Normalize layout
   */
  private normalizeLayout(layout: any, validLayouts: string[]): string {
    if (typeof layout === 'string' && validLayouts.includes(layout)) {
      return layout;
    }

    return 'centered'; // Default
  }

  /**
   * Normalize content field
   */
  private normalizeContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return item.text || item.content || JSON.stringify(item);
          }
          return String(item);
        })
        .filter((item: any) => item && item.trim().length > 0)
        .join('\n');
    }

    if (content === null || content === undefined) {
      return '';
    }

    return String(content);
  }
}
