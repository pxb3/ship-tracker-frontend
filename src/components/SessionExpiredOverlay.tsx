import React from 'react';

interface SessionExpiredOverlayProps {
  sessionExpired: boolean;
}

export function SessionExpiredOverlay({ sessionExpired }: SessionExpiredOverlayProps) {
  if (!sessionExpired) return null;

  return (
    <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-white p-5 rounded-lg text-center max-w-[480px] text-gray-900 dark:text-gray-900">
        <h3 className="mt-0">Session expired</h3>
        <p>Your viewing session has ended after 15 minutes. Refresh the page to continue receiving live updates.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => window.location.reload()} className="px-3 py-2">
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
