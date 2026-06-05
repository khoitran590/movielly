'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookmarkCheck, Film, Tv, Lock, ChevronLeft, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getPosterUrl } from '@/lib/api';
import Button from '@/components/ui/Button';
import type { WatchlistItem, FriendProfile } from '@/types';

type View = 'loading' | 'ok' | 'not-friends' | 'notfound';

// Guard: ids come from the URL and are interpolated into PostgREST .or() filters,
// so reject anything that isn't a canonical UUID before querying.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [view, setView] = useState<View>('loading');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;
    if (!UUID_RE.test(id)) { setView('notfound'); return; }
    if (user.id === id) { router.replace('/watchlist'); return; }

    let active = true;
    (async () => {
      setView('loading');
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('id', id)
        .maybeSingle();
      if (!active) return;
      if (!prof) { setView('notfound'); return; }
      setProfile(prof);

      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
        .maybeSingle();
      if (!active) return;
      if (!friendship) { setView('not-friends'); return; }

      const [{ data: wl }, { data: shared }] = await Promise.all([
        supabase.from('watchlist').select('*').eq('user_id', id).order('added_at', { ascending: false }),
        supabase.from('shared_lists').select('share_token').eq('user_id', id).maybeSingle(),
      ]);
      if (!active) return;
      setItems(wl || []);
      setShareToken(shared?.share_token || null);
      setView('ok');
    })();
    return () => { active = false; };
  }, [user, id, router]);

  if (authLoading || !user || view === 'loading') {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const name = profile?.username || 'User';
  const initial = name[0]?.toUpperCase() || '?';

  const Header = (
    <div className="space-y-4">
      <Link href="/friends" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Friends
      </Link>
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-brand-light">{initial}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white truncate">@{name}</h1>
          {profile?.bio && <p className="text-sm text-slate-300 mt-0.5 line-clamp-2">{profile.bio}</p>}
          {view === 'ok' && (
            <p className="text-xs text-slate-500 mt-1">{items.length} {items.length === 1 ? 'title' : 'titles'} in their watchlist</p>
          )}
        </div>
        {view === 'ok' && shareToken && (
          <Link href={`/list/${shareToken}`} className="ml-auto">
            <Button variant="secondary" size="sm"><Heart className="w-4 h-4 text-red-400" /> Favorites</Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {Header}

      {view === 'notfound' && (
        <div className="glass rounded-2xl p-10 text-center text-slate-400">User not found.</div>
      )}

      {view === 'not-friends' && (
        <div className="glass rounded-2xl p-10 text-center space-y-3">
          <Lock className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-slate-300">This watchlist is private.</p>
          <p className="text-sm text-slate-500">You need to be friends with @{name} to see their watchlist.</p>
          <Link href="/friends"><Button variant="primary" size="sm" className="mt-2">Go to Friends</Button></Link>
        </div>
      )}

      {view === 'ok' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-semibold text-slate-100">Watchlist</h2>
          </div>

          {items.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-400">
              @{name} hasn&apos;t added anything to their watchlist yet.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const poster = getPosterUrl(item.movie_poster, 'w92');
                const href = item.movie_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="glass glass-interactive rounded-2xl flex items-center gap-4 p-3 group"
                  >
                    {poster ? (
                      <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0">
                        <Image src={poster} alt={item.movie_title} fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="w-12 aspect-[2/3] bg-surface-600 rounded-lg flex items-center justify-center shrink-0">
                        {item.movie_type === 'tv' ? <Tv className="w-5 h-5 text-slate-500" /> : <Film className="w-5 h-5 text-slate-500" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 line-clamp-1 group-hover:text-brand-light transition-colors">{item.movie_title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.movie_type === 'tv' ? 'bg-blue-600/20 text-blue-400' : 'bg-brand/20 text-brand-light'}`}>
                        {item.movie_type === 'tv' ? 'TV' : 'Film'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
