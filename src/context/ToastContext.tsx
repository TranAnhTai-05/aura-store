import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { STORAGE_ERROR_EVENT } from '../services/events';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const MAX_TOASTS = 3;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const removeToast = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => {
        // Repeating an action should not stack identical messages
        const withoutDuplicate = prev.filter((t) => t.message !== message);
        return [...withoutDuplicate, { id, message, type }].slice(-MAX_TOASTS);
      });
      // Errors stay a little longer so they can be read
      timers.current.set(id, window.setTimeout(() => removeToast(id), type === 'error' ? 5000 : 3500));
    },
    [removeToast]
  );

  useEffect(() => {
    const handleStorageError = () =>
      showToast('Không thể lưu dữ liệu: bộ nhớ trình duyệt đã đầy hoặc bị chặn.', 'error');
    window.addEventListener(STORAGE_ERROR_EVENT, handleStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handleStorageError);
  }, [showToast]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[60] flex flex-col gap-2 pointer-events-none sm:max-w-sm sm:w-full"
        aria-live="polite"
        data-print-hidden
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md aura-rise-in ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-white border-rose-800'
                : 'bg-zinc-900/95 text-white border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng thông báo"
              className="text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
