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
      <body style={{ background: '#0B0A09', color: '#F3EDE3', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 500, fontFamily: 'Georgia, serif' }}>The reel snapped.</h2>
          <p style={{ fontSize: 15, color: '#8A8278' }}>The error has been reported.</p>
          <button
            onClick={reset}
            style={{ borderRadius: 9999, background: '#E0A84A', color: '#0B0A09', padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
