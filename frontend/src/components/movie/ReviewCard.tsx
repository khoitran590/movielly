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

export default function ReviewCard({ review, isOwn, onEdit, onDelete }: ReviewCardProps) {
  const username = review.profiles?.username || 'Anonymous';
  const initial = username[0]?.toUpperCase() || '?';

  return (
    <div className="bg-surface-700 border border-surface-600 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
            {review.profiles?.avatar_url ? (
              <img src={review.profiles.avatar_url} alt={username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-brand-light">{initial}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{username}</p>
            <p className="text-xs text-slate-500">{timeAgo(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size="sm" max={10} />
          {isOwn && (
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-brand-light transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {review.content && (
        <p className="text-sm text-slate-300 leading-relaxed">{review.content}</p>
      )}
    </div>
  );
}
