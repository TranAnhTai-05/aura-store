import React from 'react';
import { WifiOff } from 'lucide-react';

type Tone = 'light' | 'dark';

/** Shown while the first data is on its way */
export const LoadingState: React.FC<{ label?: string; tone?: Tone }> = ({
  label = 'Đang tải...',
  tone = 'light',
}) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 py-16" role="status">
    <span
      className={`w-8 h-8 rounded-full border-2 animate-spin ${
        tone === 'dark' ? 'border-zinc-700 border-t-amber-400' : 'border-zinc-200 border-t-zinc-900'
      }`}
    />
    <span className={`text-sm ${tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</span>
  </div>
);

/** Shown when the server could not be reached, with a way to try again */
export const LoadErrorState: React.FC<{ onRetry: () => void; tone?: Tone }> = ({
  onRetry,
  tone = 'light',
}) => {
  const dark = tone === 'dark';
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16" role="alert">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
          dark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
        }`}
      >
        <WifiOff className="w-7 h-7" />
      </div>
      <h1 className={`text-xl font-bold font-display mb-2 ${dark ? 'text-white' : 'text-zinc-900'}`}>
        Không tải được dữ liệu
      </h1>
      <p className={`text-sm max-w-sm mb-6 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>
        Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng rồi thử lại.
      </p>
      <button
        onClick={onRetry}
        className={`px-6 py-3 rounded-xl text-xs font-bold transition-colors ${
          dark ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
        }`}
      >
        Thử lại
      </button>
    </div>
  );
};
