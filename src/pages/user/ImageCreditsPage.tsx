import React, { useMemo } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { Link } from '../../router/RouterContext';
import { useAppStore } from '../../context/StoreContext';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductImage } from '../../components/common/ProductImage';
import { getCreditedPhotos, getLicenseUrl } from '../../services/imageCredits';

export const ImageCreditsPage: React.FC = () => {
  const { activeProducts } = useAppStore();
  const photos = useMemo(() => getCreditedPhotos(activeProducts), [activeProducts]);

  return (
    <div className="min-h-screen bg-[#fafaf9] py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-extrabold text-zinc-950 font-display">Nguồn hình ảnh</h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Ảnh sản phẩm trên trang được lấy từ{' '}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-900 underline underline-offset-2"
            >
              Wikimedia Commons
            </a>{' '}
            và được dùng theo giấy phép tự do ghi bên cạnh từng ảnh. Ảnh chỉ mang tính minh họa cho
            loại sản phẩm: thiết bị trong ảnh thuộc về nhà sản xuất của chúng và không phải là sản
            phẩm của AURA. Ảnh được hiển thị nguyên bản, chỉ thu nhỏ và cắt theo khung hình.
          </p>
        </div>

        {photos.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="w-6 h-6" />}
            title="Chưa có ảnh nào cần ghi nguồn"
            description="Các sản phẩm đang bán chỉ dùng ảnh do cửa hàng tự tải lên."
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map(({ product, credit }) => {
              const licenseUrl = getLicenseUrl(credit.license);
              return (
                <li
                  key={credit.url}
                  className="flex gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                    <ProductImage product={product} src={credit.url} />
                  </div>
                  <div className="min-w-0 space-y-1 text-xs text-zinc-500">
                    <Link
                      to={`/products/${product.id}`}
                      className="block text-sm font-semibold text-zinc-900 hover:underline truncate"
                    >
                      {product.name}
                    </Link>
                    <a
                      href={credit.source}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-zinc-700 hover:underline"
                    >
                      <span className="truncate">“{credit.title}”</span>
                      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </a>
                    <p className="truncate">Tác giả: {credit.author}</p>
                    <p>
                      Giấy phép:{' '}
                      {licenseUrl ? (
                        <a
                          href={licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-700 hover:underline"
                        >
                          {credit.license}
                        </a>
                      ) : (
                        credit.license
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
