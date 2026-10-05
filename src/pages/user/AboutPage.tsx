import React from 'react';
import { ShieldCheck, Award, Sparkles } from 'lucide-react';
import { Link } from '../../router/RouterContext';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafaf9] py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Về Thương Hiệu AURA
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 font-display">
            Kiến Tạo Phong Cách Sống Qua Thiết Kế Chuẩn Mực
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            AURA được thành lập với tầm nhìn tái định nghĩa trải nghiệm công nghệ hàng ngày: nơi vẻ đẹp tối giản của kiến trúc Bắc Âu kết hợp hoàn mỹ với kỹ nghệ gia công chính xác và âm thanh phòng thu trung thực.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Thiết Kế Tối Giản</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Loại bỏ mọi chi tiết thừa, tập trung vào công năng cốt lõi và vẻ đẹp tĩnh tại của không gian sống hiện đại.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Vật Liệu Thượng Hạng</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Titanium cấp 5 hàng không, nhôm nguyên khối Anodized và da tự nhiên bền đẹp trường tồn theo thời gian.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Bảo Hành 24 Tháng</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Chính sách 1 đổi 1 trong vòng 24 tháng cho mọi lỗi kỹ thuật phần cứng, kèm dịch vụ bảo dưỡng trọn đời.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-zinc-950 text-white p-8 sm:p-12 rounded-3xl space-y-6">
          <h2 className="text-2xl font-bold font-display">Cam Kết Về Trải Nghiệm Khách Hàng</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Chúng tôi tin rằng sự xa xỉ thực sự nằm ở sự yên tâm tuyệt đối. Tại AURA, mỗi đơn hàng không chỉ là một giao dịch, mà là khởi đầu cho sự gắn kết lâu dài. Đội ngũ kỹ sư và tư vấn viên của chúng tôi luôn sẵn sàng hỗ trợ bạn thiết lập không gian hoàn hảo nhất.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-white text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              Khám phá bộ sưu tập sản phẩm &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
