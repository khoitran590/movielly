import PosterWall from './PosterWall';

// Two-pane auth layout: form on the left, scrolling movie posters on the right.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
      {/* Left — form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </div>

      {/* Right — poster wall (desktop only) */}
      <div className="relative hidden lg:block overflow-hidden border-l border-surface-600 bg-surface-900">
        <PosterWall />

        {/* Fades: darken left edge for seam, vignette top/bottom */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-surface-900/40 to-surface-900" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-900/90 via-transparent to-surface-900/70" />

        {/* Tagline */}
        <div className="pointer-events-none absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Thousands of films.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">One watchlist.</span>
          </h2>
          <p className="mt-3 text-slate-300">
            Discover movies & shows, rate them, write reviews, and share your favorites with friends.
          </p>
        </div>
      </div>
    </div>
  );
}
