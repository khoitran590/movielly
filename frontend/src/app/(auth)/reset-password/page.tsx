'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';
import Spinner from '@/components/ui/Spinner';

const supabase = createClient();

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        if (hashParams.get('type') === 'recovery') setReady(true);
        else router.push('/forgot-password');
      }
    });
  }, [router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(authErrorMessage(error.message)); return; }
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  };

  if (success) {
    return (
      <AuthShell>
        <div className="space-y-2">
          <h1 className="font-display text-display-lg text-screen">Password updated.</h1>
          <p className="text-body text-fog">Taking you back to log in…</p>
        </div>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell>
        <div className="flex justify-center py-20"><Spinner /></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-2">
        <h1 className="font-display text-display-lg text-screen">Set a new password.</h1>
        <p className="text-body text-fog">Choose something you haven’t used before.</p>
      </div>

      <div className="rounded-panel border border-rail bg-velvet p-6">
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-xl bg-ticket/15 px-3 py-2.5 text-ui text-ticket">{error}</div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">Update password</Button>
        </form>
      </div>
    </AuthShell>
  );
}
