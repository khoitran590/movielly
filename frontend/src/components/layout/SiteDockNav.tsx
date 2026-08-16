'use client';

import { usePathname } from 'next/navigation';
import { Home, BookmarkCheck, Heart, Users } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { useIsMobile } from '@/hooks/useMedia';

// `/watchlist` stays as the route so shared links keep working; the visible
// word is Watched, because that is what the feature is.
const NAV_ITEMS = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Watched', url: '/watchlist', icon: BookmarkCheck },
  { name: 'Favorites', url: '/favorites', icon: Heart },
  { name: 'Friends', url: '/friends', icon: Users },
];

// Full-screen sandbox routes have their own layout — no dock there.
const HIDDEN_ON = ['/liquid-glass', '/lamp', '/aurora', '/beams'];

// Phone-only quick-nav. On desktop the top bar is the only chrome, so the dock
// is never mounted.
export default function SiteDockNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile || HIDDEN_ON.includes(pathname)) return null;

  return <NavBar items={NAV_ITEMS} />;
}
