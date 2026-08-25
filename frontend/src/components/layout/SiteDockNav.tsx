'use client';

import { NAV_ITEMS } from '@/lib/nav';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { useIsMobile } from '@/hooks/useMedia';
import { useFriendRequestCount } from '@/hooks/useFriendRequestCount';
import { useAuth } from '@/context/AuthContext';

// Signed-in phone-only quick-nav. Public mobile visitors use the website
// header instead; larger screens use the side rail/top bar.
export default function SiteDockNav() {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const requestCount = useFriendRequestCount();

  if (!isMobile || loading || !user) return null;

  return <NavBar items={NAV_ITEMS} badges={{ '/friends': requestCount }} />;
}
