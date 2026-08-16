'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { movies as movieApi, getProviderLogo } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import SectionHeading from '@/components/ui/SectionHeading';
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

function ProviderLogos({ list, link }: { list: WatchProvider[]; link: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map(provider => {
        const logo = getProviderLogo(provider.logo_path);
        const inner = logo ? (
          <Image
            src={logo}
            alt={provider.provider_name}
            title={provider.provider_name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-poster object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-poster bg-seat px-1 text-center text-fineprint text-screen">
            {provider.provider_name}
          </span>
        );

        return link ? (
          <a
            key={provider.provider_id}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch on ${provider.provider_name}`}
            className="focus-ring-raised rounded-poster transition-transform hover:scale-105"
          >
            {inner}
          </a>
        ) : (
          <div key={provider.provider_id}>{inner}</div>
        );
      })}
    </div>
  );
}

// JustWatch availability via TMDB. Links out to the licensed services; never
// streams content.
export default function WhereToWatch({ type, id }: WhereToWatchProps) {
  const { data, isPending } = useQuery({
    queryKey: ['providers', type, id],
    queryFn: ({ signal }) => movieApi.providers(type, id, 'US', signal),
    staleTime: QUERY_STALE_TIME.referenceData,
  });

  if (isPending) return <div className="h-28 animate-pulse rounded-panel bg-velvet" />;

  const hasAny = data && (data.stream.length || data.rent.length || data.buy.length);
  if (!data || !hasAny) return null;

  return (
    <section className="space-y-4 rounded-panel bg-velvet p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading trailing={data.region}>Where to watch</SectionHeading>
        {data.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring-raised flex shrink-0 items-center gap-1 rounded-full text-ui text-fog transition-colors hover:text-screen"
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
              <span className="w-12 shrink-0 text-caption font-medium uppercase tracking-wide text-fog">{label}</span>
              <ProviderLogos list={list} link={data.link} />
            </div>
          );
        })}
      </div>

      <p className="pt-1 text-fineprint text-fog">Streaming data from JustWatch</p>
    </section>
  );
}
