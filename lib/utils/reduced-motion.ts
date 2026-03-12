/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook-like function to get reduced motion preference
 * Can be used in components
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check initial preference
  let prefersReduced = prefersReducedMotion();
  
  // Listen for changes (for dynamic updates)
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', () => {
      prefersReduced = mediaQuery.matches;
    });
  }
  
  return prefersReduced;
}

/**
 * Get animation duration multiplier based on reduced motion
 * Returns 0 for reduced motion (instant), 1 for normal
 */
export function getAnimationDuration(multiplier: number = 1): number {
  return prefersReducedMotion() ? 0 : multiplier;
}
