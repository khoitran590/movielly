'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SiteDockNav from './SiteDockNav';

// Auth is immersive: no top bar, no footer, no dock. The auth pages carry
// their own wordmark back to home.
const BARE_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.includes(pathname);

  if (bare) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main id="main" className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      {/* pb-24 clears the mobile dock; the dock is gone on desktop. */}
      <footer className="border-t border-rail py-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 text-center text-meta text-fog">
          <p>© {new Date().getFullYear()} Movielly. Movie data from TMDB.</p>
        </div>
      </footer>
      <SiteDockNav />
    </>
  );
}
