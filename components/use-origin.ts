'use client';

import { useEffect, useState } from 'react';

/**
 * The page origin (e.g. https://careff.app), resolved after mount. Returns ''
 * during SSR and the first client render so building share links never reads
 * window.location during render — which would cause a hydration mismatch.
 */
export function useOrigin(): string {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    // Post-mount sync of a browser-only value (documented exception to the
    // no-setState-in-effect rule).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);
  return origin;
}
