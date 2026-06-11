'use client';

import { useQuery } from '@tanstack/react-query';
import { Tv2, ExternalLink } from 'lucide-react';
import { movies as movieApi, getProviderLogo } from '@/lib/api';
import type { WatchProvider } from '@/types';

interface WhereToWatchProps {
  type: 'movie' | 'tv';
  id: number;
}

const GROUPS: { key: 'stream' | 'rent' | 'buy'; label: string }[] = [
  { key: 'stream', label: 'Stream' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

// "Where to watch" — JustWatch availability via TMDB, rendered as a minimal
// glass card. Links out to the licensed services; never streams content.
export default function WhereToWatch({ type, id }: WhereToWatchProps) {
  const { data, isPending } = useQuery({
    queryKey: ['providers', type, id],
    queryFn: () => movieApi.providers(type, id),
  });

  if (isPending) {
    return <div className="bg-surface-700 border border-surface-600 rounded-xl h-28 animate-pulse" />;
  }

  const hasAny = data && (data.stream.length || data.rent.length || data.buy.length);
  if (!data || !hasAny) return null;

  const Logos = ({ list }: { list: WatchProvider[] }) => (
    <div className="flex flex-wrap gap-2">
      {list.map(p => {
        const logo = getProviderLogo(p.logo_path);
        const inner = logo ? (
          <img
            src={logo}
            alt={p.provider_name}
            title={p.provider_name}
            className="w-10 h-10 rounded-xl object-cover border border-surface-500"
            loading="lazy"
          />
        ) : (
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-600 text-[10px] text-slate-200 text-center px-1">
            {p.provider_name}
          </span>
        );
        return data.link ? (
          <a key={p.provider_id} href={data.link} target="_blank" rel="noopener noreferrer"
             className="transition-transform hover:scale-110" aria-label={`Watch on ${p.provider_name}`}>
            {inner}
          </a>
        ) : (
          <div key={p.provider_id}>{inner}</div>
        );
      })}
    </div>
  );

  return (
    <section className="bg-surface-700 border border-surface-600 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Tv2 className="w-4 h-4 text-brand-light" />
          Where to Watch
          <span className="text-xs font-normal text-slate-400">· {data.region}</span>
        </h2>
        {data.link && (
          <a href={data.link} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-xs text-brand-light hover:underline shrink-0">
            More <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        {GROUPS.map(({ key, label }) => {
          const list = data[key];
          if (!list.length) return null;
          return (
            <div key={key} className="flex items-center gap-4">
              <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
              <Logos list={list} />
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-500 pt-1">Streaming data powered by JustWatch</p>
    </section>
  );
}
