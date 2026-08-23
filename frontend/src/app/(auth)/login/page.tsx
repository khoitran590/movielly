'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
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
    if (error) { setError(authErrorMessage(error.message)); return; }
    router.push('/');
    router.refresh();
  };

  return (
    <AuthShell>
      <div className="space-y-2">
        <h1 className="font-display text-display-lg text-screen">Back again.</h1>
        <p className="text-body text-fog">Pick up where you left off.</p>
      </div>

      <div className="rounded-panel border border-rail bg-velvet p-6">
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
            <div className="rounded-xl bg-ticket/15 px-3 py-2.5 text-ui text-ticket">{error}</div>
          )}

          <div className="flex justify-end">
            <Link href="/forgot-password" className="rounded-full text-meta text-fog hover:text-screen">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">Log in</Button>
        </form>

        <p className="mt-5 text-center text-ui text-fog">
          No account yet?{' '}
          <Link href="/signup" className="rounded-full font-medium text-tungsten hover:underline">Sign up</Link>
        </p>
      </div>
    </AuthShell>
  );
}
