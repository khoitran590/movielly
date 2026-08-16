'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMedia';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-velvet';

export default function StarRating({ value, onChange, readonly = false, max = 10, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const isMobile = useIsMobile();
  const displayed = hovered || value;
  const interactive = !readonly && !!onChange;

  // Ten 16px stars is not a touch target. On phones, pick the number instead.
  if (interactive && isMobile) {
    return (
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Rating out of ${max}`}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange!(n)}
            aria-pressed={value === n}
            className={`h-10 w-10 rounded-full border font-mono text-ui transition-colors ${focusRing} ${
              n === value
                ? 'border-tungsten bg-tungsten text-ink'
                : n < value
                  ? 'border-tungsten/40 bg-tungsten/10 text-tungsten'
                  : 'border-rail text-fog hover:border-screen hover:text-screen'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          aria-label={readonly ? undefined : `Rate ${star} out of ${max}`}
          className={`rounded transition-transform duration-100 ${
            readonly ? 'cursor-default' : `cursor-pointer p-0.5 hover:scale-110 ${focusRing}`
          }`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= displayed ? 'fill-tungsten text-tungsten' : 'fill-transparent text-rail'
            }`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-1.5 font-mono text-meta text-tungsten">{value}/{max}</span>}
    </div>
  );
}
