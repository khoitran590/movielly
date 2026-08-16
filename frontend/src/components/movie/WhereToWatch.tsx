'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
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

// JustWatch availability via TMDB. Links out to the licensed services; never
// streams content.
export default function WhereToWatch({ type, id }: WhereToWatchProps) {
  const { data, isPending } = useQuery({
    queryKey: ['providers', type, id],
    queryFn: () => movieApi.providers(type, id),
  });

  if (isPending) return <div className="h-28 animate-pulse rounded-panel bg-velvet" />;

  const hasAny = data && (data.stream.length || data.rent.length || data.buy.length);
  if (!data || !hasAny) return null;

  const Logos = ({ list }: { list: WatchProvider[] }) => (
    <div className="flex flex-wrap gap-2">
      {list.map(p => {
        const logo = getProviderLogo(p.logo_path);
        const inner = logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={p.provider_name}
            title={p.provider_name}
            className="h-10 w-10 rounded-poster object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-poster bg-seat px-1 text-center text-[10px] text-screen">
            {p.provider_name}
          </span>
        );
        return data.link ? (
          <a
            key={p.provider_id}
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch on ${p.provider_name}`}
            className="rounded-poster transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten"
          >
            {inner}
          </a>
        ) : (
          <div key={p.provider_id}>{inner}</div>
        );
      })}
    </div>
  );

  return (
    <section className="space-y-4 rounded-panel bg-velvet p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
          Where to watch
          <span className="ml-2 font-mono normal-case tracking-normal">{data.region}</span>
        </h2>
        {data.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-full text-ui text-fog transition-colors hover:text-screen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten"
          >
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
              <span className="w-12 shrink-0 text-[11px] font-medium uppercase tracking-wide text-fog">{label}</span>
              <Logos list={list} />
            </div>
          );
        })}
      </div>

      <p className="pt-1 text-[10px] text-fog">Streaming data from JustWatch</p>
    </section>
  );
}
