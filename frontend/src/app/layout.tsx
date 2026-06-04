import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
            <footer className="border-t border-surface-600 py-8 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500">
                <p>© {new Date().getFullYear()} Movielly. Movie data from TMDB.</p>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
