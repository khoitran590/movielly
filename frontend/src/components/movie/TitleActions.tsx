'use client';

import { Play, BookmarkPlus, BookmarkCheck, Heart, Star, ListPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TitleActionsProps {
  hasTrailer: boolean;
  onWatchTrailer: () => void;
  watched: boolean;
  onToggleWatched: () => void;
  wantToWatch: boolean;
  onToggleWantToWatch: () => void;
  favorited: boolean;
  onToggleFavorite: () => void;
  reviewRating?: number | null;
  onReview: () => void;
}

// Exactly one primary act. Everything else is a ghost that fills in when on.
export default function TitleActions({
  hasTrailer,
  onWatchTrailer,
  watched,
  onToggleWatched,
  wantToWatch,
  onToggleWantToWatch,
  favorited,
  onToggleFavorite,
  reviewRating,
  onReview,
}: TitleActionsProps) {
  return (
    <>
      {hasTrailer && (
        <Button variant="primary" onClick={onWatchTrailer}>
          <Play className="w-4 h-4 fill-ink" /> Watch trailer
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={onToggleWatched}
        className={watched ? 'bg-tungsten text-ink hover:bg-tungsten-dim hover:text-ink' : ''}
      >
        {watched ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
        {watched ? 'Watched' : 'Mark watched'}
      </Button>

      <Button
        variant="ghost"
        onClick={onToggleWantToWatch}
        className={wantToWatch ? 'bg-seat text-tungsten hover:bg-seat hover:text-tungsten' : ''}
      >
        <ListPlus className="w-4 h-4" />
        {wantToWatch ? 'Want to watch' : 'Add to watchlist'}
      </Button>

      <Button
        variant="ghost"
        onClick={onToggleFavorite}
        className={favorited ? 'bg-ticket text-white hover:bg-ticket-dim hover:text-white' : ''}
      >
        <Heart className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
        {favorited ? 'Favorited' : 'Favorite'}
      </Button>

      <Button variant="ghost" onClick={onReview}>
        <Star className="w-4 h-4" />
        {reviewRating ? `Your review · ${reviewRating}/10` : 'Write a review'}
      </Button>
    </>
  );
}
