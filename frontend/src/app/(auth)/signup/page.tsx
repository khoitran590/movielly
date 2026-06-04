'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Clapperboard } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';

export default function SignupPage() {
  const router = useRouter();
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
    if (error) { setError(error.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <AuthShell>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 mb-2">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-slate-200">{email}</strong>.<br />
            Click it to activate your account.
          </p>
          <Link href="/login" className="text-brand-light hover:underline text-sm">Back to login</Link>
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
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start tracking your movies today</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl">
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
              label="Confirm Password"
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
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-light hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
    </AuthShell>
  );
}
