import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateSlideDeck } from '@/lib/schemas/deck-schema';
import { getPresetById, getDefaultPreset } from '@/lib/presets/style-presets';

/**
 * LLM Provider abstraction
 */
interface LLMProvider {
  generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown>;
}

interface ImageData {
  base64: string;
  name: string;
  mimeType: string;
}

/**
 * Build system prompt for LLM to act as professional consultant
 */
function buildSystemPrompt(userPrompt: string, imageCount: number): string {
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

RESEARCH REQUIREMENTS:
- Conduct thorough research on the topic using your knowledge base
- Search for and include relevant statistics, trends, industry data, and current information
- Provide real-world examples, case studies, and best practices where applicable
- Fill slides with substantive, informative content based on research - NOT placeholder text
- Include specific numbers, percentages, and data points when relevant
- Reference industry standards, benchmarks, or frameworks when appropriate
- Ensure all information is accurate and reflects current best practices
- Make each slide informative and valuable - users should learn something from each slide

USER REQUEST: ${userPrompt}
${imageCount > 0 ? `\nIMAGES PROVIDED: ${imageCount} image(s) - incorporate these into relevant slides where appropriate.` : ''}

Return a JSON object matching this exact structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": "slide_1",
      "type": "hero",
      "title": "Slide Title",
      "content": "Main content - use bullet points or concise text",
      "layout": "centered" | "split" | "grid",
      "imageRef": "optional_image_reference"
    }
  ],
  "theme": {
    "primaryColor": "#hexcolor",
    "secondaryColor": "#hexcolor",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "system-ui"
  }
}`;
}

/**
 * Claude (Anthropic) Provider
 */
class ClaudeProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[]): Promise<unknown> {
    // TODO: Implement Claude API integration
    // This is a stub that returns a sample deck structure with 8+ slides
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    // Generate sample slides following consultant structure
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    return {
      title: title || 'Professional Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: title || 'Presentation Title',
          content: 'Welcome to this professional presentation',
          layout: 'centered',
        },
        {
          id: 'slide_2',
          type: 'content',
          title: 'Executive Summary',
          content: '• Overview of key objectives\n• Strategic approach\n• Expected outcomes',
          layout: 'centered',
        },
        {
          id: 'slide_3',
          type: 'content',
          title: 'Problem Statement',
          content: '• Current challenges identified\n• Impact on business\n• Why this matters now',
          layout: 'centered',
        },
        {
          id: 'slide_4',
          type: 'features',
          title: 'Proposed Solution',
          content: '• Solution overview\n• Key components\n• How it addresses the problem',
          layout: 'centered',
        },
        {
          id: 'slide_5',
          type: 'content',
          title: 'Key Benefits',
          content: '• Benefit 1: Improved efficiency\n• Benefit 2: Cost reduction\n• Benefit 3: Enhanced value',
          layout: 'grid',
        },
        {
          id: 'slide_6',
          type: 'content',
          title: 'Implementation Approach',
          content: '• Phase 1: Planning and setup\n• Phase 2: Execution\n• Phase 3: Review and optimization',
          layout: 'centered',
        },
        {
          id: 'slide_7',
          type: 'content',
          title: 'Key Takeaways',
          content: '• Main point 1\n• Main point 2\n• Main point 3',
          layout: 'centered',
        },
        {
          id: 'slide_8',
          type: 'cta',
          title: 'Next Steps',
          content: '• Immediate actions required\n• Timeline and milestones\n• Expected outcomes',
          layout: 'centered',
        },
      ],
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };
  }
}

/**
 * GPT (OpenAI) Provider
 */
class GPTProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown> {
    // TODO: Implement OpenAI API integration
    // This is a stub that returns a sample deck structure with 8+ slides
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    const theme = stylePreset?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    };
    
    return {
      title: title || 'Professional Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: title || 'Presentation Title',
          content: 'Welcome to this professional presentation',
          layout: 'centered',
        },
        {
          id: 'slide_2',
          type: 'content',
          title: 'Executive Summary',
          content: '• Overview of key objectives\n• Strategic approach\n• Expected outcomes',
          layout: 'centered',
        },
        {
          id: 'slide_3',
          type: 'content',
          title: 'Problem Statement',
          content: '• Current challenges identified\n• Impact on business\n• Why this matters now',
          layout: 'centered',
        },
        {
          id: 'slide_4',
          type: 'features',
          title: 'Proposed Solution',
          content: '• Solution overview\n• Key components\n• How it addresses the problem',
          layout: 'centered',
        },
        {
          id: 'slide_5',
          type: 'content',
          title: 'Key Benefits',
          content: '• Benefit 1: Improved efficiency\n• Benefit 2: Cost reduction\n• Benefit 3: Enhanced value',
          layout: 'grid',
        },
        {
          id: 'slide_6',
          type: 'content',
          title: 'Implementation Approach',
          content: '• Phase 1: Planning and setup\n• Phase 2: Execution\n• Phase 3: Review and optimization',
          layout: 'centered',
        },
        {
          id: 'slide_7',
          type: 'content',
          title: 'Key Takeaways',
          content: '• Main point 1\n• Main point 2\n• Main point 3',
          layout: 'centered',
        },
        {
          id: 'slide_8',
          type: 'cta',
          title: 'Next Steps',
          content: '• Immediate actions required\n• Timeline and milestones\n• Expected outcomes',
          layout: 'centered',
        },
      ],
      theme,
    };
  }
}

/**
 * Gemini (Google) Provider
 */
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[], stylePreset?: { theme: any }): Promise<unknown> {
    // TODO: Implement Gemini API integration
    // This is a stub that returns a sample deck structure with 8+ slides
    const systemPrompt = buildSystemPrompt(prompt, images.length);
    
    const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
    
    const theme = stylePreset?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    };
    
    return {
      title: title || 'Professional Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: title || 'Presentation Title',
          content: 'Welcome to this professional presentation',
          layout: 'centered',
        },
        {
          id: 'slide_2',
          type: 'content',
          title: 'Executive Summary',
          content: '• Overview of key objectives\n• Strategic approach\n• Expected outcomes',
          layout: 'centered',
        },
        {
          id: 'slide_3',
          type: 'content',
          title: 'Problem Statement',
          content: '• Current challenges identified\n• Impact on business\n• Why this matters now',
          layout: 'centered',
        },
        {
          id: 'slide_4',
          type: 'features',
          title: 'Proposed Solution',
          content: '• Solution overview\n• Key components\n• How it addresses the problem',
          layout: 'centered',
        },
        {
          id: 'slide_5',
          type: 'content',
          title: 'Key Benefits',
          content: '• Benefit 1: Improved efficiency\n• Benefit 2: Cost reduction\n• Benefit 3: Enhanced value',
          layout: 'grid',
        },
        {
          id: 'slide_6',
          type: 'content',
          title: 'Implementation Approach',
          content: '• Phase 1: Planning and setup\n• Phase 2: Execution\n• Phase 3: Review and optimization',
          layout: 'centered',
        },
        {
          id: 'slide_7',
          type: 'content',
          title: 'Key Takeaways',
          content: '• Main point 1\n• Main point 2\n• Main point 3',
          layout: 'centered',
        },
        {
          id: 'slide_8',
          type: 'cta',
          title: 'Next Steps',
          content: '• Immediate actions required\n• Timeline and milestones\n• Expected outcomes',
          layout: 'centered',
        },
      ],
      theme,
    };
  }
}

/**
 * Get LLM provider based on environment configuration
 */
function getLLMProvider(): LLMProvider | null {
  const provider = (process.env.LLM_PROVIDER || 'claude').toLowerCase();
  let apiKey: string | undefined;

  switch (provider) {
    case 'claude':
      apiKey = process.env.CLAUDE_API_KEY;
      if (apiKey) return new ClaudeProvider(apiKey);
      break;
    case 'gpt':
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) return new GPTProvider(apiKey);
      break;
    case 'gemini':
    case 'google':
      apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey) return new GeminiProvider(apiKey);
      break;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const stylePresetId = (formData.get('stylePresetId') as string) || 'minimalist';

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get style preset
    const stylePreset = getPresetById(stylePresetId) || getDefaultPreset();

    // Extract images from form data
    const images: ImageData[] = [];
    let index = 0;
    while (formData.has(`image_${index}`)) {
      const base64 = formData.get(`image_${index}`) as string;
      const name = (formData.get(`image_${index}_name`) as string) || `image_${index}`;
      const mimeType = (formData.get(`image_${index}_mime`) as string) || 'image/jpeg';
      
      images.push({ base64, name, mimeType });
      index++;
    }

    // Get LLM provider
    const provider = getLLMProvider();
    if (!provider) {
      return NextResponse.json(
        { error: 'LLM provider not configured. Please set LLM_PROVIDER and corresponding API key in environment variables.' },
        { status: 500 }
      );
    }

    // Generate deck
    const rawDeck = await provider.generateDeck(prompt, images, stylePreset);

    // Validate response against schema
    let deck;
    try {
      deck = validateSlideDeck(rawDeck);
    } catch (validationError: unknown) {
      console.error('Validation error:', validationError);
      if (validationError instanceof Error && validationError.name === 'ZodError') {
        const zodError = validationError as z.ZodError;
        const errorMessages = zodError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        return NextResponse.json(
          { error: `Invalid deck structure: ${errorMessages}. The LLM must generate at least 8 slides.` },
          { status: 500 }
        );
      }
      throw validationError;
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error generating deck:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid deck structure returned from LLM. The presentation must have at least 8 slides.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}
