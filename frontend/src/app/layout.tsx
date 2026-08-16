import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Providers from '@/components/Providers';
import { ToastProvider } from '@/components/ui/Toast';
import SiteChrome from '@/components/layout/SiteChrome';

export const metadata: Metadata = {
  title: 'Movielly — Discover, Review & Share Movies',
  description: 'Search movies and TV shows, write reviews, build your watchlist, and share your favorites.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Display: Bodoni Moda · Body/UI: Manrope · Data: IBM Plex Mono */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500;1,6..96,600&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-tungsten focus:px-4 focus:py-2 focus:text-ui focus:font-semibold focus:text-ink"
        >
          Skip to titles
        </a>
        <Providers>
          <AuthProvider>
            <ToastProvider>
              <SiteChrome>{children}</SiteChrome>
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
