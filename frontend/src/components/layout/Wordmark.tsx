import Link from 'next/link';

// Bodoni italic and a tungsten ticket-stub punch. Never a clapperboard.
export default function Wordmark({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Movielly — home"
      className={`flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 bg-tungsten" />
      <span className="font-display text-[22px] italic leading-none text-screen">Movielly</span>
    </Link>
  );
}
