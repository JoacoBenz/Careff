'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RegionValue } from './region-select';

const STORAGE_KEY = 'careff-region';

/**
 * Holds the trip's region. Logged-in callers pass their saved profile default
 * as `initial`; guests get it persisted to localStorage so it sticks across
 * visits on that device.
 */
export function useRegion(initial?: RegionValue): [RegionValue, (r: RegionValue) => void] {
  const [region, setRegionState] = useState<RegionValue>(initial ?? { country: 'ar' });

  // Guests: hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    if (initial) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Post-mount sync from a browser-only store (the documented exception to
      // the no-setState-in-effect rule); reading at render would break SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setRegionState(JSON.parse(raw) as RegionValue);
    } catch {
      // ignore malformed/blocked storage
    }
  }, [initial]);

  const setRegion = useCallback((r: RegionValue) => {
    setRegionState(r);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {
      // ignore blocked storage
    }
  }, []);

  return [region, setRegion];
}
