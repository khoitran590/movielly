'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { TriangleAlert } from 'lucide-react';

// Route-level error boundary: catches render/data errors inside any page,
// reports them to Sentry, and offers a retry instead of a white screen.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 px-4">
      <TriangleAlert className="w-14 h-14 text-amber-400/80" />
      <h2 className="text-xl font-semibold text-slate-100">Something went wrong</h2>
      <p className="text-sm text-slate-400 max-w-md">
        An unexpected error occurred. It has been reported — try again, or head back home.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="rounded-full bg-brand hover:bg-brand-light text-white font-medium px-5 py-2.5 text-sm transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full bg-surface-700 hover:bg-surface-600 border border-surface-500 text-slate-200 font-medium px-5 py-2.5 text-sm transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
