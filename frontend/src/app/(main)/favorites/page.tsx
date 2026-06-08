'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2, Film, Tv, Share2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import { getPosterUrl, lists } from '@/lib/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function FavoritesPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { items, remove, refetch } = useFavorites();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => { refetch(); }, []);

  const handleRemove = async (movieId: number, title: string) => {
    await remove(movieId);
    toast(`"${title}" removed from favorites`);
  };

  const handleShare = async () => {
    if (!session?.access_token) return;
    setSharing(true);
    try {
      const data = await lists.share(session.access_token, 'My Favorites');
      const url = `${window.location.origin}/list/${data.share_token}`;
      setShareUrl(url);
      setShareModalOpen(true);
    } catch {
      toast('Failed to generate share link', 'error');
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Link copied!');
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-bold text-white">Favorites</h1>
          <span className="text-sm text-slate-400 bg-surface-700 px-2.5 py-0.5 rounded-full border border-surface-600">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        {items.length > 0 && (
          <Button variant="secondary" onClick={handleShare} loading={sharing} size="sm">
            <Share2 className="w-4 h-4" /> Share List
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Heart className="w-16 h-16 text-slate-600 mx-auto" />
          <p className="text-slate-400">No favorites yet.</p>
          <p className="text-sm text-slate-500">Add movies and shows you love to build your favorites list.</p>
          <Link href="/">
            <Button variant="primary" className="mt-2">Discover Movies</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const poster = getPosterUrl(item.movie_poster, 'w92');
            const href = item.movie_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`;
            return (
              <div key={item.id} className="flex items-center gap-4 bg-surface-700 border border-surface-600 rounded-xl p-3 hover:border-surface-500 transition-colors group">
                <Link href={href} className="shrink-0">
                  {poster ? (
                    <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden">
                      <Image src={poster} alt={item.movie_title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 aspect-[2/3] bg-surface-600 rounded-lg flex items-center justify-center">
                      {item.movie_type === 'tv' ? <Tv className="w-5 h-5 text-slate-500" /> : <Film className="w-5 h-5 text-slate-500" />}
                    </div>
                  )}
                </Link>
                <Link href={href} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-brand-light transition-colors">{item.movie_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${item.movie_type === 'tv' ? 'bg-blue-600/20 text-blue-400' : 'bg-brand/20 text-brand-light'}`}>
                      {item.movie_type === 'tv' ? 'TV' : 'Film'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Added {new Date(item.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </Link>
                <button onClick={() => handleRemove(item.movie_id, item.movie_title)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Your Favorites">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Anyone with this link can view your favorites list.</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-surface-700 border border-surface-500 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
            />
            <Button variant="secondary" onClick={copyLink} size="md">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
