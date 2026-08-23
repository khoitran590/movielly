'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogIn, LogOut, Settings, User, UserPlus } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';
import { useFriendRequestCount } from '@/hooks/useFriendRequestCount';
import Wordmark from './Wordmark';

export default function SideRail({
  expanded,
  onExpandedChange,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, username, avatarUrl, signOut } = useAuth();
  const requestCount = useFriendRequestCount();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 hidden border-r border-rail bg-ink lg:flex lg:flex-col ${
        expanded ? 'w-[200px]' : 'w-[72px]'
      }`}
      aria-label="Primary navigation"
    >
      <div className={`flex h-16 items-center border-b border-rail ${expanded ? 'px-5' : 'justify-center'}`}>
        {expanded ? (
          <Wordmark />
        ) : (
          <Link href="/" aria-label="Movielly — home" className="focus-ring rounded-full p-2">
            <span aria-hidden className="block h-2.5 w-2.5 bg-tungsten" />
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-5" aria-label="Sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.url;
          const badge = item.url === '/friends' && requestCount > 0 ? requestCount : 0;
          return (
            <Link
              key={item.url}
              href={item.url}
              title={expanded ? undefined : item.name}
              aria-current={active ? 'page' : undefined}
              className={`focus-ring relative flex h-11 items-center rounded-lg transition-colors ${
                expanded ? 'gap-3 px-3' : 'justify-center'
              } ${active ? 'text-screen' : 'text-fog hover:bg-seat hover:text-screen'}`}
            >
              {active && <span aria-hidden className="absolute -left-2 h-6 w-0.5 bg-tungsten" />}
              <span className="relative shrink-0">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ticket px-1 text-caption font-semibold leading-none text-ink"
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {expanded && <span className="text-ui font-medium">{item.name}</span>}
              {badge > 0 && (
                <span className="sr-only">{badge} pending friend {badge === 1 ? 'request' : 'requests'}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-rail p-2">
        {user ? (
          <>
            <div className={`flex items-center py-2 ${expanded ? 'gap-3 px-2' : 'justify-center'}`}>
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-rail">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center"><User className="h-4 w-4 text-fog" /></span>
                )}
              </span>
              {expanded && <span className="min-w-0 truncate text-ui text-screen">@{username || '…'}</span>}
            </div>
            <Link
              href="/settings"
              title={expanded ? undefined : 'Edit profile'}
              className={`focus-ring flex h-10 items-center rounded-lg text-fog hover:bg-seat hover:text-screen ${expanded ? 'gap-3 px-3' : 'justify-center'}`}
            >
              <Settings className="h-4 w-4" />
              {expanded && <span className="text-ui">Edit profile</span>}
            </Link>
            <button
              type="button"
              title={expanded ? undefined : 'Sign out'}
              onClick={() => void signOut()}
              className={`focus-ring flex h-10 w-full items-center rounded-lg text-fog hover:bg-seat hover:text-screen ${expanded ? 'gap-3 px-3' : 'justify-center'}`}
            >
              <LogOut className="h-4 w-4" />
              {expanded && <span className="text-ui">Sign out</span>}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" title={expanded ? undefined : 'Log in'} className={`focus-ring flex h-10 items-center rounded-lg text-fog hover:bg-seat hover:text-screen ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
              <LogIn className="h-4 w-4" />{expanded && <span className="text-ui">Log in</span>}
            </Link>
            <Link href="/signup" title={expanded ? undefined : 'Sign up'} className={`focus-ring flex h-10 items-center rounded-lg text-tungsten hover:bg-seat ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
              <UserPlus className="h-4 w-4" />{expanded && <span className="text-ui">Sign up</span>}
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          className="focus-ring flex h-10 w-full items-center justify-center rounded-lg text-fog hover:bg-seat hover:text-screen"
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
