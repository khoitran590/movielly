'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  username: null,
  avatarUrl: null,
  bio: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (uid: string, metaName?: string | null) => {
    if (metaName !== undefined) setUsername(prev => prev ?? metaName ?? null);
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, bio')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
      setBio(data.bio);
    }
  }, []);

  // Load the canonical profile from the profiles table whenever the user changes.
  useEffect(() => {
    if (!user) { setUsername(null); setAvatarUrl(null); setBio(null); return; }
    const metaName = (user.user_metadata?.username as string | undefined) || null;
    loadProfile(user.id, metaName);
  }, [user, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, username, avatarUrl, bio, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
