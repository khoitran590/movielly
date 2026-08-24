'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { movies as movieApi, getProviderLogo } from '@/lib/api';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { usePreferences } from '@/hooks/usePreferences';
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
            aria-label={`More about ${provider.provider_name} on JustWatch`}
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
  const { preferences } = usePreferences();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['providers', type, id, preferences.region],
    queryFn: ({ signal }) => movieApi.providers(type, id, preferences.region, signal),
    staleTime: QUERY_STALE_TIME.referenceData,
  });

  if (isPending) return <div className="h-28 animate-pulse rounded-panel bg-velvet" />;

  if (isError) {
    return (
      <section className="space-y-3 rounded-panel bg-velvet p-4">
        <SectionHeading>Where to watch</SectionHeading>
        <p className="text-body text-fog">Availability is taking an intermission.</p>
        <Button variant="ghost" size="sm" onClick={() => void refetch()}>Try again</Button>
      </section>
    );
  }

  const preferred = new Set(preferences.preferred_provider_ids);
  const filterPreferred = (providers: WatchProvider[]) => preferred.size
    ? providers.filter(provider => preferred.has(provider.provider_id))
    : providers;
  const filtered = data && {
    ...data,
    stream: filterPreferred(data.stream),
    rent: filterPreferred(data.rent),
    buy: filterPreferred(data.buy),
  };
  const hasPreferred = filtered && (filtered.stream.length || filtered.rent.length || filtered.buy.length);
  const hasAny = data && (data.stream.length || data.rent.length || data.buy.length);
  if (!data || !hasAny) return null;
  const displayData = hasPreferred ? filtered : data;

  return (
    <section className="space-y-4 rounded-panel bg-velvet p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading trailing={displayData.region}>Where to watch</SectionHeading>
        {displayData.link && (
          <a
            href={displayData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring-raised flex shrink-0 items-center gap-1 rounded-full text-ui text-fog transition-colors hover:text-screen"
          >
            More on JustWatch <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        {GROUPS.map(({ key, label }) => {
          const list = displayData[key];
          if (!list.length) return null;
          return (
            <div key={key} className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-caption font-medium uppercase tracking-wide text-fog">{label}</span>
              <ProviderLogos list={list} link={displayData.link} />
            </div>
          );
        })}
      </div>

      {!hasPreferred && preferred.size > 0 && <p className="text-meta text-fog">None of your preferred services carry this title; showing all options.</p>}
      <p className="pt-1 text-fineprint text-fog">Streaming data from JustWatch. Availability may change.</p>
    </section>
  );
}
