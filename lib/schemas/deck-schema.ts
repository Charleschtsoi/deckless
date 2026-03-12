import { z } from 'zod';

/**
 * Theme configuration for the slide deck
 */
export const ThemeSchema = z.object({
  primaryColor: z.string().default('#3b82f6'),
  secondaryColor: z.string().default('#8b5cf6'),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#1f2937'),
  fontFamily: z.string().default('system-ui'),
});

export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Slide type definitions
 */
export const SlideTypeSchema = z.enum([
  'hero',
  'content',
  'features',
  'pricing',
  'testimonial',
  'cta',
]);

export const LayoutSchema = z.enum(['centered', 'split', 'grid']);

/**
 * Individual slide schema
 */
export const SlideSchema = z.object({
  id: z.string(),
  type: SlideTypeSchema,
  title: z.string().optional(),
  content: z.string(),
  imageRef: z.string().optional(), // Maps to uploaded image key
  layout: LayoutSchema,
  metadata: z.record(z.any()).optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

/**
 * Complete slide deck schema
 */
export const SlideDeckSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema).min(1),
  theme: ThemeSchema,
});

export type SlideDeck = z.infer<typeof SlideDeckSchema>;

/**
 * Validation function for slide deck JSON
 */
export function validateSlideDeck(data: unknown): SlideDeck {
  return SlideDeckSchema.parse(data);
}
