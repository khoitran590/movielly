'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, LogOut, User, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Wordmark from './Wordmark';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export default function Navbar() {
  const { user, username, avatarUrl, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Home carries its own search under the hero, so the bar one is hidden there.
  const showSearch = pathname !== '/';
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-rail bg-ink/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Wordmark onClick={() => setMenuOpen(false)} />

          {showSearch ? (
            <form onSubmit={handleSearch} className="hidden flex-1 justify-center md:flex">
              <div className="relative w-full max-w-[420px]">
                <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-fog" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Search a film or series"
                  placeholder="Search a film or series"
                  className={`w-full rounded-full border border-rail bg-velvet py-2 pl-10 pr-4 text-ui text-screen placeholder-fog outline-none transition-colors focus:border-tungsten ${focusRing}`}
                />
              </div>
            </form>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}

          <div className="flex items-center gap-2">
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                  className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-rail transition-colors hover:border-screen ${focusRing}`}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-fog" />
                  )}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-11 w-52 overflow-hidden rounded-lg border border-rail bg-velvet">
                    <div className="border-b border-rail px-3 py-2.5">
                      <p className="truncate text-ui font-medium text-screen">@{username || '…'}</p>
                      <p className="truncate text-meta font-mono text-fog">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-ui text-fog transition-colors hover:bg-seat hover:text-screen ${focusRing}`}
                    >
                      <Settings className="w-4 h-4" />
                      Edit profile
                    </Link>
                    <button
                      onClick={() => { signOut(); setDropdownOpen(false); }}
                      className={`flex w-full items-center gap-2 border-t border-rail px-3 py-2.5 text-ui text-fog transition-colors hover:bg-seat hover:text-screen ${focusRing}`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className={`rounded-full px-4 py-2 text-ui font-medium text-fog transition-colors hover:text-screen ${focusRing}`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-full bg-tungsten px-4 py-2 text-ui font-semibold text-ink transition-colors hover:bg-tungsten-dim ${focusRing}`}
                >
                  Sign up
                </Link>
              </div>
            )}
            {(showSearch || user) && (
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className={`rounded-full p-2 text-fog transition-colors hover:bg-seat hover:text-screen md:hidden ${focusRing}`}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile sheet — search plus account actions. The four section links
            live in the dock, so they are not repeated here. */}
        {menuOpen && (
          <div className="animate-fade-in space-y-2 border-t border-rail pb-4 pt-3 md:hidden">
            {showSearch && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-fog" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    aria-label="Search a film or series"
                    placeholder="Search a film or series"
                    className={`w-full rounded-full border border-rail bg-velvet py-2 pl-9 pr-4 text-ui text-screen placeholder-fog outline-none focus:border-tungsten ${focusRing}`}
                  />
                </div>
              </form>
            )}
            {user && (
              <>
                <div className="px-3 py-2">
                  <p className="truncate text-ui font-medium text-screen">@{username || '…'}</p>
                  <p className="truncate text-meta font-mono text-fog">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-fog hover:bg-seat hover:text-screen ${focusRing}`}
                >
                  <Settings className="w-4 h-4" /> Edit profile
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-ui text-ticket hover:bg-ticket/10 ${focusRing}`}
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
