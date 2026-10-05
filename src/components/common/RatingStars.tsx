import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewsCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewsCount,
  size = 'sm',
  showCount = true,
}) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';

  if (reviewsCount === 0) {
    return <p className="text-xs text-zinc-400">Chưa có đánh giá</p>;
  }

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-zinc-500"
      role="img"
      aria-label={`${rating.toFixed(1)} trên 5 sao${
        reviewsCount !== undefined ? `, ${reviewsCount} đánh giá` : ''
      }`}
    >
      <div className="flex items-center text-amber-500" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-zinc-200 text-zinc-200'
            }`}
          />
        ))}
      </div>
      <span className="font-medium text-zinc-700 tabular-nums">{rating.toFixed(1)}</span>
      {showCount && reviewsCount !== undefined && (
        <span className="text-zinc-400">({reviewsCount})</span>
      )}
    </div>
  );
};
