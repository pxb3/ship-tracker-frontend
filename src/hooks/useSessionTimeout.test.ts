import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from './useSessionTimeout';

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts as not expired', () => {
    const { result } = renderHook(() => useSessionTimeout(1000));
    expect(result.current).toBe(false);
  });

  it('becomes expired after the timeout elapses', () => {
    const { result } = renderHook(() => useSessionTimeout(1000));

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('resets the timer when unmounted before expiry', () => {
    const { unmount } = renderHook(() => useSessionTimeout(1000));
    const clearSpy = vi.spyOn(global, 'clearTimeout');
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
