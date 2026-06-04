'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Clapperboard } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
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
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  };

  if (success) {
    return (
      <AuthShell>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 mb-2">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Password updated</h2>
          <p className="text-slate-400 text-sm">Redirecting you to login...</p>
        </div>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell>
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 mb-4">
            <Clapperboard className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-slate-400 mt-1 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Update Password
            </Button>
          </form>
        </div>
    </AuthShell>
  );
}
