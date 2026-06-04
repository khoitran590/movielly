'use client';

import { Play } from 'lucide-react';
import type { TrailerItem } from '@/types';

interface TrailerListProps {
  trailers: TrailerItem[];
  onSelect: (youtubeVideoId: string) => void;
  heading?: string;
}

export default function TrailerList({ trailers, onSelect, heading = 'Trailers' }: TrailerListProps) {
  if (trailers.length <= 1) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-100 mb-3">
        {heading}
        <span className="ml-2 text-sm font-normal text-slate-400">({trailers.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {trailers.map(t => (
          <button
            key={t.youtube_video_id}
            onClick={() => onSelect(t.youtube_video_id)}
            className="group flex items-center gap-3 bg-surface-700 border border-surface-600 hover:border-brand/40 rounded-xl p-2 text-left transition-colors"
          >
            <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-surface-600">
              <img
                src={`https://img.youtube.com/vi/${t.youtube_video_id}/mqdefault.jpg`}
                alt={t.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand/90 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-brand-light transition-colors">{t.label}</p>
              {t.sublabel && <p className="text-xs text-slate-500 mt-0.5">{t.sublabel}</p>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
