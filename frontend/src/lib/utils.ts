import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn-style class combiner: clsx for conditionals, tailwind-merge so
// later Tailwind classes override earlier conflicting ones.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Compact relative time ("just now", "3h", "2d", "5w") for feeds and activity.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 52) return `${weeks}w`;
  return `${Math.round(days / 365)}y`;
}
