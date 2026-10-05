import React, { useState } from 'react';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/common/FormField';
import { usePending } from '../../hooks/usePending';
import { EMAIL_HINT, isValidEmail } from '../../utils/validation';
import { SHOP } from '../../config/shop';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

type Field = 'name' | 'email' | 'message';

export const ContactPage: React.FC = () => {
  const { currentUser, submitContactMessage } = useAppStore();
  const { showToast } = useToast();

  const [values, setValues] = useState<Record<Field, string>>({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [isSent, setIsSent] = useState(false);
  const [pending, run] = usePending();

  const setField =
    (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found: Partial<Record<Field, string>> = {};
    if (values.name.trim().length < 2) found.name = 'Vui lòng nhập họ và tên.';
    if (!isValidEmail(values.email)) found.email = EMAIL_HINT;
    if (values.message.trim().length < 10) found.message = 'Nội dung cần có ít nhất 10 ký tự.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await run(() => submitContactMessage(values));
    if (!result) return;
    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }
    setIsSent(true);
    setValues((prev) => ({ ...prev, message: '' }));
  };

  const contactRows = [
    { icon: MapPin, title: 'Flagship Store TP. Hồ Chí Minh', text: SHOP.address },
    {
      icon: MapPin,
      title: 'Showroom Hà Nội',
      text: '18 Lý Thường Kiệt, Phường Phan Chu Trinh, Quận Hoàn Kiếm',
    },
    {
      icon: Phone,
      title: 'Hotline',
      text: `${SHOP.hotline} (8h00 – 21h30 hàng ngày)`,
      href: `tel:${SHOP.hotline.replace(/\s/g, '')}`,
    },
    { icon: Mail, title: 'Email', text: SHOP.supportEmail, href: `mailto:${SHOP.supportEmail}` },
    { icon: Clock, title: 'Giờ mở cửa showroom', text: 'Thứ Hai – Chủ Nhật: 09:00 – 21:30' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Hỗ trợ khách hàng
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 font-display">
            Liên Hệ Với AURA
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Chúng tôi luôn sẵn sàng tư vấn sản phẩm và hỗ trợ đơn hàng của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-zinc-900 font-display">Thông tin liên hệ</h2>

            <ul className="space-y-5 text-sm text-zinc-600">
              {contactRows.map(({ icon: Icon, title, text, href }) => (
                <li key={title} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-900 block">{title}</strong>
                    {href ? (
                      <a href={href} className="hover:text-zinc-900 hover:underline">
                        {text}
                      </a>
                    ) : (
                      <span>{text}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
            {isSent ? (
              <div className="py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 font-display mb-2">
                  Đã gửi tin nhắn
                </h2>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                  Cảm ơn bạn đã liên hệ. Đội ngũ AURA sẽ phản hồi qua email{' '}
                  <strong className="text-zinc-800 break-all">{values.email}</strong> trong thời gian
                  sớm nhất.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base font-bold text-zinc-900 font-display mb-2">
                  Gửi tin nhắn cho chúng tôi
                </h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Nếu câu hỏi liên quan đến đơn hàng, vui lòng ghi kèm mã đơn.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Họ và tên" required error={errors.name}>
                      {(control) => (
                        <input
                          {...control}
                          type="text"
                          autoComplete="name"
                          value={values.name}
                          onChange={setField('name')}
                          placeholder="Nguyễn Văn A"
                        />
                      )}
                    </FormField>

                    <FormField label="Địa chỉ Email" required error={errors.email}>
                      {(control) => (
                        <input
                          {...control}
                          type="email"
                          autoComplete="email"
                          value={values.email}
                          onChange={setField('email')}
                          placeholder="tenban@example.com"
                        />
                      )}
                    </FormField>
                  </div>

                  <FormField label="Nội dung cần hỗ trợ" required error={errors.message}>
                    {(control) => (
                      <textarea
                        {...control}
                        rows={5}
                        maxLength={2000}
                        value={values.message}
                        onChange={setField('message')}
                        placeholder="Tôi cần tư vấn về..."
                      />
                    )}
                  </FormField>

                  <button
                    type="submit"
                    disabled={pending}
                    className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>{pending ? 'Đang gửi...' : 'Gửi tin nhắn'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
