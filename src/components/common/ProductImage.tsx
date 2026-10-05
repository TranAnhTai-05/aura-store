import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { getSizedImage, ImageWidth, isImageUrl } from '../../services/catalog';
import { ProductIllustration } from './ProductIllustration';

interface ProductImageProps {
  product: Pick<Product, 'name' | 'images' | 'illustrationType'>;
  /** Which of the product's images to show; defaults to the first one */
  src?: string;
  /** How wide the photo is shown, in pixels: list rows by default */
  width?: ImageWidth;
  className?: string;
}

/**
 * Shows a product photo. Products without photos (or whose photo fails to load)
 * fall back to the illustration of their product type.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  src,
  width = 250,
  className = 'w-full h-full',
}) => {
  const url = src ?? product.images.find(isImageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  if (!isImageUrl(url) || failed) {
    return <ProductIllustration type={product.illustrationType} className={className} />;
  }

  return (
    <img
      src={getSizedImage(url, width)}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover bg-zinc-100 ${className}`}
    />
  );
};
