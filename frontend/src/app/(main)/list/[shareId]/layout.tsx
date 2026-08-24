import type { Metadata } from 'next';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  try {
    const response = await fetch(`${apiBase}/api/lists/${encodeURIComponent(shareId)}`, { next: { revalidate: 300 } });
    if (!response.ok) return { title: 'Shared list | Movielly' };
    const list = await response.json() as { title?: string; owner?: { username?: string | null; avatar_url?: string | null } | null; items?: { movie_poster: string | null }[] };
    const owner = list.owner?.username ? `${list.owner.username}’s ` : '';
    const title = `${owner}${list.title || 'Shared list'} | Movielly`;
    const poster = list.items?.find(item => item.movie_poster)?.movie_poster;
    const image = poster ? `https://image.tmdb.org/t/p/w500${poster}` : undefined;
    return { title, openGraph: { title, images: image ? [image] : undefined } };
  } catch {
    return { title: 'Shared list | Movielly' };
  }
}

export default function SharedListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
