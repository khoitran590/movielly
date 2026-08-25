'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import MobileAppHeader from './MobileAppHeader';
import MobileWebHeader from './MobileWebHeader';

export default function Navbar() {
  const { user, avatarUrl, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-rail bg-ink/95">
      <div className="md:hidden">
        {loading ? (
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3" aria-label="Loading navigation">
            <div className="flex h-10 items-center justify-between"><Wordmark /><div className="h-8 w-24 animate-pulse rounded-full bg-velvet" /></div>
            <div className="h-9 w-full animate-pulse rounded-full bg-velvet" />
          </div>
        ) : user ? <MobileAppHeader /> : <MobileWebHeader />}
      </div>

      <div className="mx-auto hidden max-w-7xl px-8 md:block">
        <div className="grid grid-cols-[1fr_minmax(260px,520px)_1fr] items-center gap-x-4 py-3">
          <Wordmark className="lg:hidden" />
          <div className="col-start-2 row-start-1 w-full">
            <Suspense fallback={<div className="h-9 w-full animate-pulse rounded-full bg-velvet" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="col-start-3 row-start-1 flex items-center justify-end gap-2 lg:hidden">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-full bg-velvet" />
            ) : user ? (
              <span className="relative h-8 w-8 overflow-hidden rounded-full border border-rail">
                {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><User className="h-4 w-4 text-fog" /></span>}
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="focus-ring rounded-full px-3 py-2 text-ui font-medium text-fog transition-colors hover:text-screen"
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
