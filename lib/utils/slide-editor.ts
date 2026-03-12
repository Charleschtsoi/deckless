import { Slide, SlideDeck } from '@/lib/schemas/deck-schema';

/**
 * Update a specific slide in a deck
 */
export function updateSlide(deck: SlideDeck, slideId: string, updates: Partial<Slide>): SlideDeck {
  const updatedSlides = deck.slides.map(slide => {
    if (slide.id === slideId) {
      return { ...slide, ...updates };
    }
    return slide;
  });

  return {
    ...deck,
    slides: updatedSlides,
  };
}

/**
 * Update slide title
 */
export function updateSlideTitle(deck: SlideDeck, slideId: string, title: string): SlideDeck {
  return updateSlide(deck, slideId, { title });
}

/**
 * Update slide content
 */
export function updateSlideContent(deck: SlideDeck, slideId: string, content: string): SlideDeck {
  return updateSlide(deck, slideId, { content });
}

/**
 * Validate slide edit
 */
export function validateSlideEdit(slide: Partial<Slide>): { valid: boolean; error?: string } {
  if (slide.content !== undefined && slide.content.trim().length === 0) {
    return {
      valid: false,
      error: 'Slide content cannot be empty',
    };
  }

  if (slide.title !== undefined && slide.title.trim().length === 0) {
    return {
      valid: false,
      error: 'Slide title cannot be empty',
    };
  }

  return { valid: true };
}

/**
 * Find slide by ID
 */
export function findSlideById(deck: SlideDeck, slideId: string): Slide | undefined {
  return deck.slides.find(slide => slide.id === slideId);
}

/**
 * Clone deck (for immutability)
 */
export function cloneDeck(deck: SlideDeck): SlideDeck {
  return {
    ...deck,
    slides: deck.slides.map(slide => ({ ...slide })),
    theme: { ...deck.theme },
  };
}
