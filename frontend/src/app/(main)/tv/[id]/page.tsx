'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { movies as movieApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from '@/hooks/useUserData';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import TitleHero from '@/components/movie/TitleHero';
import TitleActions from '@/components/movie/TitleActions';
import TitleFacts from '@/components/movie/TitleFacts';
import CastStrip from '@/components/movie/CastStrip';
import ReviewsSection from '@/components/movie/ReviewsSection';
import ReviewModal from '@/components/movie/ReviewModal';
import TrailerList from '@/components/movie/TrailerList';
import WhereToWatch from '@/components/movie/WhereToWatch';
import PosterRail from '@/components/movie/PosterRail';
import TitleDetailSkeleton from '@/components/movie/TitleDetailSkeleton';
import type { Movie, TrailerItem } from '@/types';

export default function TvDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);

  const tvId = Number(id);
  const { data: show, isPending: loading } = useQuery({
    queryKey: ['tv', tvId],
    queryFn: () => movieApi.getTv(tvId),
  });
  const { data: primaryTrailer } = useQuery({
    queryKey: ['trailer', 'tv', tvId],
    queryFn: () => movieApi.trailer('tv', tvId),
  });
  const { data: trailers = [] } = useQuery<TrailerItem[]>({
    queryKey: ['trailers', 'tv', tvId],
    queryFn: () => movieApi.trailers('tv', tvId),
  });
  const { data: similar = [] } = useQuery<Movie[]>({
    queryKey: ['similar', 'tv', tvId],
    queryFn: () => movieApi.similar('tv', tvId),
  });

  const watchlist = useWatchlist();
  const favorites = useFavorites();
  const reviewData = useReviews(show?.id);

  useEffect(() => {
    if (reviewData.userReview) {
      setReviewRating(reviewData.userReview.rating);
      setReviewContent(reviewData.userReview.content || '');
    }
  }, [reviewData.userReview]);

  if (loading) return <TitleDetailSkeleton />;

  if (!show) {
    return (
      <EmptyState
        title="This title isn’t in the house."
        description="The link may be broken, or TMDB no longer lists it."
        actionLabel="Back to browse"
        actionHref="/"
      />
    );
  }

  const title = show.name || show.title || '';
  const year = (show.first_air_date || show.release_date)?.slice(0, 4);
  const inWatchlist = watchlist.isInList(show.id);
  const inFavorites = favorites.isInList(show.id);
  const primaryTrailerId = primaryTrailer?.youtube_video_id ?? null;
  const topCast = show.credits?.cast?.slice(0, 12) || [];
  const seasons = show.number_of_seasons
    ? `${show.number_of_seasons} season${show.number_of_seasons !== 1 ? 's' : ''}`
    : null;

  const meta = [year, seasons, show.vote_average > 0 ? `★ ${show.vote_average.toFixed(1)}` : null]
    .filter(Boolean)
    .join('  ·  ');

  const payload = { movie_id: show.id, movie_title: title, movie_poster: show.poster_path, movie_type: 'tv' as const };

  const toggleWatchlist = async () => {
    if (!user) { router.push('/login'); return; }
    if (inWatchlist) { await watchlist.remove(show.id); toast(`Removed ${title} from Watched`); }
    else { await watchlist.add(payload); toast(`Marked ${title} as watched`); }
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/login'); return; }
    if (inFavorites) { await favorites.remove(show.id); toast(`Removed ${title} from Favorites`); }
    else { await favorites.add(payload); toast(`Added ${title} to Favorites`); }
  };

  const openReview = () => {
    if (!user) { router.push('/login'); return; }
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!user) { router.push('/login'); return; }
    if (reviewRating === 0) { toast('Pick a rating first', 'error'); return; }
    setSaving(true);
    const result = await reviewData.upsert({
      rating: reviewRating, content: reviewContent, movie_title: title, movie_poster: show.poster_path, movie_type: 'tv',
    });
    setSaving(false);
    if (result?.error) { toast('Could not save your review', 'error'); return; }
    toast('Review saved');
    setReviewModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <TitleHero
        title={title}
        backdropPath={show.backdrop_path}
        posterPath={show.poster_path}
        meta={meta}
        voteCount={show.vote_count}
        genres={show.genres}
        tagline={show.tagline}
        actions={
          <TitleActions
            hasTrailer={primaryTrailerId !== null}
            onWatchTrailer={() => primaryTrailerId && setActiveTrailer(primaryTrailerId)}
            watched={inWatchlist}
            onToggleWatched={toggleWatchlist}
            favorited={inFavorites}
            onToggleFavorite={toggleFavorite}
            reviewRating={reviewData.userReview?.rating}
            onReview={openReview}
          />
        }
      />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {show.overview && (
              <section className="space-y-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">Overview</h2>
                <p className="text-body text-screen">{show.overview}</p>
              </section>
            )}

            <CastStrip cast={topCast} />
            <TrailerList trailers={trailers} onSelect={setActiveTrailer} heading="Season trailers" />

            <ReviewsSection
              reviews={reviewData.reviews}
              currentUserId={user?.id}
              onWrite={openReview}
              onDelete={() => reviewData.deleteReview().then(() => toast('Review deleted'))}
            />
          </div>

          <div className="space-y-6">
            <WhereToWatch type="tv" id={show.id} />
            <TitleFacts
              facts={[
                { label: 'Seasons', value: show.number_of_seasons, mono: true },
                { label: 'Status', value: show.status },
                { label: 'Votes', value: show.vote_count?.toLocaleString(), mono: true },
              ]}
            />
          </div>
        </div>

        {similar.length > 0 && (
          <div className="pt-12">
            <PosterRail
              title="More like this"
              movies={similar.slice(0, 12).map(m => ({ ...m, media_type: 'tv' as const }))}
            />
          </div>
        )}
      </div>

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        editing={!!reviewData.userReview}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        content={reviewContent}
        onContentChange={setReviewContent}
        saving={saving}
        onSave={submitReview}
      />

      <Modal open={activeTrailer !== null} onClose={() => setActiveTrailer(null)} title={`${title} — Trailer`} maxWidth="max-w-3xl">
        {activeTrailer && (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailer}?autoplay=1`}
              title={`${title} trailer`}
              className="h-full w-full rounded-poster"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
