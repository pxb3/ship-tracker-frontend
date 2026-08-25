import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoundingBox } from './useBoundingBox';

describe('useBoundingBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with null bounding boxes', () => {
    const { result } = renderHook(() => useBoundingBox());
    expect(result.current.rawBBox).toBeNull();
    expect(result.current.debouncedBBox).toBeNull();
  });

  it('updates rawBBox immediately but debounces debouncedBBox', () => {
    const { result } = renderHook(() => useBoundingBox(500));
    const bbox = { minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 };

    act(() => {
      result.current.setRawBBox(bbox);
    });

    expect(result.current.rawBBox).toEqual(bbox);
    expect(result.current.debouncedBBox).toBeNull();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.debouncedBBox).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedBBox).toEqual(bbox);
  });

  it('resets debouncedBBox to null when rawBBox is cleared', () => {
    const { result } = renderHook(() => useBoundingBox(500));
    const bbox = { minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 };

    act(() => {
      result.current.setRawBBox(bbox);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.debouncedBBox).toEqual(bbox);

    act(() => {
      result.current.setRawBBox(null);
    });
    expect(result.current.debouncedBBox).toBeNull();
  });
});
