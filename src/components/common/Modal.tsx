import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Actions shown next to the close button, e.g. print */
  headerActions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
  /** Marks the panel as the only thing to print */
  printable?: boolean;
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Open dialogs, bottom to top. Only the top one reacts to Escape. */
const openModals: symbol[] = [];

/** Dialog shell shared by the storefront and the admin area: backdrop, ESC, scroll lock, focus */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  headerActions,
  size = 'md',
  tone = 'light',
  printable = false,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol('modal');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === token) {
        onCloseRef.current();
      }
    };

    openModals.push(token);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => {
      openModals.splice(openModals.indexOf(token), 1);
      if (openModals.length === 0) document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dark = tone === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className={`fixed inset-0 backdrop-blur-xs aura-fade-in ${dark ? 'bg-black/70' : 'bg-black/50'}`}
        onClick={onClose}
        data-print-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-print-area={printable ? '' : undefined}
        className={`relative w-full ${SIZES[size]} max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-8 aura-rise-in focus:outline-hidden ${
          dark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div
          className={`flex items-start justify-between gap-4 pb-4 mb-5 border-b ${
            dark ? 'border-zinc-800' : 'border-zinc-100'
          }`}
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              className={`text-lg font-bold font-display ${dark ? 'text-white' : 'text-zinc-950'}`}
            >
              {title}
            </h2>
            {description && (
              <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0" data-print-hidden>
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className={`p-2 rounded-xl transition-colors ${
                dark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};
