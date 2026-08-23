'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
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
    if (error) { setError(authErrorMessage(error.message)); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="space-y-3">
          <h1 className="font-display text-display-lg text-screen">Check your email.</h1>
          <p className="text-body text-fog">
            If <span className="text-screen">{email}</span> has an account, a reset link is on its way.
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
        <h1 className="font-display text-display-lg text-screen">We’ll find you.</h1>
        <p className="text-body text-fog">Enter your email and we’ll send a reset link.</p>
      </div>

      <div className="rounded-panel border border-rail bg-velvet p-6">
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
            <div className="rounded-xl bg-ticket/15 px-3 py-2.5 text-ui text-ticket">{error}</div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">Send reset link</Button>
        </form>

        <p className="mt-5 text-center text-ui text-fog">
          Remember it?{' '}
          <Link href="/login" className="rounded-full font-medium text-tungsten hover:underline">Back to log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
