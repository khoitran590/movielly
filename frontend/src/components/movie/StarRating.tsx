'use client';

import { useRef, useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' };

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const controlRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(0);
  const interactive = !readonly && Boolean(onChange);
  const displayed = preview || value;

  const valueFromPointer = (clientX: number) => {
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return value;
    return Math.max(1, Math.min(10, Math.ceil(((clientX - rect.left) / rect.width) * 10)));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!interactive) return;
    let next = value;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(10, Math.max(1, value + 1));
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, value - 1);
    else if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 10;
    else return;
    event.preventDefault();
    onChange?.(next);
  };

  return (
    <div className="flex items-center gap-2">
      <div
        ref={controlRef}
        role={interactive ? 'slider' : 'img'}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? 'Rating' : `Rating: ${value} out of 10`}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 10 : undefined}
        aria-valuenow={interactive ? value : undefined}
        aria-valuetext={interactive ? (value ? `${value} out of 10` : 'Not rated') : undefined}
        onKeyDown={handleKeyDown}
        onPointerMove={(event) => interactive && setPreview(valueFromPointer(event.clientX))}
        onPointerLeave={() => setPreview(0)}
        onClick={(event) => interactive && onChange?.(valueFromPointer(event.clientX))}
        className={`flex items-center gap-0.5 rounded ${interactive ? 'focus-ring-raised min-h-11 cursor-pointer touch-none' : ''}`}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(2, displayed - index * 2)) * 50;
          const hitArea = interactive
            ? 'flex h-11 w-11 items-center justify-center [@media(pointer:fine)]:h-auto [@media(pointer:fine)]:w-auto [@media(pointer:fine)]:p-0.5'
            : '';
          return (
            <span key={index} className={`relative block ${hitArea}`} aria-hidden>
              <Star className={`${sizes[size]} fill-transparent text-rail`} />
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <span className={`block ${hitArea}`}>
                  <Star className={`${sizes[size]} fill-tungsten text-tungsten`} />
                </span>
              </span>
            </span>
          );
        })}
      </div>
      {value > 0 && <span className="font-mono text-meta text-tungsten">{value}/10</span>}
    </div>
  );
}
