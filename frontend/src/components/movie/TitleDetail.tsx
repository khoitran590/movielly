'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { movies as movieApi } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from '@/hooks/useUserData';
import { useTitleActions } from '@/hooks/useTitleActions';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeading from '@/components/ui/SectionHeading';
import TitleHero from './TitleHero';
import TitleActions from './TitleActions';
import TitleFacts from './TitleFacts';
import CastStrip from './CastStrip';
import ReviewsSection from './ReviewsSection';
import ReviewModal from './ReviewModal';
import TrailerList from './TrailerList';
import WhereToWatch from './WhereToWatch';
import PosterRail from './PosterRail';
import TitleDetailSkeleton from './TitleDetailSkeleton';
import type { Movie, TrailerItem } from '@/types';

type TitleType = 'movie' | 'tv';
type Fact = { label: string; value: string | number | null | undefined; mono?: boolean };

const adapters = {
  movie: {
    fetch: movieApi.getMovie,
    title: (item: Movie) => item.title || item.name || '',
    year: (item: Movie) => (item.release_date || item.first_air_date)?.slice(0, 4),
    metaMiddle: (item: Movie) => item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : null,
    facts: (item: Movie): Fact[] => [
      { label: 'Director', value: item.credits?.crew?.find((member) => member.job === 'Director')?.name },
      { label: 'Status', value: item.status },
      { label: 'Votes', value: item.vote_count?.toLocaleString(), mono: true },
    ],
    trailerHeading: 'Franchise trailers',
  },
  tv: {
    fetch: movieApi.getTv,
    title: (item: Movie) => item.name || item.title || '',
    year: (item: Movie) => (item.first_air_date || item.release_date)?.slice(0, 4),
    metaMiddle: (item: Movie) => item.number_of_seasons
      ? `${item.number_of_seasons} season${item.number_of_seasons === 1 ? '' : 's'}`
      : null,
    facts: (item: Movie): Fact[] => [
      { label: 'Seasons', value: item.number_of_seasons, mono: true },
      { label: 'Status', value: item.status },
      { label: 'Votes', value: item.vote_count?.toLocaleString(), mono: true },
    ],
    trailerHeading: 'Season trailers',
  },
} satisfies Record<TitleType, {
  fetch: (id: number, signal?: AbortSignal) => Promise<Movie>;
  title: (item: Movie) => string;
  year: (item: Movie) => string | undefined;
  metaMiddle: (item: Movie) => string | null;
  facts: (item: Movie) => Fact[];
  trailerHeading: string;
}>;

export default function TitleDetail({ type, id }: { type: TitleType; id: number }) {
  const adapter = adapters[type];
  const { data: title, isPending, isError, refetch } = useQuery({
    queryKey: [type, id],
    queryFn: ({ signal }) => adapter.fetch(id, signal),
    staleTime: QUERY_STALE_TIME.details,
  });
  const { data: primaryTrailer } = useQuery({
    queryKey: ['trailer', type, id],
    queryFn: ({ signal }) => movieApi.trailer(type, id, signal),
    staleTime: QUERY_STALE_TIME.trailersAndSimilar,
  });
  const { data: trailers = [] } = useQuery<TrailerItem[]>({
    queryKey: ['trailers', type, id],
    queryFn: ({ signal }) => movieApi.trailers(type, id, signal),
    staleTime: QUERY_STALE_TIME.trailersAndSimilar,
  });
  const { data: similar = [] } = useQuery<Movie[]>({
    queryKey: ['similar', type, id],
    queryFn: ({ signal }) => movieApi.similar(type, id, signal),
    staleTime: QUERY_STALE_TIME.trailersAndSimilar,
  });

  if (isPending) return <TitleDetailSkeleton />;
  if (isError) {
    return <EmptyState title="The projector is having trouble." description="We couldn’t load this title right now." actionLabel="Try again" onAction={() => void refetch()} />;
  }
  if (!title) {
    return <EmptyState title="This title isn’t in the house." description="The link may be broken, or TMDB no longer lists it." actionLabel="Back to browse" actionHref="/" />;
  }

  return (
    <TitleDetailContent
      type={type}
      titleItem={{ ...title, media_type: type }}
      primaryTrailerId={primaryTrailer?.youtube_video_id ?? null}
      trailers={trailers}
      similar={similar}
    />
  );
}

