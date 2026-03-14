import { ValidationAgent } from '../validation-agent';
import { SlideDeckSchema } from '@/lib/schemas/deck-schema';

describe('ValidationAgent', () => {
  let agent: ValidationAgent;

  beforeEach(() => {
    agent = new ValidationAgent();
  });

  it('should validate a correct deck structure', async () => {
    const validDeck = {
      title: 'Test Presentation',
      slides: Array.from({ length: 8 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: i === 0 ? 'hero' : 'content',
        layout: 'centered',
        content: `Content for slide ${i + 1}`,
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };

    const result = await agent.execute({ deck: validDeck });

    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(true);
    expect(result.data?.errors).toHaveLength(0);
  });

  it('should reject deck with less than 8 slides', async () => {
    const invalidDeck = {
      title: 'Test Presentation',
      slides: Array.from({ length: 5 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: 'content',
        layout: 'centered',
        content: `Content for slide ${i + 1}`,
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };

    const result = await agent.execute({ deck: invalidDeck });

    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(false);
    expect(result.data?.errors.length).toBeGreaterThan(0);
  });

  it('should reject deck with invalid slide type', async () => {
    const invalidDeck = {
      title: 'Test Presentation',
      slides: Array.from({ length: 8 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: i === 0 ? 'invalid_type' : 'content',
        layout: 'centered',
        content: `Content for slide ${i + 1}`,
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };

    const result = await agent.execute({ deck: invalidDeck });

    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBe(false);
    expect(result.data?.errors.some((e) => e.includes('type'))).toBe(true);
  });

  it('should use quickValidate static method', () => {
    const validDeck = {
      title: 'Test Presentation',
      slides: Array.from({ length: 8 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: 'content',
        layout: 'centered',
        content: `Content for slide ${i + 1}`,
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };

    const result = ValidationAgent.quickValidate(validDeck);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
