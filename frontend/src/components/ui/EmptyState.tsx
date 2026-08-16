import Link from 'next/link';
import Button from './Button';

interface EmptyStateProps {
  /** Bodoni headline. One short, specific sentence. */
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

// Empty and not-found states are direction, not decoration: a display headline,
// at most one Manrope line, one tungsten button. No 64px faded icons.
export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 text-center ${className}`}>
      <h2 className="font-display text-display-md text-screen">{title}</h2>
      {description && <p className="max-w-md text-body text-fog">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-2">
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <Button variant="primary" className="mt-2" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
