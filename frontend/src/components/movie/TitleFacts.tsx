interface Fact {
  label: string;
  value: string | number | null | undefined;
  /** Numbers, runtimes and counts are set in the data face. */
  mono?: boolean;
}

// Director / status / seasons as a definition list on one quiet panel.
export default function TitleFacts({ facts }: { facts: Fact[] }) {
  const shown = facts.filter(f => f.value !== null && f.value !== undefined && f.value !== '');
  if (shown.length === 0) return null;

  return (
    <section className="space-y-3 rounded-panel bg-velvet p-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">Details</h2>
      <dl className="space-y-2">
        {shown.map(f => (
          <div key={f.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-ui text-fog">{f.label}</dt>
            <dd className={`text-ui text-screen ${f.mono ? 'font-mono' : ''}`}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
