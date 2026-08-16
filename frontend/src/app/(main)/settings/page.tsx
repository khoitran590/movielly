'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { profiles, avatars } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

const MAX_BIO = 280;
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3 MB
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { user, username, avatarUrl, bio, loading: authLoading, refreshProfile } = useAuth();
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => { setBioInput(bio || ''); }, [bio]);
  useEffect(() => { if (username) setUsernameInput(username); }, [username]);

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
    </div>
  );
}
