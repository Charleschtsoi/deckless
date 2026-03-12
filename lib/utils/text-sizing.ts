/**
 * Utility functions for dynamic text sizing based on content length
 */

/**
 * Calculate word count from text content
 */
export function getWordCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate character count from text content
 */
export function getCharCount(text: string): number {
  if (!text) return 0;
  return text.trim().length;
}

/**
 * Get appropriate text size class for title based on content length
 */
export function getTitleSizeClass(title: string): string {
  if (!title) return 'text-4xl sm:text-5xl md:text-6xl';
  
  const wordCount = getWordCount(title);
  
  // Very short titles (1-5 words): Large
  if (wordCount <= 5) {
    return 'text-4xl sm:text-5xl md:text-6xl';
  }
  
  // Short titles (6-10 words): Medium-large
  if (wordCount <= 10) {
    return 'text-3xl sm:text-4xl md:text-5xl';
  }
  
  // Longer titles (11+ words): Medium
  return 'text-2xl sm:text-3xl md:text-4xl';
}

/**
 * Get appropriate text size class for content based on length
 */
export function getContentSizeClass(content: string): string {
  if (!content) return 'text-xl sm:text-2xl md:text-3xl';
  
  const wordCount = getWordCount(content);
  
  // Short content (≤30 words): Large
  if (wordCount <= 30) {
    return 'text-xl sm:text-2xl md:text-3xl';
  }
  
  // Medium content (31-60 words): Medium-large
  if (wordCount <= 60) {
    return 'text-lg sm:text-xl md:text-2xl';
  }
  
  // Long content (61-100 words): Medium
  if (wordCount <= 100) {
    return 'text-base sm:text-lg md:text-xl';
  }
  
  // Very long content (101-150 words): Small-medium
  if (wordCount <= 150) {
    return 'text-sm sm:text-base md:text-lg';
  }
  
  // Extremely long content (>150 words): Small (minimum readable size)
  return 'text-xs sm:text-sm md:text-base';
}

/**
 * Get appropriate line height class based on content length
 */
export function getLineHeightClass(content: string): string {
  if (!content) return 'leading-relaxed';
  
  const wordCount = getWordCount(content);
  
  // Longer content needs tighter line height
  if (wordCount > 100) {
    return 'leading-tight';
  }
  
  if (wordCount > 60) {
    return 'leading-normal';
  }
  
  return 'leading-relaxed';
}

/**
 * Check if content is too long and might need scrolling
 */
export function isContentTooLong(content: string): boolean {
  return getWordCount(content) > 150;
}
