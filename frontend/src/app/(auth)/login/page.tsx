'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Clapperboard } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/');
    router.refresh();
  };

  return (
    <AuthShell>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 mb-4">
            <Clapperboard className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Log in to your Movielly account</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-brand-light hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Log in
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-light hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
    </AuthShell>
  );
}
