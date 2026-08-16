'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

// Route-level error boundary: catches render/data errors inside any page,
// reports them to Sentry, and offers a retry instead of a white screen.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center">
      <h2 className="font-display text-display-md text-screen">The reel snapped.</h2>
      <p className="max-w-md text-body text-fog">
        Something broke on our end. It has been reported.
      </p>
      <div className="mt-2 flex gap-3">
        <Button variant="primary" onClick={reset}>Try again</Button>
        <a href="/">
          <Button variant="secondary">Go home</Button>
        </a>
      </div>
    </div>
  );
}
