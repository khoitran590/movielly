import { Trash2, Pencil } from 'lucide-react';
import StarRating from './StarRating';
import type { Review } from '@/types';

// lightweight date formatter without date-fns dependency
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ReviewCardProps {
  review: Review;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-velvet';

export default function ReviewCard({ review, isOwn, onEdit, onDelete }: ReviewCardProps) {
  const username = review.profiles?.username || 'Anonymous';
  const initial = username[0]?.toUpperCase() || '?';

  return (
    <article className="space-y-3 rounded-panel border border-rail bg-velvet p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-seat">
            {review.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-ui font-medium text-fog">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-ui font-medium text-screen">{username}</p>
            <p className="font-mono text-[11px] text-fog">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size="sm" max={10} />
          {isOwn && (
            <div className="ml-2 flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Edit your review"
                  className={`rounded-full p-1.5 text-fog transition-colors hover:bg-seat hover:text-screen ${focusRing}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  aria-label="Delete your review"
                  className={`rounded-full p-1.5 text-fog transition-colors hover:bg-ticket/10 hover:text-ticket ${focusRing}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {review.content && <p className="text-body text-screen">{review.content}</p>}
    </article>
  );
}
