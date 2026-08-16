'use client';

import { useEffect, useState } from 'react';

// Matches a CSS media query. Starts `false` on the server and on the first
// client render so SSR markup and hydration agree; the real value lands in the
// effect. Callers that must not render on desktop should render nothing until
// this is true.
export function useMedia(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMedia('(max-width: 767px)');
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');
export const useFinePointer = () => useMedia('(pointer: fine)');