function TitleDetailContent({
  type,
  titleItem,
  primaryTrailerId,
  trailers,
  similar,
}: {
  type: TitleType;
  titleItem: Movie;
  primaryTrailerId: string | null;
  trailers: TrailerItem[];
  similar: Movie[];
}) {
  const adapter = adapters[type];
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const actions = useTitleActions(titleItem);
  const reviewData = useReviews(titleItem.id, type);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);

  useEffect(() => {
    if (reviewData.userReview) {
      setReviewRating(reviewData.userReview.rating);
      setReviewContent(reviewData.userReview.content || '');
    }
  }, [reviewData.userReview]);

  const title = adapter.title(titleItem);
  const meta = [
    adapter.year(titleItem),
    adapter.metaMiddle(titleItem),
    titleItem.vote_average > 0 ? `★ ${titleItem.vote_average.toFixed(1)}` : null,
  ].filter(Boolean).join('  ·  ');
  const topCast = titleItem.credits?.cast?.slice(0, 12) || [];

  const openReview = () => {
    if (!user) { router.push('/login'); return; }
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!user) { router.push('/login'); return; }
    if (reviewRating === 0) { toast('Pick a rating first', 'error'); return; }
    setSaving(true);
    const result = await reviewData.upsert({
      rating: reviewRating,
      content: reviewContent,
      movie_title: title,
      movie_poster: titleItem.poster_path,
      movie_type: type,
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
        backdropPath={titleItem.backdrop_path}
        posterPath={titleItem.poster_path}
        meta={meta}
        voteCount={titleItem.vote_count}
        genres={titleItem.genres}
        tagline={titleItem.tagline}
        actions={
          <TitleActions
            hasTrailer={primaryTrailerId !== null}
            onWatchTrailer={() => primaryTrailerId && setActiveTrailer(primaryTrailerId)}
            watched={actions.inWatchlist}
            onToggleWatched={() => void actions.toggleWatchlist()}
            wantToWatch={actions.inWantToWatch}
            onToggleWantToWatch={() => void actions.toggleWantToWatch()}
            favorited={actions.inFavorites}
            onToggleFavorite={() => void actions.toggleFavorite()}
            reviewRating={reviewData.userReview?.rating}
            onReview={openReview}
          />
        }
      />

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="mb-8 lg:hidden"><WhereToWatch type={type} id={titleItem.id} /></div>
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-3">
          <div className="min-w-0 space-y-10 lg:col-span-2">
            {titleItem.overview && (
              <section className="space-y-3">
                <SectionHeading>Overview</SectionHeading>
                <p className="text-body text-screen">{titleItem.overview}</p>
              </section>
            )}
            <CastStrip cast={topCast} />
            <TrailerList trailers={trailers} onSelect={setActiveTrailer} heading={adapter.trailerHeading} />
            <ReviewsSection
              reviews={reviewData.reviews}
              currentUserId={user?.id}
              onWrite={openReview}
              onDelete={() => reviewData.deleteReview().then(() => toast('Review deleted'))}
            />
          </div>

          <div className="min-w-0 space-y-6">
            <div className="hidden lg:block"><WhereToWatch type={type} id={titleItem.id} /></div>
            <TitleFacts facts={adapter.facts(titleItem)} />
          </div>
        </div>

        {similar.length > 0 && (
          <div className="pt-12">
            <PosterRail title="More like this" movies={similar.slice(0, 12).map((item) => ({ ...item, media_type: type }))} />
          </div>
        )}
      </div>

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        editing={Boolean(reviewData.userReview)}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        content={reviewContent}
        onContentChange={setReviewContent}
        saving={saving}
        onSave={() => void submitReview()}
      />

      <Modal open={activeTrailer !== null} onClose={() => setActiveTrailer(null)} title={`${title} — Trailer`} maxWidth="max-w-3xl">
        {activeTrailer && (
          <div className="aspect-video">
            <iframe src={`https://www.youtube.com/embed/${activeTrailer}?autoplay=1`} title={`${title} trailer`} className="h-full w-full rounded-poster" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        )}
      </Modal>
    </div>
  );
}
