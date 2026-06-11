'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BookmarkCheck, Heart, Users } from 'lucide-react';
import { GlassEffect, GlassFilter } from '@/components/ui/liquid-glass';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/friends', label: 'Friends', icon: Users },
] as const;

// Auth pages have their own full-screen layout — no dock there.
const HIDDEN_ON = ['/login', '/signup', '/forgot-password', '/reset-password', '/liquid-glass'];

// Floating liquid-glass quick-nav dock, fixed to the bottom of the viewport.
export default function GlassDockNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <>
      <GlassFilter />
      <nav aria-label="Quick navigation" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <GlassEffect className="rounded-3xl p-1.5">
          <div className="flex items-center gap-1">
            {ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  title={label}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'text-slate-100/90 hover:bg-white/15 hover:text-white hover:scale-110'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </GlassEffect>
      </nav>
    </>
  );
}
