'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Clapperboard } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 mb-2">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Email sent</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            If <strong className="text-slate-200">{email}</strong> has an account,<br />
            you'll receive a password reset link shortly.
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
          <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send Reset Link
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Remember it?{' '}
            <Link href="/login" className="text-brand-light hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </div>
    </AuthShell>
  );
}
