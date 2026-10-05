import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'light' | 'dark';
}

/** Asks before an action that cannot be undone */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Quay lại',
  onConfirm,
  onCancel,
  tone = 'light',
}) => {
  const dark = tone === 'dark';
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm" tone={tone}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            dark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className={`text-sm leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {message}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
            dark
              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
