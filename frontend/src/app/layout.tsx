import type { Metadata } from 'next';
import { Bodoni_Moda, IBM_Plex_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Providers from '@/components/Providers';
import { ToastProvider } from '@/components/ui/Toast';
import SiteChrome from '@/components/layout/SiteChrome';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni-moda',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Movielly — Discover, Review & Share Movies',
  description: 'Search movies and TV shows, write reviews, build your watchlist, and share your favorites.',
};

const themeScript = `(function(){try{var saved=localStorage.getItem('movielly:theme');var theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(theme)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${manrope.variable} ${bodoniModa.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
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
