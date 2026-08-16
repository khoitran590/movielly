'use client';

import ReviewCard from './ReviewCard';
import Button from '@/components/ui/Button';
import type { Review } from '@/types';

interface ReviewsSectionProps {
  reviews: Review[];
  currentUserId?: string;
  onWrite: () => void;
  onDelete: () => void;
}

export default function ReviewsSection({ reviews, currentUserId, onWrite, onDelete }: ReviewsSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
        Reviews{reviews.length > 0 && <span className="ml-2 font-mono normal-case tracking-normal">{reviews.length}</span>}
      </h2>

      {reviews.length === 0 ? (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-body text-fog">No one has written about this yet.</p>
          <Button variant="primary" size="sm" onClick={onWrite}>Write a review</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.user_id === currentUserId}
              onEdit={onWrite}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
