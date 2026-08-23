'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { activity } from '@/lib/db';
import { getPosterUrl } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/ui/EmptyState';
import type { FeedEntry } from '@/types';

function Row({ entry }: { entry: FeedEntry }) {
  const name = entry.profile.username || 'Unknown';
  const initial = name[0]?.toUpperCase() || '?';
  const poster = getPosterUrl(entry.movie_poster, 'w154');
  const href = `/${entry.movie_type}/${entry.movie_id}`;

  return (
    <li className="flex items-center gap-3 rounded-panel bg-velvet p-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-seat">
        {entry.profile.avatar_url ? (
          <Image src={entry.profile.avatar_url} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          <span className="text-ui font-semibold text-fog">{initial}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-ui text-screen">
          <Link href={`/user/${entry.profile.id}`} className="focus-ring rounded font-medium hover:underline">
            @{name}
          </Link>{' '}
          <span className="text-fog">
            {entry.kind === 'review' ? 'reviewed' : 'watched'}
          </span>{' '}
          <Link href={href} className="focus-ring rounded font-medium hover:underline">
            {entry.movie_title}
          </Link>
        </p>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-meta text-fog">
          {entry.kind === 'review' && (
            <span className="inline-flex items-center gap-1 text-tungsten">
              <Star className="h-3 w-3 fill-current" aria-hidden /> {entry.rating}/10
            </span>
          )}
          <span>{timeAgo(entry.at)}</span>
        </div>
        {entry.kind === 'review' && entry.content && (
          <p className="mt-1 line-clamp-2 text-meta text-fog">{entry.content}</p>
        )}
      </div>

      <Link href={href} className="focus-ring relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-seat" aria-label={entry.movie_title}>
        {poster && <Image src={poster} alt="" fill sizes="40px" className="object-cover" />}
      </Link>
    </li>
  );
}

export default function ActivityFeed() {
  const { user } = useAuth();
  const { data = [], isPending } = useQuery({
    queryKey: ['activity', user?.id],
    queryFn: () => activity.forUser(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isPending) {
    return (
      <ul className="space-y-2" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-[68px] animate-pulse rounded-panel bg-velvet" />
        ))}
      </ul>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No activity yet."
        description="When your friends review or watch something, it shows up here."
        className="py-12"
      />
    );
  }

  return (
    <ul className="space-y-2">
      {data.map(entry => (
        <Row key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}
