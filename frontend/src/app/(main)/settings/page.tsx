'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { profiles, avatars } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

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

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const shownAvatar = preview || avatarUrl;
  const dirty = !!file || bioInput.trim() !== (bio || '').trim() || usernameInput.trim() !== (username || '');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Edit Profile</h1>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-brand/20 border border-brand/30 overflow-hidden flex items-center justify-center">
              {shownAvatar ? (
                <img src={shownAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-brand-light" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand hover:bg-brand-light text-white flex items-center justify-center shadow-lg transition-colors"
              title="Change picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-100 truncate">@{username || '…'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <button onClick={() => fileRef.current?.click()} className="mt-2 text-sm text-brand-light hover:underline">
              Change profile picture
            </button>
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="text-sm font-medium text-slate-300 block mb-2">Username</label>
          <div className="flex items-center bg-surface-700 border border-surface-500 rounded-xl focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all">
            <span className="pl-3 text-slate-400 text-sm">@</span>
            <input
              id="username"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ''))}
              maxLength={20}
              placeholder="username"
              className="flex-1 bg-transparent py-2.5 pl-1 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">3–20 characters: letters, numbers, or underscores. This is how friends find you.</p>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="bio" className="text-sm font-medium text-slate-300">Bio</label>
            <span className={`text-xs ${bioInput.length > MAX_BIO ? 'text-red-400' : 'text-slate-500'}`}>
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
            className="w-full bg-surface-700 border border-surface-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-1.5">Your friends can see this on your profile.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={!dirty}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
