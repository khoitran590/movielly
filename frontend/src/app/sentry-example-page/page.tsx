'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';

class SentryExampleFrontendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SentryExampleFrontendError';
  }
}

export default function Page() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== 'sentry-unreachable');
    }
    checkConnectivity();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold text-white">Sentry test page</h1>
      <p className="text-slate-400 max-w-md">
        Click the button to throw a sample error and confirm it shows up on your{' '}
        <a
          href="https://peter-tran-e2.sentry.io/issues/?project=4511525872730112"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-light underline"
        >
          Sentry Issues page
        </a>
        .
      </p>
      <button
        type="button"
        disabled={!isConnected}
        onClick={async () => {
          await Sentry.startSpan({ name: 'Example Frontend/Backend Span', op: 'test' }, async () => {
            const res = await fetch('/api/sentry-example-api');
            if (!res.ok) setHasSentError(true);
          });
          throw new SentryExampleFrontendError('This error is raised on the frontend of the example page.');
        }}
        className="rounded-xl bg-brand hover:bg-brand-light disabled:opacity-50 text-white font-medium px-6 py-3 transition-colors"
      >
        Throw Sample Error
      </button>
      {hasSentError ? (
        <p className="text-green-400">Error sent to Sentry.</p>
      ) : !isConnected ? (
        <p className="text-red-400 max-w-md">
          Network requests to Sentry are being blocked (likely an ad-blocker). Disable it to complete the test.
        </p>
      ) : null}
    </div>
  );
}
