'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';
import Wordmark from './Wordmark';

export default function Navbar() {
  const { user, username, avatarUrl, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-rail bg-ink/95">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 py-3 md:grid-cols-[1fr_minmax(260px,520px)_1fr]">
          <Wordmark onClick={() => setMenuOpen(false)} className="lg:hidden" />
          <div className="col-span-2 row-start-2 w-full md:col-span-1 md:col-start-2 md:row-start-1">
            <Suspense fallback={<div className="h-9 w-full animate-pulse rounded-full bg-velvet" />}>
              <SearchBar onNavigate={() => setMenuOpen(false)} />
            </Suspense>
          </div>

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 md:col-start-3 lg:hidden">
            {user ? (
              <span className="relative h-8 w-8 overflow-hidden rounded-full border border-rail">
                {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><User className="h-4 w-4 text-fog" /></span>}
              </span>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
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
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="focus-ring rounded-full p-2 text-fog transition-colors hover:bg-seat hover:text-screen md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile sheet — account actions only. Section links live in the dock. */}
        {menuOpen && (
          <div className="animate-fade-in space-y-2 border-t border-rail pb-4 pt-3 md:hidden">
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="truncate text-ui font-medium text-screen">@{username || '…'}</p>
                  <p className="truncate text-meta font-mono text-fog">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-fog hover:bg-seat hover:text-screen"
                >
                  <Settings className="w-4 h-4" /> Edit profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-ticket hover:bg-ticket/10"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:hidden">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="focus-ring flex-1 rounded-full border border-rail px-4 py-2 text-center text-ui text-screen">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="focus-ring flex-1 rounded-full bg-tungsten px-4 py-2 text-center text-ui font-semibold text-ink">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
