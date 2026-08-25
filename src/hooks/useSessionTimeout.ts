import { useEffect, useState } from 'react';

/**
 * Track session timeout state
 */
export function useSessionTimeout(timeoutMs: number): boolean {
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setSessionExpired(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  return sessionExpired;
}
