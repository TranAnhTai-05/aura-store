import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
  /** Drops the card frame when the state already sits inside one */
  bare?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  tone = 'light',
  bare = false,
}) => {
  const dark = tone === 'dark';
  const frame = bare
    ? ''
    : dark
    ? 'bg-zinc-900 border border-zinc-800 rounded-3xl'
    : 'bg-white border border-zinc-200/80 rounded-3xl';

  return (
    <div className={`px-6 py-12 text-center ${frame}`}>
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
          dark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
        }`}
      >
        {icon}
      </div>
      <h3 className={`text-base font-bold mb-1 ${dark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
      {description && (
        <p className={`text-sm max-w-sm mx-auto ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
};
