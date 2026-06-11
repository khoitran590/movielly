'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { BookmarkPlus, BookmarkCheck, Heart, Star, Play, Tv, Calendar, ChevronLeft } from 'lucide-react';
import { movies as movieApi, getPosterUrl, getBackdropUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from '@/hooks/useUserData';
import { useWatchlist } from '@/context/WatchlistContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import StarRating from '@/components/movie/StarRating';
import ReviewCard from '@/components/movie/ReviewCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TrailerList from '@/components/movie/TrailerList';
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
  const { data: trailers = [] } = useQuery<TrailerItem[]>({
    queryKey: ['trailers', 'tv', tvId],
    queryFn: () => movieApi.trailers('tv', tvId),
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

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-72 bg-surface-700 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="h-8 bg-surface-700 rounded w-1/2" />
          <div className="h-20 bg-surface-700 rounded" />
        </div>
      </div>
    );
  }

  if (!show) return <div className="text-center py-20 text-slate-400">Show not found.</div>;

  const title = show.name || show.title || '';
  const year = (show.first_air_date || show.release_date)?.slice(0, 4);
  const poster = getPosterUrl(show.poster_path, 'w342');
  const backdrop = getBackdropUrl(show.backdrop_path);
  const inWatchlist = watchlist.isInList(show.id);
  const inFavorites = favorites.isInList(show.id);
  const topCast = show.credits?.cast?.slice(0, 8) || [];

  const toggleWatchlist = async () => {
    if (!user) { router.push('/login'); return; }
    if (inWatchlist) { await watchlist.remove(show.id); toast('Removed from watchlist'); }
    else { await watchlist.add({ movie_id: show.id, movie_title: title, movie_poster: show.poster_path, movie_type: 'tv' }); toast('Marked as watched'); }
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/login'); return; }
    if (inFavorites) { await favorites.remove(show.id); toast('Removed from favorites'); }
    else { await favorites.add({ movie_id: show.id, movie_title: title, movie_poster: show.poster_path, movie_type: 'tv' }); toast('Added to favorites'); }
  };

  const submitReview = async () => {
    if (!user) { router.push('/login'); return; }
    if (reviewRating === 0) { toast('Please select a rating', 'error'); return; }
    setSaving(true);
    const result = await reviewData.upsert({ rating: reviewRating, content: reviewContent, movie_title: title, movie_poster: show.poster_path, movie_type: 'tv' });
    setSaving(false);
    if (result?.error) { toast('Failed to save review', 'error'); return; }
    toast('Review saved!');
    setReviewModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {backdrop ? <Image src={backdrop} alt={title} fill className="object-cover" priority sizes="100vw" /> : <div className="h-full bg-surface-700" />}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/60 to-transparent" />
        <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="absolute top-4 right-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-600/80 text-blue-100 backdrop-blur-sm">TV Series</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-6 -mt-16 sm:-mt-20 pb-8 relative">
          {poster ? (
            <div className="shrink-0 mx-auto sm:mx-0">
              <div className="relative w-32 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden border-2 border-surface-600 shadow-2xl">
                <Image src={poster} alt={title} fill className="object-cover" sizes="(max-width: 640px) 8rem, 11rem" />
              </div>
            </div>
          ) : null}
          <div className="flex-1 pt-4 sm:pt-20 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                {year && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{year}</span>}
                {show.number_of_seasons && <span className="flex items-center gap-1"><Tv className="w-3.5 h-3.5" />{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}</span>}
                {show.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-gold font-semibold">
                    <Star className="w-3.5 h-3.5 fill-gold" />{show.vote_average.toFixed(1)}
                    <span className="text-slate-500 font-normal">({show.vote_count?.toLocaleString()})</span>
                  </span>
                )}
              </div>
              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {show.genres.map(g => (
                    <span key={g.id} className="text-xs px-2.5 py-1 bg-surface-600 border border-surface-500 rounded-full text-slate-300">{g.name}</span>
                  ))}
                </div>
              )}
            </div>
            {show.tagline && <p className="text-sm italic text-slate-400">"{show.tagline}"</p>}
            <div className="flex flex-wrap gap-2">
              {trailers.length > 0 && (
                <Button variant="primary" onClick={() => setActiveTrailer(trailers[0].youtube_video_id)} size="sm">
                  <Play className="w-4 h-4 fill-white" />
                  {trailers.length > 1 ? `Watch Trailers (${trailers.length})` : 'Watch Trailer'}
                </Button>
              )}
              <Button variant={inWatchlist ? 'secondary' : 'primary'} onClick={toggleWatchlist} size="sm">
                {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {inWatchlist ? 'Watched' : 'Mark as Watched'}
              </Button>
              <Button variant={inFavorites ? 'danger' : 'secondary'} onClick={toggleFavorite} size="sm">
                <Heart className={`w-4 h-4 ${inFavorites ? 'fill-red-400' : ''}`} />
                {inFavorites ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button variant="secondary" onClick={() => { if (!user) { router.push('/login'); return; } setReviewModalOpen(true); }} size="sm">
                <Star className="w-4 h-4" />
                {reviewData.userReview ? 'Edit Review' : 'Write Review'}
              </Button>
            </div>
          </div>
        </div>

        <div className="pb-16 space-y-8">
          {show.overview && (
            <section>
              <h2 className="text-lg font-semibold text-slate-100 mb-3">Overview</h2>
              <p className="text-slate-300 leading-relaxed">{show.overview}</p>
            </section>
          )}
          <TrailerList trailers={trailers} onSelect={setActiveTrailer} heading="Season Trailers" />
          {topCast.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-100 mb-3">Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {topCast.map(member => (
                  <div key={member.id} className="bg-surface-700 rounded-xl p-3 text-center border border-surface-600">
                    {member.profile_path ? (
                      <div className="relative w-12 h-12 mx-auto rounded-full overflow-hidden mb-2">
                        <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 mx-auto rounded-full bg-surface-600 flex items-center justify-center mb-2">
                        <span className="text-lg text-slate-400">{member.name[0]}</span>
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-200 line-clamp-1">{member.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{member.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Reviews {reviewData.reviews.length > 0 && <span className="text-sm font-normal text-slate-400">({reviewData.reviews.length})</span>}
            </h2>
            {reviewData.reviews.length === 0 ? (
              <div className="bg-surface-700 border border-surface-600 rounded-xl p-8 text-center">
                <Star className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
                {user && <Button variant="primary" size="sm" className="mt-4" onClick={() => setReviewModalOpen(true)}>Write a Review</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                {reviewData.reviews.map(review => (
                  <ReviewCard key={review.id} review={review} isOwn={review.user_id === user?.id}
                    onEdit={() => setReviewModalOpen(true)}
                    onDelete={() => reviewData.deleteReview().then(() => toast('Review deleted'))}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title={reviewData.userReview ? 'Edit Your Review' : 'Write a Review'}>
        <div className="space-y-5">
          <div>
            <p className="text-sm text-slate-400 mb-3">Rating</p>
            <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Review (optional)</label>
            <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} rows={4} placeholder="What did you think?"
              className="w-full bg-surface-700 border border-surface-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none transition-all"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={submitReview}>Save Review</Button>
          </div>
        </div>
      </Modal>

      <Modal open={activeTrailer !== null} onClose={() => setActiveTrailer(null)} title={`${title} — Trailer`} maxWidth="max-w-3xl">
        {activeTrailer && (
          <div className="aspect-video">
            <iframe src={`https://www.youtube.com/embed/${activeTrailer}?autoplay=1`} className="w-full h-full rounded-xl" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        )}
      </Modal>
    </div>
  );
}
