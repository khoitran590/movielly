'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

export default function StarRating({ value, onChange, readonly = false, max = 10, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-all duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= displayed
                ? 'fill-gold text-gold'
                : 'fill-transparent text-slate-600'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1.5 text-sm font-semibold text-gold">{value}/{max}</span>
      )}
    </div>
  );
}
