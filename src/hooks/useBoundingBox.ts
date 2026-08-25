import { useEffect, useState } from 'react';

export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/**
 * Manage debounced bounding box state
 */
export function useBoundingBox(debounceMs: number = 500) {
  const [rawBBox, setRawBBox] = useState<BoundingBox | null>(null);
  const [debouncedBBox, setDebouncedBBox] = useState<BoundingBox | null>(null);

  useEffect(() => {
    if (!rawBBox) {
      setDebouncedBBox(null);
      return;
    }
    const timer = setTimeout(() => setDebouncedBBox(rawBBox), debounceMs);
    return () => clearTimeout(timer);
  }, [rawBBox, debounceMs]);

  return { rawBBox, setRawBBox, debouncedBBox };
}
