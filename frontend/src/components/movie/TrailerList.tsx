'use client';

import { Play } from 'lucide-react';
import type { TrailerItem } from '@/types';

interface TrailerListProps {
  trailers: TrailerItem[];
  onSelect: (youtubeVideoId: string) => void;
  heading?: string;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export default function TrailerList({ trailers, onSelect, heading = 'Trailers' }: TrailerListProps) {
  // A single trailer is already the hero's primary action.
  if (trailers.length <= 1) return null;

  const [lead, ...rest] = trailers;

  const thumb = (t: TrailerItem, large: boolean, key: string) => (
    <button
      key={key}
      onClick={() => onSelect(t.youtube_video_id)}
      className={`group text-left ${large ? 'block w-full' : 'flex items-center gap-3'} ${focusRing} rounded-poster`}
    >
      <span
        className={`relative block shrink-0 overflow-hidden rounded-poster bg-velvet ${
          large ? 'aspect-video w-full' : 'aspect-video w-28'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${t.youtube_video_id}/${large ? 'hqdefault' : 'mqdefault'}.jpg`}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/40 transition-colors group-hover:bg-ink/20">
          <span className={`flex items-center justify-center rounded-full bg-tungsten ${large ? 'h-12 w-12' : 'h-8 w-8'}`}>
            <Play className={`fill-ink text-ink ${large ? 'ml-0.5 w-5 h-5' : 'ml-0.5 w-3.5 h-3.5'}`} />
          </span>
        </span>
      </span>
      <span className={`block min-w-0 ${large ? 'mt-2' : ''}`}>
        <span className="line-clamp-2 block text-ui font-medium text-screen">{t.label}</span>
        {t.sublabel && <span className="mt-0.5 block font-mono text-[11px] text-fog">{t.sublabel}</span>}
      </span>
    </button>
  );

  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
        {heading}
        <span className="ml-2 font-mono normal-case tracking-normal">{trailers.length}</span>
      </h2>

      {thumb(lead, true, `${lead.youtube_video_id}-lead`)}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Two entries (e.g. franchise parts) can resolve to the same video,
              so the id alone is not a unique key. */}
          {rest.map((t, i) => thumb(t, false, `${t.youtube_video_id}-${i}`))}
        </div>
      )}
    </section>
  );
}
