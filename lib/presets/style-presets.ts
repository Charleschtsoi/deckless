import { Theme } from '@/lib/schemas/deck-schema';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: 'dark' | 'light' | 'specialty';
  theme: Theme;
  animationStyle: 'subtle' | 'moderate' | 'bold';
  previewColors: string[]; // For preview display
}

export const stylePresets: StylePreset[] = [
  // Dark Themes
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Futuristic, techy, vibrant colors',
    category: 'dark',
    theme: {
      primaryColor: '#00f5ff',
      secondaryColor: '#ff00ff',
      backgroundColor: '#0a0a0f',
      textColor: '#ffffff',
      fontFamily: 'system-ui',
    },
    animationStyle: 'bold',
    previewColors: ['#00f5ff', '#ff00ff', '#0a0a0f', '#ffffff'],
  },
  {
    id: 'midnight-executive',
    name: 'Midnight Executive',
    description: 'Premium, corporate, trustworthy',
    category: 'dark',
    theme: {
      primaryColor: '#4f9cf9',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#1a1a2e',
      textColor: '#e0e0e0',
      fontFamily: 'system-ui',
    },
    animationStyle: 'moderate',
    previewColors: ['#4f9cf9', '#8b5cf6', '#1a1a2e', '#e0e0e0'],
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Cinematic, inspiring, dark backgrounds',
    category: 'dark',
    theme: {
      primaryColor: '#ffd700',
      secondaryColor: '#ff6b6b',
      backgroundColor: '#0d1117',
      textColor: '#c9d1d9',
      fontFamily: 'system-ui',
    },
    animationStyle: 'moderate',
    previewColors: ['#ffd700', '#ff6b6b', '#0d1117', '#c9d1d9'],
  },
  {
    id: 'terminal-green',
    name: 'Terminal Green',
    description: 'Developer-focused, monospace feel',
    category: 'dark',
    theme: {
      primaryColor: '#00ff41',
      secondaryColor: '#00d4ff',
      backgroundColor: '#0d2818',
      textColor: '#00ff41',
      fontFamily: 'monospace',
    },
    animationStyle: 'subtle',
    previewColors: ['#00ff41', '#00d4ff', '#0d2818', '#00ff41'],
  },
  
  // Light Themes
  {
    id: 'paper-ink',
    name: 'Paper & Ink',
    description: 'Editorial, literary, refined',
    category: 'light',
    theme: {
      primaryColor: '#1a1a1a',
      secondaryColor: '#8b4513',
      backgroundColor: '#faf8f3',
      textColor: '#2c2c2c',
      fontFamily: 'Georgia, serif',
    },
    animationStyle: 'subtle',
    previewColors: ['#1a1a1a', '#8b4513', '#faf8f3', '#2c2c2c'],
  },
  {
    id: 'swiss-modern',
    name: 'Swiss Modern',
    description: 'Clean, Bauhaus-inspired, geometric',
    category: 'light',
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#ff0000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'Helvetica, sans-serif',
    },
    animationStyle: 'moderate',
    previewColors: ['#000000', '#ff0000', '#ffffff', '#000000'],
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    description: 'Friendly, playful, creative',
    category: 'light',
    theme: {
      primaryColor: '#ff6b9d',
      secondaryColor: '#c44569',
      backgroundColor: '#fff5f7',
      textColor: '#4a4a4a',
      fontFamily: 'system-ui',
    },
    animationStyle: 'moderate',
    previewColors: ['#ff6b9d', '#c44569', '#fff5f7', '#4a4a4a'],
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    description: 'Magazine-style, photographic',
    category: 'light',
    theme: {
      primaryColor: '#d4a574',
      secondaryColor: '#8b6f47',
      backgroundColor: '#fef9f3',
      textColor: '#3d3d3d',
      fontFamily: 'system-ui',
    },
    animationStyle: 'subtle',
    previewColors: ['#d4a574', '#8b6f47', '#fef9f3', '#3d3d3d'],
  },
  
  // Specialty Themes
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw, bold, attention-grabbing',
    category: 'specialty',
    theme: {
      primaryColor: '#ff0000',
      secondaryColor: '#000000',
      backgroundColor: '#ffff00',
      textColor: '#000000',
      fontFamily: 'system-ui',
    },
    animationStyle: 'bold',
    previewColors: ['#ff0000', '#000000', '#ffff00', '#000000'],
  },
  {
    id: 'gradient-wave',
    name: 'Gradient Wave',
    description: 'Modern SaaS aesthetic',
    category: 'specialty',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    },
    animationStyle: 'moderate',
    previewColors: ['#6366f1', '#8b5cf6', '#ffffff', '#1f2937'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Ultra-clean, maximum readability',
    category: 'specialty',
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui',
    },
    animationStyle: 'subtle',
    previewColors: ['#3b82f6', '#64748b', '#ffffff', '#1f2937'],
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): StylePreset | undefined {
  return stylePresets.find(preset => preset.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: 'dark' | 'light' | 'specialty'): StylePreset[] {
  return stylePresets.filter(preset => preset.category === category);
}

/**
 * Get default preset
 */
export function getDefaultPreset(): StylePreset {
  return stylePresets.find(p => p.id === 'minimalist') || stylePresets[0];
}
