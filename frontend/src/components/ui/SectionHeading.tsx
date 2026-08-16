import type { ElementType, ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  count?: number;
  trailing?: ReactNode;
  tone?: 'default' | 'urgent';
  level?: 'h2' | 'h3';
  className?: string;
}

export default function SectionHeading({
  children,
  count,
  trailing,
  tone = 'default',
  level = 'h2',
  className = '',
}: SectionHeadingProps) {
  const Heading = level as ElementType;
  const suffix = count !== undefined ? count : trailing;

  return (
    <Heading className={`text-ui font-semibold uppercase tracking-[0.08em] text-fog ${className}`}>
      {children}
      {suffix !== undefined && suffix !== null && (
        <span className={`ml-2 font-mono normal-case tracking-normal ${tone === 'urgent' ? 'text-ticket' : ''}`}>
          {suffix}
        </span>
      )}
    </Heading>
  );
}
