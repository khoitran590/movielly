'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((previous) => previous.filter((item) => item.id !== id));
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 3500));
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={`fixed left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 md:bottom-4 md:left-auto md:right-4 md:translate-x-0 ${user ? 'bottom-[var(--mobile-dock-clearance)]' : 'bottom-4'}`} role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-panel border border-rail bg-velvet px-4 py-3 text-ui text-screen shadow-poster animate-slide-up"
          >
            {t.type === 'success'
              ? <Check className="w-4 h-4 shrink-0 text-tungsten" />
              : <CircleAlert className="w-4 h-4 shrink-0 text-ticket" />}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="focus-ring-raised ml-1 rounded-full text-fog transition-colors hover:text-screen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
