/**
 * Content Agent - Generates slide content using structured outputs
 * Uses research data (if available) + user prompt
 * Focuses on Level 3 content quality (specific, data-driven)
 */

import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DecisionOutput } from './decision-agent';
import { ResearchOutput } from './research-agent';
import { SlideDeck } from '@/lib/schemas/deck-schema';

export interface ContentInput {
  prompt: string;
  researchData?: ResearchOutput['researchData'];
  decision: DecisionOutput;
}

export interface ContentOutput {
  deck: any; // Will be validated by ValidationAgent
}

export class ContentAgent extends BaseAgent<ContentInput, ContentOutput> {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    super('ContentAgent', 2, 1000);
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  protected async run(
    input: ContentInput,
    context?: AgentContext
  ): Promise<AgentResult<ContentOutput>> {
    try {
      this.log('[ContentAgent] Generating slide content', {
        hasResearch: !!input.researchData,
        promptComplexity: input.decision.promptComplexity,
      });

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.modelName });

      // Build content generation prompt
      const contentPrompt = this.buildContentPrompt(input, context);

      // Prepare content parts
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: contentPrompt },
      ];

      // Add images and PDFs if provided
      if (context?.images && context.images.length > 0) {
        const imageCount = context.images.filter(img => img.type !== 'pdf').length;
        const pdfCount = context.images.filter(img => img.type === 'pdf').length;
        
        for (const file of context.images) {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64,
            },
          });
        }
        
        this.log('[ContentAgent] Added files to request', {
          images: imageCount,
          pdfs: pdfCount,
        });
      }

      // Generate content
      let result;
      try {
        result = await model.generateContent(parts);
      } catch (formatError: any) {
        this.log('[ContentAgent] Direct format failed, trying contents format');
        result = await model.generateContent({
          contents: [{ role: 'user', parts }],
        });
      }

      const response = await result.response;

      if (!response) {
        return this.failure('No response received from Gemini API');
      }

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        const finishReason = response.promptFeedback?.blockReason || 'unknown';
        return this.failure(
          `Gemini API blocked the response. Reason: ${finishReason}`
        );
      }

      const text = response.text();

      if (!text || text.trim().length === 0) {
        return this.failure('Empty response received from Gemini API');
      }

      this.log('[ContentAgent] Response received, parsing JSON');

      // Parse JSON with multiple strategies
      const deck = this.parseDeckResponse(text, input.prompt, context?.stylePreset);

      this.log('[ContentAgent] Content generated', {
        slideCount: deck.slides?.length || 0,
      });

      return this.success({ deck });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`[ContentAgent] Error: ${errorMessage}`);
      return this.failure(`Content generation failed: ${errorMessage}`);
    }
  }

  /**
   * Build content generation prompt
   */
  private buildContentPrompt(
    input: ContentInput,
    context?: AgentContext
  ): string {
    const researchSection = input.researchData
      ? `
RESEARCH DATA AVAILABLE:
${this.formatResearchData(input.researchData)}

Use this research data to enrich the presentation with specific numbers, statistics, and market insights.
`
      : `
NOTE: No research data available. Use your knowledge base to include relevant statistics and data points.
`;

    return `You are a professional consultant from Accenture/IBM with expertise in creating compelling business presentations.

Your task is to create a comprehensive, professional presentation deck based on the user's request.

CRITICAL REQUIREMENTS:
1. Generate AT LEAST 8 slides (aim for 8-12 slides for optimal presentation flow)
2. Follow professional consulting presentation structure:
   - Slide 1: Title/Cover slide with main topic
   - Slide 2: Executive Summary or Agenda
   - Slides 3-6: Main content sections (Problem Statement, Solution, Benefits, Approach)
   - Slide 7: Key Takeaways or Recommendations
   - Slide 8: Next Steps or Call to Action
3. Each slide must be optimized for MOBILE VERTICAL SCROLLING:
   - Content should be concise and speakable (not dense text)
   - Use clear visual hierarchy
   - Ensure text is readable on mobile screens
   - Design for presenters to slowly walk through ideas verbally
4. Content should be suitable for verbal presentation - use bullet points, key phrases, and talking points rather than paragraphs
5. Map uploaded images to relevant slides using the imageRef field (if images are provided)

CRITICAL CONTENT LENGTH REQUIREMENTS:
- Each slide should have MAXIMUM 3-5 bullet points
- Each bullet point should be 10-15 words maximum
- Total content per slide should not exceed 80 words
- Use short, punchy phrases - NOT full sentences
- Prioritize key information - remove filler words
- Be concise and impactful - every word must add value

CONTENT QUALITY REQUIREMENT: Level 3 (EXCELLENT)
- Specificity: Instead of "improve efficiency", say "reduce processing time by 40%"
- Context: Include industry benchmarks (e.g., "industry average is X, we target Y")
- Examples: Reference similar successful implementations
- Data: Include statistics, percentages, numbers, dates
- NO generic placeholder text - every element should add value

${researchSection}

USER REQUEST: ${input.prompt}
${context?.images && context.images.length > 0 ? (() => {
  const imageCount = context.images.filter(img => img.type !== 'pdf').length;
  const pdfCount = context.images.filter(img => img.type === 'pdf').length;
  const parts = [];
  if (imageCount > 0) parts.push(`${imageCount} image(s)`);
  if (pdfCount > 0) parts.push(`${pdfCount} PDF file(s)`);
  return `\nFILES PROVIDED: ${parts.join(' and ')} - analyze and incorporate content from these files into relevant slides where appropriate. For PDFs, extract key information, statistics, and insights to enrich the presentation.`;
})() : ''}

Return a JSON object matching this exact structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": "slide_1",
      "type": "hero",
      "title": "Slide Title",
      "content": "Main content as a STRING - use bullet points separated by newlines (\\n). Make this comprehensive and detailed with specific data, examples, and actionable insights.",
      "layout": "centered",
      "imageRef": "optional_image_reference_string_or_omit_if_not_needed",
      "speakerNotes": "Optional: Additional context for presenter",
      "keyPoints": ["Optional: Array of key points"],
      "dataPoints": {"Optional": "Supporting data/metrics"}
    }
  ],
  "theme": {
    "primaryColor": "#hexcolor",
    "secondaryColor": "#hexcolor",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui"
  }
}

CRITICAL FIELD REQUIREMENTS:
- "content" MUST be a STRING, NOT an array. Use newlines (\\n) to separate bullet points.
  Example: "• Point 1\\n• Point 2\\n• Point 3"
- "imageRef" MUST be a STRING if provided, or OMIT the field entirely if not needed. Do NOT use null.
- "title" is optional - omit if not needed, do not use null.

CRITICAL: Valid slide types (MUST use exactly these strings):
- "hero" - for title/cover slides
- "content" - for general content slides
- "features" - for feature/product highlights
- "pricing" - for pricing information
- "testimonial" - for testimonials/reviews
- "cta" - for call-to-action slides

CRITICAL: Valid layout types (MUST use exactly these strings):
- "centered" - centered content layout
- "split" - split screen layout
- "grid" - grid layout

You MUST use only these exact string values. Do not invent new types or layouts.

CRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text before or after the JSON. The response must be parseable JSON that matches the exact structure specified above.`;
  }

  /**
   * Format research data for prompt
   */
  private formatResearchData(researchData: ResearchOutput['researchData']): string {
    const sections: string[] = [];

    if (researchData.marketSize) {
      sections.push(`Market Size: ${researchData.marketSize}`);
    }

    if (researchData.trends && researchData.trends.length > 0) {
      sections.push(`Trends:\n${researchData.trends.map((t) => `- ${t}`).join('\n')}`);
    }

    if (researchData.statistics && researchData.statistics.length > 0) {
      sections.push(
        `Statistics:\n${researchData.statistics.map((s) => `- ${s.label}: ${s.value}`).join('\n')}`
      );
    }

    if (researchData.competition) {
      sections.push(`Competition: ${researchData.competition}`);
    }

    if (researchData.financials) {
      sections.push(`Financials: ${researchData.financials}`);
    }

    if (researchData.locationInsights) {
      sections.push(`Location Insights: ${researchData.locationInsights}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Parse deck response with multiple fallback strategies
   */
  private parseDeckResponse(
    text: string,
    prompt: string,
    stylePreset?: { theme: any }
  ): any {
    let deck: any = null;
    let parseSuccess = false;

    // Strategy 1: Direct JSON parse
    try {
      deck = JSON.parse(text.trim());
      parseSuccess = true;
      this.log('[ContentAgent] Strategy 1 succeeded: Direct JSON parse');
    } catch (e) {
      this.log('[ContentAgent] Strategy 1 failed, trying Strategy 2...');
    }

    // Strategy 2: Extract from markdown code blocks
    if (!parseSuccess) {
      try {
        let jsonText = text.trim();
        jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');

        const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          deck = JSON.parse(jsonMatch[1]);
          parseSuccess = true;
          this.log('[ContentAgent] Strategy 2 succeeded: Extracted from markdown');
        }
      } catch (e) {
        this.log('[ContentAgent] Strategy 2 failed, trying Strategy 3...');
      }
    }

    // Strategy 3: Fix common JSON issues
    if (!parseSuccess) {
      try {
        let jsonText = text.trim();
        jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');

        jsonText = jsonText
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*undefined/g, ': null') // Replace undefined with null
          .replace(/:\s*null(\s*[,}])/g, ':$1'); // Remove null values for optional fields

        const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          deck = JSON.parse(jsonMatch[1]);
          parseSuccess = true;
          this.log('[ContentAgent] Strategy 3 succeeded: Fixed JSON issues');
        }
      } catch (e) {
        this.log('[ContentAgent] Strategy 3 failed, using fallback generator');
      }
    }

    // Strategy 4: Fallback - generate basic deck structure
    if (!parseSuccess) {
      this.log('[ContentAgent] All parsing strategies failed, generating fallback deck');
      deck = this.generateFallbackDeck(text, prompt, stylePreset);
    }

    // Normalize deck structure
    return this.normalizeDeck(deck, prompt, stylePreset);
  }

  /**
   * Generate fallback deck from text
   */
  private generateFallbackDeck(
    text: string,
    prompt: string,
    stylePreset?: { theme: any }
  ): any {
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt || 'Generated Presentation';

    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    const bulletPoints = lines.filter(
      (line) => line.trim().startsWith('•') || line.trim().startsWith('-')
    );

    const slides = [];
    const slideTitles = [
      'Introduction',
      'Executive Summary',
      'Problem Statement',
      'Solution Overview',
      'Key Benefits',
      'Implementation Plan',
      'Key Takeaways',
      'Next Steps',
    ];

    const contentPerSlide = Math.max(3, Math.ceil(bulletPoints.length / 8));

    for (let i = 0; i < 8; i++) {
      const startIdx = i * contentPerSlide;
      const endIdx = Math.min(startIdx + contentPerSlide, bulletPoints.length);
      const slideContent = bulletPoints.slice(startIdx, endIdx);

      const content =
        slideContent.length > 0
          ? slideContent.join('\n')
          : lines.slice(startIdx * 2, endIdx * 2).join('\n') || `Content for ${slideTitles[i]}`;

      slides.push({
        id: `slide_${i + 1}`,
        type: i === 0 ? 'hero' : i === 7 ? 'cta' : 'content',
        title: slideTitles[i],
        content: content.substring(0, 500),
        layout: 'centered',
      });
    }

    const theme = stylePreset?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    };

    return {
      title,
      slides,
      theme,
    };
  }

  /**
   * Normalize deck structure
   */
  private normalizeDeck(deck: any, prompt: string, stylePreset?: { theme: any }): any {
    const validTypes = ['hero', 'content', 'features', 'pricing', 'testimonial', 'cta'];
    const validLayouts = ['centered', 'split', 'grid'];

    if (!deck.slides || !Array.isArray(deck.slides)) {
      deck.slides = [];
    }

    deck.slides = deck.slides.map((slide: any, index: number) => {
      const normalized: any = { ...slide };

      // Fix invalid slide types
      if (!validTypes.includes(slide.type)) {
        if (slide.type?.toLowerCase().includes('title') || slide.type?.toLowerCase().includes('cover')) {
          normalized.type = 'hero';
        } else if (slide.type?.toLowerCase().includes('feature')) {
          normalized.type = 'features';
        } else if (slide.type?.toLowerCase().includes('action') || slide.type?.toLowerCase().includes('next')) {
          normalized.type = 'cta';
        } else {
          normalized.type = 'content';
        }
      }

      // Fix invalid layouts
      if (!validLayouts.includes(slide.layout)) {
        normalized.layout = 'centered';
      }

      // Normalize content
      if (Array.isArray(slide.content)) {
        normalized.content = slide.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              return item.text || item.content || JSON.stringify(item);
            }
            return String(item);
          })
          .filter((item: any) => item && item.trim().length > 0)
          .join('\n');
      } else if (typeof slide.content !== 'string') {
        normalized.content = String(slide.content || '');
      }

      // Normalize imageRef
      if (slide.imageRef === null || slide.imageRef === undefined) {
        delete normalized.imageRef;
      } else if (typeof slide.imageRef !== 'string') {
        if (slide.imageRef) {
          normalized.imageRef = String(slide.imageRef);
        } else {
          delete normalized.imageRef;
        }
      }

      // Ensure required fields
      if (!normalized.id) {
        normalized.id = `slide_${index + 1}`;
      }

      return normalized;
    });

    // Ensure minimum 8 slides
    while (deck.slides.length < 8) {
      deck.slides.push({
        id: `slide_${deck.slides.length + 1}`,
        type: 'content',
        layout: 'centered',
        content: `Content for slide ${deck.slides.length + 1}`,
      });
    }

    // Apply theme
    const theme = stylePreset?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    };

    if (!deck.theme) {
      deck.theme = theme;
    } else {
      deck.theme = { ...theme, ...deck.theme };
    }

    if (!deck.title) {
      deck.title = prompt.substring(0, 50) || 'Generated Presentation';
    }

    return deck;
  }
}
