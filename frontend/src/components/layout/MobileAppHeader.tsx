'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';
import ThemeToggle from './ThemeToggle';
import Wordmark from './Wordmark';

// Signed-in mobile chrome: global search stays at the top while the four
// primary app destinations remain thumb-reachable in SiteDockNav.
export default function MobileAppHeader() {
  const { user, username, avatarUrl, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 py-3">
        <Wordmark onClick={() => setMenuOpen(false)} />
        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <span className="relative h-8 w-8 overflow-hidden rounded-full border border-rail">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center"><User className="h-4 w-4 text-fog" /></span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
            aria-expanded={menuOpen}
            className="focus-ring rounded-full p-2 text-fog transition-colors hover:bg-seat hover:text-screen"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="col-span-2 w-full">
          <Suspense fallback={<div className="h-9 w-full animate-pulse rounded-full bg-velvet" />}>
            <SearchBar onNavigate={() => setMenuOpen(false)} />
          </Suspense>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-fade-in space-y-2 border-t border-rail pb-4 pt-3">
          <div className="px-3 py-2">
            <p className="truncate text-ui font-medium text-screen">@{username || '…'}</p>
            <p className="truncate font-mono text-meta text-fog">{user?.email}</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-fog hover:bg-seat hover:text-screen"
          >
            <Settings className="h-4 w-4" /> Edit profile
          </Link>
          <button
            type="button"
            onClick={() => { void signOut(); setMenuOpen(false); }}
            className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-ticket hover:bg-ticket/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
