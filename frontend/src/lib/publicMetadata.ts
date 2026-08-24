import type { Metadata } from 'next';
import { getPosterUrl } from './api';
import type { Movie } from '@/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function titleMetadata(type: 'movie' | 'tv', id: string): Promise<Metadata> {
  if (!/^\d+$/.test(id)) return { title: 'Title | Movielly' };
  try {
    const response = await fetch(`${apiBase}/api/movies/${type}/${id}`, { next: { revalidate: 3600 } });
    if (!response.ok) return { title: 'Title | Movielly' };
    const title = await response.json() as Movie;
    const name = title.title || title.name || 'Untitled';
    const image = getPosterUrl(title.poster_path, 'w500');
    return {
      title: `${name} | Movielly`,
      description: title.overview || `See ${name} on Movielly.`,
      openGraph: { title: `${name} | Movielly`, description: title.overview || undefined, images: image ? [image] : undefined },
    };
  } catch {
    return { title: 'Title | Movielly' };
  }
}
