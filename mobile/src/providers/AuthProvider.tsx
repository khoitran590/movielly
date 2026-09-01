import type { Session, User } from '@supabase/supabase-js';
import type { FriendProfile } from '@movielly/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { authErrorMessage } from '@movielly/core';
import { hasBackendConfig } from '@/config';
import { profileRepo } from '@/lib/repositories';
import { supabase } from '@/lib/supabase';

type AuthValue = {
  session: Session | null; user: User | null; profile: FriendProfile | null; loading: boolean; configured: boolean;
  login(email: string, password: string): Promise<string | null>;
  signup(email: string, password: string, username: string): Promise<{ error: string | null; needsConfirmation: boolean }>;
  forgotPassword(email: string): Promise<string | null>;
  updatePassword(password: string): Promise<string | null>;
  signOut(): Promise<void>; refreshProfile(): Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);

async function applyAuthUrl(url: string) {
  const parsed = Linking.parse(url);
  const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
  const accessToken = String(parsed.queryParams?.access_token || hash?.get('access_token') || '');
  const refreshToken = String(parsed.queryParams?.refresh_token || hash?.get('refresh_token') || '');
  const code = String(parsed.queryParams?.code || '');
  if (code) await supabase.auth.exchangeCodeForSession(code);
  else if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;
  const loadProfile = useCallback(async (id: string) => { try { setProfile(await profileRepo.get(id)); } catch { setProfile(null); } }, []);

  useEffect(() => {
    if (!hasBackendConfig) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => { setSession(value); setLoading(false); });
    Linking.getInitialURL().then(url => { if (url) return applyAuthUrl(url); }).catch(() => undefined);
    const link = Linking.addEventListener('url', event => { void applyAuthUrl(event.url); });
    return () => { data.subscription.unsubscribe(); link.remove(); };
  }, []);
  useEffect(() => { if (user) void loadProfile(user.id); else setProfile(null); }, [user, loadProfile]);

  const value = useMemo<AuthValue>(() => ({
    session, user, profile, loading, configured: hasBackendConfig,
    async login(email, password) { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); return error ? authErrorMessage(error.message) : null; },
    async signup(email, password, username) { const redirectTo = Linking.createURL('/auth/callback'); const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username }, emailRedirectTo: redirectTo } }); return { error: error ? authErrorMessage(error.message) : null, needsConfirmation: !data.session }; },
    async forgotPassword(email) { const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('/reset-password') }); return error ? authErrorMessage(error.message) : null; },
    async updatePassword(password) { const { error } = await supabase.auth.updateUser({ password }); return error ? authErrorMessage(error.message) : null; },
    async signOut() { await supabase.auth.signOut(); },
    async refreshProfile() { if (user) await loadProfile(user.id); },
  }), [session, user, profile, loading, loadProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; }
export { applyAuthUrl };
