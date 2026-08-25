'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import ThemeToggle from './ThemeToggle';
import Wordmark from './Wordmark';

// Public mobile chrome: discovery first, with explicit account entry points.
// App-only section navigation belongs to MobileAppHeader + SiteDockNav.
export default function MobileWebHeader() {
  return (
    <div className="mx-auto max-w-7xl space-y-3 px-4 py-3">
      <div className="flex min-h-10 items-center justify-between gap-1">
        <Wordmark />
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Link
            href="/login"
            className="focus-ring rounded-full px-2.5 py-2 text-ui font-medium text-fog transition-colors hover:text-screen"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="focus-ring rounded-full bg-tungsten px-3 py-2 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim"
          >
            Sign up
          </Link>
        </div>
      </div>
      <Suspense fallback={<div className="h-9 w-full animate-pulse rounded-full bg-velvet" />}>
        <SearchBar />
      </Suspense>
    </div>
  );
}
