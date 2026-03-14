import { StructureAgent } from '../structure-agent';

describe('StructureAgent', () => {
  let agent: StructureAgent;

  beforeEach(() => {
    agent = new StructureAgent();
  });

  it('should normalize deck structure', async () => {
    const deckWithIssues = {
      title: 'Test Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'title', // Invalid type
          layout: 'center', // Invalid layout
          content: ['Point 1', 'Point 2'], // Array instead of string
        },
        {
          id: 'slide_2',
          type: 'content',
          layout: 'centered',
          content: 'Valid content',
        },
      ],
      theme: {
        primaryColor: '#3b82f6',
      },
    };

    const result = await agent.execute({ deck: deckWithIssues });

    expect(result.success).toBe(true);
    expect(result.data?.deck.slides.length).toBeGreaterThanOrEqual(8);
    expect(result.data?.deck.slides[0].type).toBe('hero'); // Should normalize 'title' to 'hero'
    expect(result.data?.deck.slides[0].layout).toBe('centered'); // Should normalize invalid layout
    expect(typeof result.data?.deck.slides[0].content).toBe('string'); // Should convert array to string
  });

  it('should ensure minimum 8 slides', async () => {
    const deckWithFewSlides = {
      title: 'Test Presentation',
      slides: [
        {
          id: 'slide_1',
          type: 'hero',
          layout: 'centered',
          content: 'Content 1',
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

    const result = await agent.execute({ deck: deckWithFewSlides });

    expect(result.success).toBe(true);
    expect(result.data?.deck.slides.length).toBeGreaterThanOrEqual(8);
  });

  it('should normalize content arrays to strings', async () => {
    const deckWithArrayContent = {
      title: 'Test Presentation',
      slides: Array.from({ length: 8 }, (_, i) => ({
        id: `slide_${i + 1}`,
        type: 'content',
        layout: 'centered',
        content: ['Point 1', 'Point 2', 'Point 3'],
      })),
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui',
      },
    };

    const result = await agent.execute({ deck: deckWithArrayContent });

    expect(result.success).toBe(true);
    result.data?.deck.slides.forEach((slide) => {
      expect(typeof slide.content).toBe('string');
    });
  });
});
