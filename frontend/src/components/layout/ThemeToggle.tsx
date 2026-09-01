'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export default function ThemeToggle({ expanded = false }: { expanded?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  const current = theme ?? 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  const label = `Use ${next} mode`;

  const toggle = () => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem('movielly:theme', next);
    } catch {
      // The theme still changes for this session if storage is unavailable.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={expanded ? undefined : label}
      className={`focus-ring flex h-10 w-full items-center rounded-lg text-fog transition-colors hover:bg-seat hover:text-screen ${
        expanded ? 'gap-3 px-3' : 'justify-center'
      }`}
    >
      {current === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
      {expanded && <span className="text-ui">{current === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
