import React from 'react';
import { SHOP } from '../../config/shop';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Keeps a rendering error from leaving the customer with a blank page */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled rendering error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 bg-[#fafaf9]">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Đã xảy ra sự cố
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-950 font-display mb-3">
          Trang không thể hiển thị
        </h1>
        <p className="text-sm text-zinc-600 max-w-md mb-8 leading-relaxed">
          Rất tiếc vì sự bất tiện này. Giỏ hàng và đơn hàng của bạn vẫn được giữ nguyên. Vui lòng
          tải lại trang, hoặc gọi {SHOP.hotline} nếu sự cố còn tiếp diễn.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Tải lại trang
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }
}
