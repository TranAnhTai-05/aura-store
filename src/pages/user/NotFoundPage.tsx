import React from 'react';
import { Link } from '../../router/RouterContext';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  homePath?: string;
  homeLabel?: string;
  tone?: 'light' | 'dark';
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = 'Không tìm thấy trang',
  description = 'Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.',
  homePath = '/',
  homeLabel = 'Về trang chủ',
  tone = 'light',
}) => {
  const dark = tone === 'dark';
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        Lỗi 404
      </p>
      <h1 className={`text-2xl sm:text-3xl font-extrabold font-display mb-3 ${dark ? 'text-white' : 'text-zinc-950'}`}>
        {title}
      </h1>
      <p className={`text-sm max-w-md mb-8 ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>{description}</p>
      <Link
        to={homePath}
        className={`px-6 py-3 rounded-xl text-xs font-bold transition-colors ${
          dark
            ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
        }`}
      >
        {homeLabel}
      </Link>
    </div>
  );
};
