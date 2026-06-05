'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Film, Tv, User } from 'lucide-react';
import { lists, getPosterUrl } from '@/lib/api';
import type { SharedList } from '@/types';

export default function SharedListPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [data, setData] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    lists.getShared(shareId)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-surface-700 rounded w-48" />
        <div className="h-4 bg-surface-700 rounded w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-700 rounded-xl" />
        ))}
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <Heart className="w-16 h-16 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-200">List not found</h2>
        <p className="text-slate-400 text-sm">This shared list may have been removed or the link is invalid.</p>
        <Link href="/" className="text-brand-light hover:underline text-sm">Go to home</Link>
      </div>
    );
  }

  const ownerName = data.owner?.username || 'Someone';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-surface-700 to-surface-800 border border-surface-600 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center">
            {data.owner?.avatar_url ? (
              <img src={data.owner.avatar_url} alt={ownerName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-brand-light" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-400">{ownerName}'s list</p>
            <h1 className="text-xl font-bold text-white">{data.title}</h1>
          </div>
        </div>
        {data.owner?.bio && (
          <p className="text-sm text-slate-300 mt-1 mb-2">{data.owner.bio}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span className="text-sm text-slate-300">{data.items.length} {data.items.length === 1 ? 'favorite' : 'favorites'}</span>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">This list is empty.</div>
      ) : (
        <div className="space-y-2">
          {data.items.map((item, idx) => {
            const poster = getPosterUrl(item.movie_poster, 'w92');
            const href = item.movie_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`;
            return (
              <Link
                key={item.id}
                href={href}
                className="flex items-center gap-4 bg-surface-700 border border-surface-600 hover:border-brand/40 rounded-xl p-3 transition-colors group"
              >
                <span className="text-sm font-mono text-slate-500 w-6 text-center shrink-0">{idx + 1}</span>
                {poster ? (
                  <div className="relative w-10 aspect-[2/3] rounded-lg overflow-hidden shrink-0">
                    <Image src={poster} alt={item.movie_title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 aspect-[2/3] bg-surface-600 rounded-lg flex items-center justify-center shrink-0">
                    {item.movie_type === 'tv' ? <Tv className="w-4 h-4 text-slate-500" /> : <Film className="w-4 h-4 text-slate-500" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-brand-light transition-colors">
                    {item.movie_title}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${item.movie_type === 'tv' ? 'bg-blue-600/20 text-blue-400' : 'bg-brand/20 text-brand-light'}`}>
                    {item.movie_type === 'tv' ? 'TV' : 'Film'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="text-center pt-4">
        <p className="text-sm text-slate-500">
          Powered by <Link href="/" className="text-brand-light hover:underline">Movielly</Link>
        </p>
      </div>
    </div>
  );
}
