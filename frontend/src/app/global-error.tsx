'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Last-resort boundary: catches errors thrown by the root layout itself,
// where app/error.tsx can't render. Must provide its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#070c16', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>The error has been reported.</p>
          <button
            onClick={reset}
            style={{ borderRadius: 9999, background: '#3b82f6', color: '#fff', padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
