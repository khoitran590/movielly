'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Share2, Copy, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/ui/Toast';
import { lists, savedToMovie } from '@/lib/api';
import { sharedLists } from '@/lib/db';
import MovieCard from '@/components/movie/MovieCard';
import { GRID_CLASS } from '@/components/movie/MovieGrid';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';

export default function FavoritesPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const { items } = useFavorites();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('My Favorites');

  const { data: shared, refetch } = useQuery({
    queryKey: ['shared-list', user?.id],
    queryFn: () => sharedLists.getMine(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Keep the rename field in sync with the loaded list title.
  useEffect(() => {
    if (shared?.title) setTitle(shared.title);
  }, [shared?.title]);

  const shareUrl = shared ? `${window.location.origin}/list/${shared.share_token}` : '';

  const openShare = () => setShareModalOpen(true);

  // Create the link (mints a token through the backend) or apply a renamed title.
  const createOrRename = async () => {
    if (!session?.access_token) return;
    setBusy(true);
    try {
      if (shared) {
        const { error } = await sharedLists.updateTitle(user!.id, title.trim() || 'My Favorites');
        if (error) throw error;
        toast('List name updated');
      } else {
        await lists.share(session.access_token, title.trim() || 'My Favorites');
        toast('Share link created');
      }
      await refetch();
    } catch {
      toast('Could not update your shared list', 'error');
    } finally {
      setBusy(false);
    }
  };

  const unshare = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await sharedLists.remove(user.id);
      if (error) throw error;
      await refetch();
      toast('Sharing stopped — the link no longer works');
      setShareModalOpen(false);
    } catch {
      toast('Could not stop sharing', 'error');
    } finally {
      setBusy(false);
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
          <Button variant="secondary" onClick={openShare} size="sm" className="border-tungsten text-tungsten hover:border-tungsten hover:bg-tungsten/10">
            <Share2 className="w-4 h-4" /> {shared ? 'Manage sharing' : 'Share'}
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

      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title={shared ? 'Manage sharing' : 'Share this list'}>
        <div className="space-y-4">
          <p className="text-body text-fog">
            {shared
              ? 'Anyone with the link can see these favorites. Rename it or stop sharing below.'
              : 'Create a public link so anyone can see these favorites.'}
          </p>

          <label className="block space-y-1.5">
            <span className="font-mono text-meta text-fog">List name</span>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-rail bg-seat px-3 py-2 text-ui text-screen outline-none focus:border-tungsten"
            />
          </label>

          {shared && (
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                aria-label="Share link"
                value={shareUrl}
                className="flex-1 rounded-xl border border-rail bg-seat px-3 py-2 font-mono text-meta text-screen outline-none"
              />
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={createOrRename} loading={busy}>
              {shared ? 'Save name' : 'Create link'}
            </Button>
            {shared && (
              <button
                onClick={unshare}
                disabled={busy}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-ui text-fog transition-colors hover:bg-ticket/10 hover:text-ticket disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Stop sharing
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
