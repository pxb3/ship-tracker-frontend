import { useEffect, useState } from 'react';

/**
 * Track page visibility state (visible/hidden)
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const onVisibility = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return isVisible;
}
