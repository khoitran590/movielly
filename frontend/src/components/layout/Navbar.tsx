'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BookmarkCheck, Heart, LogOut, User, Menu, X, Clapperboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
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
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-surface-900/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
            <Clapperboard className="w-6 h-6 text-brand" />
            <span className="text-lg font-bold text-white">Movielly</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
            <div className="glass glass-interactive relative w-full rounded-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-[1]" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies & shows..."
                className="relative z-[1] w-full bg-transparent text-slate-100 placeholder-slate-400 rounded-full py-2 pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/watchlist" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-surface-700 transition-colors">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Watchlist</span>
                </Link>
                <Link href="/favorites" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-surface-700 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
                <div ref={dropdownRef} className="relative hidden sm:block">
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-brand/20 border border-brand/40 hover:bg-brand/30 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-light" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-11 w-44 bg-surface-800 border border-surface-600 rounded-xl shadow-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-surface-600">
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand-light text-white rounded-xl transition-colors shadow-lg shadow-brand/25">
                  Sign up
                </Link>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-700 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2 border-t border-surface-600 pt-3 animate-fade-in">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search movies & shows..."
                  className="w-full bg-surface-700 border border-surface-500 text-slate-100 placeholder-slate-500 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-brand"
                />
              </div>
            </form>
            {user ? (
              <>
                <Link href="/watchlist" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-surface-700" onClick={() => setMenuOpen(false)}>
                  <BookmarkCheck className="w-4 h-4" /> Watchlist
                </Link>
                <Link href="/favorites" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-surface-700" onClick={() => setMenuOpen(false)}>
                  <Heart className="w-4 h-4" /> Favorites
                </Link>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-surface-700"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm text-slate-300 bg-surface-700" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/signup" className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-brand text-white" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
