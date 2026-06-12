'use client';

import { usePathname } from 'next/navigation';
import { Home, BookmarkCheck, Heart, Users } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';

const NAV_ITEMS = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Watchlist', url: '/watchlist', icon: BookmarkCheck },
  { name: 'Favorites', url: '/favorites', icon: Heart },
  { name: 'Friends', url: '/friends', icon: Users },
];

// Auth + full-screen demo pages have their own layout — no dock there.
const HIDDEN_ON = ['/login', '/signup', '/forgot-password', '/reset-password', '/liquid-glass', '/lamp', '/aurora', '/beams'];

// App quick-nav using the tubelight navbar. Forced to the bottom on all
// breakpoints (the component defaults to top on desktop) so it doesn't collide
// with the existing top Navbar.
export default function SiteDockNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return <NavBar items={NAV_ITEMS} className="sm:top-auto sm:bottom-0 sm:mb-6 sm:pt-0" />;
}
