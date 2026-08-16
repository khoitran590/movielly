// Sentry verification route — never linked, never indexed.
export const metadata = { robots: { index: false, follow: false } };

export default function SentryExampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
