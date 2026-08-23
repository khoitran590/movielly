'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';

export default function SignupPage() {
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);
    if (error) { setError(authErrorMessage(error.message)); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <AuthShell>
        <div className="space-y-3">
          <h1 className="font-display text-display-lg text-screen">Check your email.</h1>
          <p className="text-body text-fog">
            We sent a confirmation link to <span className="text-screen">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="inline-block rounded-full text-ui text-tungsten hover:underline">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-2">
        <h1 className="font-display text-display-lg text-screen">Take a seat.</h1>
        <p className="text-body text-fog">Keep what you watch, and pass it on.</p>
      </div>

      <div className="rounded-panel border border-rail bg-velvet p-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="cinephile42"
            icon={<User className="w-4 h-4" />}
            required
            autoComplete="username"
          />
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
            placeholder="At least 8 characters"
            icon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
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

          <Button type="submit" loading={loading} className="w-full" size="lg">Create account</Button>
        </form>

        <p className="mt-5 text-center text-ui text-fog">
          Already have an account?{' '}
          <Link href="/login" className="rounded-full font-medium text-tungsten hover:underline">Log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
