'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookmarkCheck, Trash2, Film, Tv, ChevronDown, MessageSquare, PenLine } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { useMyReviews } from '@/hooks/useUserData';
import { useToast } from '@/components/ui/Toast';
import { getPosterUrl } from '@/lib/api';
import StarRating from '@/components/movie/StarRating';
import Button from '@/components/ui/Button';

export default function WatchlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, remove, refetch } = useWatchlist();
  const { byMovieId: reviewsByMovie } = useMyReviews();
  const { toast } = useToast();
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => { refetch(); }, []);

  const handleRemove = async (movieId: number, title: string) => {
    await remove(movieId);
    toast(`"${title}" removed from watchlist`);
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <span className="text-sm text-slate-400 bg-surface-700 px-2.5 py-0.5 rounded-full border border-surface-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <p className="text-sm text-slate-500 pl-9">Movies & shows you&apos;ve watched.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <BookmarkCheck className="w-16 h-16 text-slate-600 mx-auto" />
          <p className="text-slate-400">Your watchlist is empty.</p>
          <p className="text-sm text-slate-500">Mark movies and shows you&apos;ve watched to keep track of them — tap the bookmark on any poster.</p>
          <Link href="/">
            <Button variant="primary" className="mt-2">Discover Movies</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const poster = getPosterUrl(item.movie_poster, 'w92');
            const href = item.movie_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`;
            const review = reviewsByMovie.get(item.movie_id);
            const reviewOpen = openReviewId === item.id;
            return (
              <div key={item.id} className="bg-surface-700 border border-surface-600 rounded-xl hover:border-surface-500 transition-colors group">
                <div className="flex items-center gap-4 p-3">
                  <Link href={href} className="shrink-0">
                    {poster ? (
                      <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden">
                        <Image src={poster} alt={item.movie_title} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="w-12 aspect-[2/3] bg-surface-600 rounded-lg flex items-center justify-center">
                        {item.movie_type === 'tv' ? <Tv className="w-5 h-5 text-slate-500" /> : <Film className="w-5 h-5 text-slate-500" />}
                      </div>
                    )}
                  </Link>
                  <Link href={href} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-brand-light transition-colors">{item.movie_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.movie_type === 'tv' ? 'bg-blue-600/20 text-blue-400' : 'bg-brand/20 text-brand-light'}`}>
                        {item.movie_type === 'tv' ? 'TV' : 'Film'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Added {new Date(item.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setOpenReviewId(reviewOpen ? null : item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors shrink-0 ${
                      review
                        ? 'text-gold hover:bg-surface-600'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-surface-600'
                    }`}
                    aria-expanded={reviewOpen}
                    title={review ? 'Show your review' : 'No review yet'}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">{review ? `${review.rating}/10` : 'Review'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${reviewOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleRemove(item.movie_id, item.movie_title)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-600 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {reviewOpen && (
                  <div className="border-t border-surface-600 px-4 py-3 animate-fade-in">
                    {review ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <StarRating value={review.rating} readonly size="sm" />
                          <span className="text-xs text-slate-500">
                            Reviewed {new Date(review.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {review.content ? (
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{review.content}</p>
                        ) : (
                          <p className="text-sm text-slate-500 italic">You rated this without writing a review.</p>
                        )}
                        <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-brand-light hover:underline">
                          <PenLine className="w-3.5 h-3.5" /> Edit review
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm text-slate-500">You haven&apos;t reviewed this yet.</p>
                        <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-brand-light hover:underline">
                          <PenLine className="w-3.5 h-3.5" /> Write a review
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
