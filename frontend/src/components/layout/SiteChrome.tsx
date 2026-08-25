'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SideRail from './SideRail';
import SiteDockNav from './SiteDockNav';
import { useAuth } from '@/context/AuthContext';

// Auth is immersive: no top bar, no footer, no dock. The auth pages carry
// their own wordmark back to home.
const BARE_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.includes(pathname);
  const { user } = useAuth();
  const [railExpanded, setRailExpanded] = useState(false);

  useEffect(() => {
    setRailExpanded(localStorage.getItem('movielly:rail-expanded') === 'true');
  }, []);

  const updateRail = (expanded: boolean) => {
    setRailExpanded(expanded);
    localStorage.setItem('movielly:rail-expanded', String(expanded));
  };

  if (bare) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <SideRail expanded={railExpanded} onExpandedChange={updateRail} />
      <div className={`transition-[margin] duration-200 ${railExpanded ? 'lg:ml-[200px]' : 'lg:ml-[72px]'}`}>
        <Navbar />
        <main id="main" className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className={`border-t border-rail py-8 ${user ? 'pb-24 md:pb-8' : 'pb-8'}`}>
          <div className="mx-auto max-w-7xl px-5 text-center text-meta text-fog sm:px-8">
            <p>© {new Date().getFullYear()} Movielly. Movie data from TMDB.</p>
          </div>
        </footer>
      </div>
      <SiteDockNav />
    </>
  );
}
