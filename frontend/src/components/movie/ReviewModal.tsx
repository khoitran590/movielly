'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import StarRating from './StarRating';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  rating: number;
  onRatingChange: (value: number) => void;
  content: string;
  onContentChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
}

export default function ReviewModal({
  open,
  onClose,
  editing,
  rating,
  onRatingChange,
  content,
  onContentChange,
  saving,
  onSave,
}: ReviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit your review' : 'Write a review'}>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-ui text-fog">Rating</p>
          <StarRating value={rating} onChange={onRatingChange} size="lg" />
        </div>
        <div>
          <label htmlFor="review-body" className="mb-2 block text-ui text-fog">Review (optional)</label>
          <textarea
            id="review-body"
            value={content}
            onChange={e => onContentChange(e.target.value)}
            rows={4}
            placeholder="What did you think?"
            className="w-full resize-none rounded-xl border border-rail bg-seat p-3 text-body text-screen placeholder-fog outline-none transition-colors focus:border-tungsten focus:ring-2 focus:ring-tungsten/25"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={onSave}>Save review</Button>
        </div>
      </div>
    </Modal>
  );
}
