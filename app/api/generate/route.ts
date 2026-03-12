import { NextRequest, NextResponse } from 'next/server';
import { validateSlideDeck } from '@/lib/schemas/deck-schema';

/**
 * LLM Provider abstraction
 */
interface LLMProvider {
  generateDeck(prompt: string, images: ImageData[]): Promise<unknown>;
}

interface ImageData {
  base64: string;
  name: string;
  mimeType: string;
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
    // This is a stub that returns a sample deck structure
    return {
      title: 'Generated Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: 'Welcome',
          content: prompt.substring(0, 100),
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

  async generateDeck(prompt: string, images: ImageData[]): Promise<unknown> {
    // TODO: Implement OpenAI API integration
    // This is a stub that returns a sample deck structure
    return {
      title: 'Generated Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: 'Welcome',
          content: prompt.substring(0, 100),
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
 * Gemini (Google) Provider
 */
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeck(prompt: string, images: ImageData[]): Promise<unknown> {
    // TODO: Implement Gemini API integration
    // This is a stub that returns a sample deck structure
    return {
      title: 'Generated Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          title: 'Welcome',
          content: prompt.substring(0, 100),
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

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

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
    const rawDeck = await provider.generateDeck(prompt, images);

    // Validate response against schema
    const deck = validateSlideDeck(rawDeck);

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error generating deck:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid deck structure returned from LLM' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}
