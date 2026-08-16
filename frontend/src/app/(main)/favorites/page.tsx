'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import { lists, savedToMovie } from '@/lib/api';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';

export default function FavoritesPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { items, refetch } = useFavorites();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => { refetch(); }, []);

  const handleShare = async () => {
    if (!session?.access_token) return;
    setSharing(true);
    try {
      const data = await lists.share(session.access_token, 'My Favorites');
      setShareUrl(`${window.location.origin}/list/${data.share_token}`);
      setShareModalOpen(true);
    } catch {
      toast('Could not create a share link', 'error');
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Link copied');
  };

  if (loading || !user) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-8 px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h1 className="font-display text-display-md text-screen">Favorites</h1>
          <span className="font-mono text-meta text-fog">
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </span>
        </div>
        {items.length > 0 && (
          <Button variant="secondary" onClick={handleShare} loading={sharing} size="sm" className="border-tungsten text-tungsten hover:border-tungsten hover:bg-tungsten/10">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState title="No favorites yet." actionLabel="Browse titles" actionHref="/" />
      ) : (
        <div className={GRID_CLASS}>
          {items.map(item => (
            <MovieCard key={item.id} movie={savedToMovie(item)} />
          ))}
        </div>
      )}

      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share this list">
        <div className="space-y-4">
          <p className="text-body text-fog">Anyone with the link can see these favorites.</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              aria-label="Share link"
              value={shareUrl}
              className="flex-1 rounded-xl border border-rail bg-seat px-3 py-2 font-mono text-meta text-screen outline-none"
            />
            <Button variant="primary" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
