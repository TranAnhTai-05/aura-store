import { CartLine, Order, Product, Review } from '../types';
import { normalizeText } from '../utils/validation';
import { isCountedOrder } from './orders';

export type SortOption = 'newest' | 'bestseller' | 'rating' | 'price-asc' | 'price-desc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
];

export type PriceRange = { id: string; label: string; min: number; max: number };

export const PRICE_RANGES: PriceRange[] = [
  { id: 'under1m', label: 'Dưới 1.000.000₫', min: 0, max: 999_999 },
  { id: '1m-3m', label: '1.000.000₫ – 3.000.000₫', min: 1_000_000, max: 2_999_999 },
  { id: '3m-8m', label: '3.000.000₫ – 8.000.000₫', min: 3_000_000, max: 8_000_000 },
  { id: 'above8m', label: 'Trên 8.000.000₫', min: 8_000_001, max: Number.POSITIVE_INFINITY },
];

export const RATING_OPTIONS = [
  { value: 4.5, label: 'Từ 4.5 sao' },
  { value: 4, label: 'Từ 4 sao' },
  { value: 3, label: 'Từ 3 sao' },
];

export type ProductFilters = {
  search: string;
  category: string; // 'all' or a category name
  price: string; // 'all' or a PRICE_RANGES id
  minRating: number; // 0 for any
  inStockOnly: boolean;
  sort: SortOption;
};

export const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: 'all',
  price: 'all',
  minRating: 0,
  inStockOnly: false,
  sort: 'newest',
};

/** The words a product can be found by: its name, category and SKU */
function getSearchTokens(product: Product): string[] {
  const text = normalizeText([product.name, product.category, product.sku].join(' '));
  // "aur-kb-05" is searchable as a whole and by its parts
  return [...text.split(/\s+/), ...text.split(/[^a-z0-9]+/)].filter(Boolean);
}

/**
 * Every word of the query has to start a word of the product's name, category or SKU.
 * Descriptions are left out on purpose: they match almost any short word.
 */
export function matchesSearch(product: Product, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const tokens = getSearchTokens(product);
  return words.every((word) => tokens.some((token) => token.startsWith(word)));
}

/** Ranks a match so that hits in the name or SKU come before hits in the category */
function searchRank(product: Product, query: string): number {
  const q = normalizeText(query);
  if (normalizeText(product.sku) === q) return 0;
  const name = normalizeText(product.name);
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  if (normalizeText(product.category).includes(q)) return 4;
  return 3;
}

export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return [];
  return products
    .filter((product) => matchesSearch(product, query))
    .sort((a, b) => searchRank(a, query) - searchRank(b, query));
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const byNewest = (a: Product, b: Product) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  return [...products].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price || byNewest(a, b);
      case 'price-desc':
        return b.price - a.price || byNewest(a, b);
      case 'rating':
        return b.rating - a.rating || b.reviewsCount - a.reviewsCount || byNewest(a, b);
      case 'bestseller':
        return (
          (b.soldCount ?? 0) - (a.soldCount ?? 0) ||
          Number(!!b.isBestSeller) - Number(!!a.isBestSeller) ||
          byNewest(a, b)
        );
      default:
        return byNewest(a, b);
    }
  });
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const range = PRICE_RANGES.find((r) => r.id === filters.price);

  const matching = products.filter((product) => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (!matchesSearch(product, filters.search)) return false;
    if (range && (product.price < range.min || product.price > range.max)) return false;
    if (filters.minRating > 0 && product.rating < filters.minRating) return false;
    if (filters.inStockOnly && product.stock <= 0) return false;
    return true;
  });

  return sortProducts(matching, filters.sort);
}

export function getReviewStats(reviews: Review[]): Map<string, { count: number; average: number }> {
  const totals = new Map<string, { count: number; sum: number }>();
  for (const review of reviews) {
    const entry = totals.get(review.productId) ?? { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += review.rating;
    totals.set(review.productId, entry);
  }
  const stats = new Map<string, { count: number; average: number }>();
  totals.forEach(({ count, sum }, productId) => {
    stats.set(productId, { count, average: Math.round((sum / count) * 10) / 10 });
  });
  return stats;
}

export function getSoldCounts(orders: Order[]): Map<string, number> {
  const sold = new Map<string, number>();
  for (const order of orders) {
    if (!isCountedOrder(order)) continue;
    for (const item of order.items) {
      sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity);
    }
  }
  return sold;
}

export function getLineId(line: Pick<CartLine, 'productId' | 'selectedColor' | 'selectedCapacity'>) {
  return [line.productId, line.selectedColor ?? '', line.selectedCapacity ?? ''].join('::');
}

export function describeVariant(line: Pick<CartLine, 'selectedColor' | 'selectedCapacity'>): string {
  return [line.selectedColor, line.selectedCapacity].filter(Boolean).join(' · ');
}

export function isImageUrl(value: string | undefined): value is string {
  return !!value && /^(https?:\/\/|\/|data:image\/)/i.test(value);
}

export type ImageWidth = 250 | 500 | 960;

const COMMONS_THUMBNAIL = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/.+\/thumb\/.+\/)\d+px-([^/]+)$/;

/**
 * The same photo at the width the page needs. Only Wikimedia Commons offers its photos
 * in several sizes; any other address is returned as it is.
 */
export function getSizedImage(url: string, width: ImageWidth): string {
  const match = COMMONS_THUMBNAIL.exec(url);
  return match ? `${match[1]}${width}px-${match[2]}` : url;
}

export function getProductImages(product: Product): string[] {
  return product.images.filter(isImageUrl);
}
