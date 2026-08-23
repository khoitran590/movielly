'use client';

import { NAV_ITEMS } from '@/lib/nav';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { useIsMobile } from '@/hooks/useMedia';
import { useFriendRequestCount } from '@/hooks/useFriendRequestCount';

// Phone-only quick-nav. On desktop the top bar is the only chrome, so the dock
// is never mounted.
export default function SiteDockNav() {
  const isMobile = useIsMobile();
  const requestCount = useFriendRequestCount();

  if (!isMobile) return null;

  return <NavBar items={NAV_ITEMS} badges={{ '/friends': requestCount }} />;
}
