import React, { useId } from 'react';

type Tone = 'light' | 'dark';

export function inputClass(tone: Tone = 'light', hasError = false): string {
  const base =
    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors focus:outline-hidden disabled:cursor-not-allowed';
  if (tone === 'dark') {
    return `${base} bg-zinc-950 text-white placeholder:text-zinc-600 disabled:text-zinc-500 ${
      hasError ? 'border-rose-500 focus:border-rose-400' : 'border-zinc-700 focus:border-amber-400'
    }`;
  }
  return `${base} bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 ${
    hasError ? 'border-rose-400 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-900'
  }`;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  tone?: Tone;
  className?: string;
  /** Receives the id and aria attributes the control has to carry */
  children: (control: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
    className: string;
  }) => React.ReactNode;
}

/** Label, control, hint and error message wired together for assistive technology */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  tone = 'light',
  className = '',
  children,
}) => {
  const id = useId();
  const messageId = `${id}-message`;
  const dark = tone === 'dark';

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-zinc-300' : 'text-zinc-700'}`}
      >
        {label}
        {required && <span className={dark ? 'text-amber-400' : 'text-rose-600'}> *</span>}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': error || hint ? messageId : undefined,
        className: inputClass(tone, !!error),
      })}
      {error ? (
        <p id={messageId} role="alert" className={`mt-1.5 text-xs ${dark ? 'text-rose-400' : 'text-rose-600'}`}>
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className={`mt-1.5 text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
