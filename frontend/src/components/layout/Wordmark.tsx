import Link from 'next/link';

// Bodoni italic and a tungsten ticket-stub punch. Never a clapperboard.
export default function Wordmark({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Movielly — home"
      className={`focus-ring flex shrink-0 items-center gap-2.5 rounded-full ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 bg-tungsten" />
      <span className="font-display text-wordmark italic text-screen">Movielly</span>
    </Link>
  );
}
