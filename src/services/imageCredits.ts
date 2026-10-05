import { SAMPLE_IMAGES, SampleImage } from '../../shared/sampleImages';
import { Product } from '../types';

const CREDIT_BY_URL = new Map<string, SampleImage>(
  Object.values(SAMPLE_IMAGES)
    .flat()
    .map((image) => [image.url, image])
);

/** Who made a photo and under which licence; nothing for photos the shop uploaded itself */
export function getImageCredit(url: string | undefined): SampleImage | undefined {
  return url ? CREDIT_BY_URL.get(url) : undefined;
}

export type CreditedPhoto = { product: Product; credit: SampleImage };

/** The credited photos that the shop is showing at the moment, in catalogue order */
export function getCreditedPhotos(products: Product[]): CreditedPhoto[] {
  return products.flatMap((product) =>
    product.images.flatMap((url) => {
      const credit = getImageCredit(url);
      return credit ? [{ product, credit }] : [];
    })
  );
}

const LICENSE_PAGES: Record<string, string> = {
  CC0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/',
};

/** The licence text for a licence name such as "CC BY-SA 4.0" */
export function getLicenseUrl(license: string): string | undefined {
  if (LICENSE_PAGES[license]) return LICENSE_PAGES[license];
  const match = /^CC (BY(?:-SA)?) (\d\.\d)(?: ([a-z]{2}))?$/i.exec(license);
  if (!match) return undefined;
  const [, terms, version, country] = match;
  return `https://creativecommons.org/licenses/${terms.toLowerCase()}/${version}/${country ? `${country}/` : ''}`;
}
