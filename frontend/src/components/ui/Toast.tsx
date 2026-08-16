'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';

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
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Top-right so toasts never sit on the mobile dock. */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
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
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              aria-label="Dismiss"
              className="ml-1 text-fog transition-colors hover:text-screen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten rounded-full"
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
