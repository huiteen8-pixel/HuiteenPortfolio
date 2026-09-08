'use client';

import { useEffect, useState } from 'react';

/**
 * Hydration-safe reduced-motion preference.
 * The server and first client render both return false; the real preference is
 * applied immediately after hydration and kept in sync with system changes.
 */
export function usePrefersReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setShouldReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return shouldReduceMotion;
}
