'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Camera, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { profiles, avatars } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { movies as movieApi } from '@/lib/api';
import { usePreferences } from '@/hooks/usePreferences';
import TasteEditor from '@/components/profile/TasteEditor';
import { QUERY_STALE_TIME } from '@/lib/queryConfig';

const MAX_BIO = 280;
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { user, username, avatarUrl, bio, loading: authLoading, refreshProfile } = useAuth();
  const { preferences, save: savePreferences, isLoading: preferencesLoading } = usePreferences();
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [region, setRegion] = useState('US');
  const [providerIds, setProviderIds] = useState<number[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => { setBioInput(bio || ''); }, [bio]);
  useEffect(() => { if (username) setUsernameInput(username); }, [username]);
  useEffect(() => {
    setRegion(preferences.region);
    setProviderIds(preferences.preferred_provider_ids);
  }, [preferences]);

  const { data: regions = [], isError: regionsError, refetch: refetchRegions } = useQuery({
    queryKey: ['provider-regions'],
    queryFn: ({ signal }) => movieApi.providerRegions(signal),
    staleTime: QUERY_STALE_TIME.referenceData,
  });
  const { data: providers = [], isLoading: providersLoading, isError: providersError, refetch: refetchProviders } = useQuery({
    queryKey: ['provider-catalog', region],
    queryFn: ({ signal }) => movieApi.providerCatalog(region, 'movie', signal),
    enabled: Boolean(region),
    staleTime: QUERY_STALE_TIME.referenceData,
  });

  // Clean up object URLs
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Please choose an image file', 'error'); return; }
    if (f.size > MAX_AVATAR_BYTES) { toast('Image must be under 3 MB', 'error'); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!user) return;

    const nextUsername = usernameInput.trim();
    const usernameChanged = nextUsername !== (username || '');
    if (usernameChanged && !USERNAME_RE.test(nextUsername)) {
      toast('Username must be 3–20 letters, numbers, or underscores', 'error');
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (file) {
        const uploaded = await avatars.upload(user.id, file);
        if (!uploaded) { toast('Avatar upload failed', 'error'); setSaving(false); return; }
        newAvatarUrl = uploaded;
      }

      const { error } = await profiles.update(user.id, {
        username: nextUsername,
        avatar_url: newAvatarUrl,
        bio: bioInput.trim() || null,
      });
      if (error) {
        toast(error.code === '23505' ? 'That username is already taken' : 'Could not save profile', 'error');
        setSaving(false);
        return;
      }

      // Keep auth metadata in sync with the canonical profile username
      if (usernameChanged) await supabase.auth.updateUser({ data: { username: nextUsername } });

      await refreshProfile();
      setFile(null);
      toast('Profile updated');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setSavingAvailability(true);
    try {
      await savePreferences(region, providerIds);
      toast('Availability preferences saved');
    } catch {
      toast('Could not save availability preferences', 'error');
    } finally {
      setSavingAvailability(false);
    }
  };

  if (authLoading || !user) return <PageSpinner />;

  const shownAvatar = preview || avatarUrl;
  const dirty = !!file || bioInput.trim() !== (bio || '').trim() || usernameInput.trim() !== (username || '');

  return (
    <div className="mx-auto max-w-xl animate-fade-in space-y-6 px-5 py-8 sm:px-8">
      <h1 className="font-display text-display-md text-screen">Edit profile</h1>

      <div className="space-y-6 rounded-panel border border-rail bg-velvet p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-seat">
              {shownAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-fog" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile picture"
              className="focus-ring-raised absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-tungsten text-ink transition-colors hover:bg-tungsten-dim"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-title font-semibold text-screen">@{username || '…'}</p>
            <p className="truncate font-mono text-meta text-fog">{user.email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="focus-ring-raised mt-2 rounded-full text-ui text-tungsten hover:underline"
            >
              Change profile picture
            </button>
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="mb-2 block text-ui font-medium text-fog">Username</label>
          <div className="flex items-center rounded-xl border border-rail bg-seat transition-colors focus-within:border-tungsten focus-within:ring-2 focus-within:ring-tungsten/25">
            <span className="pl-3 text-ui text-fog">@</span>
            <input
              id="username"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ''))}
              maxLength={20}
              placeholder="username"
              className="flex-1 bg-transparent py-2.5 pl-1 pr-3 text-ui text-screen placeholder-fog outline-none"
            />
          </div>
          <p className="mt-1.5 text-meta text-fog">3–20 characters: letters, numbers, or underscores. This is how friends find you.</p>
        </div>

        {/* Bio */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="bio" className="text-ui font-medium text-fog">Bio</label>
            <span className={`font-mono text-meta ${bioInput.length > MAX_BIO ? 'text-ticket' : 'text-fog'}`}>
              {bioInput.length}/{MAX_BIO}
            </span>
          </div>
          <textarea
            id="bio"
            value={bioInput}
            onChange={e => setBioInput(e.target.value.slice(0, MAX_BIO))}
            maxLength={MAX_BIO}
            rows={3}
            placeholder="Tell your friends a little about your taste in movies…"
            className="w-full resize-none rounded-xl border border-rail bg-seat p-3 text-body text-screen placeholder-fog outline-none transition-colors focus:border-tungsten focus:ring-2 focus:ring-tungsten/25"
          />
          <p className="mt-1.5 text-meta text-fog">Your friends can see this on your profile.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={!dirty}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <TasteEditor />

      <section className="space-y-5 rounded-panel border border-rail bg-velvet p-6">
        <div>
          <h2 className="font-display text-title text-screen">Availability</h2>
          <p className="mt-1 text-body text-fog">Choose your country and the services you use. We’ll prioritize them when showing where a title is available.</p>
        </div>

        <label className="block space-y-2">
          <span className="text-ui font-medium text-fog">Country</span>
          <select
            value={region}
            onChange={event => { setRegion(event.target.value); setProviderIds([]); }}
            disabled={preferencesLoading || regions.length === 0}
            className="focus-ring w-full rounded-xl border border-rail bg-seat px-3 py-2.5 text-ui text-screen"
          >
            {regions.map(item => <option key={item.iso_3166_1} value={item.iso_3166_1}>{item.english_name}</option>)}
          </select>
          {regionsError && <button type="button" onClick={() => void refetchRegions()} className="focus-ring text-meta text-tungsten hover:underline">Couldn’t load countries. Try again.</button>}
        </label>

        <fieldset className="space-y-2">
          <legend className="text-ui font-medium text-fog">Preferred services</legend>
          {providersLoading ? (
            <div className="h-16 animate-pulse rounded-xl bg-seat" />
          ) : providersError ? (
            <button type="button" onClick={() => void refetchProviders()} className="focus-ring text-ui text-tungsten hover:underline">Couldn’t load services. Try again.</button>
          ) : providers.length ? (
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
              {providers.map(provider => {
                const selected = providerIds.includes(provider.provider_id);
                return <button key={provider.provider_id} type="button" onClick={() => setProviderIds(ids => selected ? ids.filter(id => id !== provider.provider_id) : [...ids, provider.provider_id])} className={`focus-ring rounded-full border px-3 py-1.5 text-ui transition-colors ${selected ? 'border-tungsten bg-tungsten/10 text-tungsten' : 'border-rail text-fog hover:bg-seat hover:text-screen'}`}>{provider.provider_name}</button>;
              })}
            </div>
          ) : <p className="text-meta text-fog">No service catalogue is available for this country yet.</p>}
        </fieldset>

        <div className="flex justify-end"><Button onClick={handleAvailabilitySave} loading={savingAvailability} disabled={preferencesLoading}>{savingAvailability ? 'Saving…' : 'Save availability'}</Button></div>
      </section>
    </div>
  );
}
