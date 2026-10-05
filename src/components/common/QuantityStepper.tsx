import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  /** Used to tell the steppers of different products apart for screen readers */
  label: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  max,
  min = 1,
  onChange,
  size = 'md',
  label,
}) => {
  const button =
    size === 'sm'
      ? 'w-8 h-8'
      : 'w-10 h-10';

  return (
    <div
      className="inline-flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50"
      role="group"
      aria-label={`Số lượng ${label}`}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Giảm số lượng"
        className={`${button} flex items-center justify-center text-zinc-600 hover:bg-zinc-200 disabled:text-zinc-300 disabled:hover:bg-transparent transition-colors`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span
        className={`min-w-8 px-1 text-center font-bold tabular-nums text-zinc-900 ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Tăng số lượng"
        className={`${button} flex items-center justify-center text-zinc-600 hover:bg-zinc-200 disabled:text-zinc-300 disabled:hover:bg-transparent transition-colors`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
