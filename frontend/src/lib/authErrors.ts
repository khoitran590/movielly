// Supabase surfaces raw, developer-facing auth error strings. Map the common
// ones to friendly copy; fall back to the original (or a generic line) so we
// never show a blank error.
export function authErrorMessage(raw: string | undefined | null): string {
  const msg = (raw || '').toLowerCase();
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('invalid login credentials')) return 'That email or password doesn’t look right.';
  if (msg.includes('email not confirmed')) return 'Please confirm your email first — check your inbox for the link.';
  if (msg.includes('already registered') || msg.includes('already exists')) return 'An account with this email already exists — try logging in.';
  if (msg.includes('password should be at least') || msg.includes('at least 6')) return 'Please choose a password of at least 6 characters.';
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) return 'Please enter a valid email address.';
  if (msg.includes('rate limit') || msg.includes('for security purposes')) return 'Too many attempts — please wait a moment and try again.';
  if (msg.includes('expired')) return 'That link has expired. Please request a new one.';
  if (msg.includes('same password')) return 'Your new password must be different from the old one.';
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Network problem — check your connection and try again.';
  return raw || 'Something went wrong. Please try again.';
}
