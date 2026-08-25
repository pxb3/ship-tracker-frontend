import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from './usePageVisibility';

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

describe('usePageVisibility', () => {
  afterEach(() => {
    setVisibilityState('visible');
  });

  it('reflects the initial document.visibilityState', () => {
    setVisibilityState('hidden');
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });

  it('updates when a visibilitychange event fires', () => {
    setVisibilityState('visible');
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    act(() => {
      setVisibilityState('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);

    act(() => {
      setVisibilityState('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(true);
  });
});
