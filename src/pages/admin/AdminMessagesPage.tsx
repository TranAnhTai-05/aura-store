import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/format';
import { ContactMessage } from '../../types';
import { Inbox, Mail, MailOpen, Trash2, Reply, Newspaper, Download } from 'lucide-react';

type Tab = 'messages' | 'subscribers';

export const AdminMessagesPage: React.FC = () => {
  const { messages, subscribers, setMessageRead, deleteMessage, removeSubscriber } = useAppStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('messages');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const visibleMessages = unreadOnly ? messages.filter((m) => !m.isRead) : messages;

  const report = async (request: Promise<{ ok: boolean; error?: string }>, success: string) => {
    const result = await request;
    if (result.ok) showToast(success);
    else showToast(result.error ?? 'Không thực hiện được thao tác.', 'error');
  };

  const exportSubscribers = () => {
    const rows = ['email,ngay_dang_ky', ...subscribers.map((s) => `${s.email},${s.createdAt}`)];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aura-ban-tin.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabButton = (value: Tab) =>
    `px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
      tab === value ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <AdminLayout title="Hộp Thư">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start" role="tablist">
            <button role="tab" aria-selected={tab === 'messages'} onClick={() => setTab('messages')} className={tabButton('messages')}>
              <Inbox className="w-3.5 h-3.5" />
              Tin nhắn liên hệ
              {unreadCount > 0 && (
                <span className="px-1.5 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-bold tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
            <button role="tab" aria-selected={tab === 'subscribers'} onClick={() => setTab('subscribers')} className={tabButton('subscribers')}>
              <Newspaper className="w-3.5 h-3.5" />
              Đăng ký bản tin
              <span className="text-zinc-500 tabular-nums">{subscribers.length}</span>
            </button>
          </div>

          {tab === 'messages' && messages.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 accent-amber-400"
              />
              Chỉ hiện tin chưa đọc
            </label>
          )}

          {tab === 'subscribers' && subscribers.length > 0 && (
            <button
              onClick={exportSubscribers}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 self-start"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất danh sách (CSV)
            </button>
          )}
        </div>

        {tab === 'messages' &&
          (visibleMessages.length === 0 ? (
            <EmptyState
              tone="dark"
              icon={<Inbox className="w-7 h-7" />}
              title={messages.length === 0 ? 'Chưa có tin nhắn nào' : 'Không còn tin chưa đọc'}
              description={
                messages.length === 0
                  ? 'Tin nhắn khách gửi từ trang Liên hệ sẽ xuất hiện tại đây.'
                  : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleMessages.map((message) => (
                <li
                  key={message.id}
                  className={`bg-zinc-900 border rounded-2xl p-5 ${
                    message.isRead ? 'border-zinc-800' : 'border-amber-400/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {!message.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-label="Chưa đọc" />
                        )}
                        <span className="truncate">{message.name}</span>
                      </p>
                      <p className="text-xs text-zinc-400 break-all">{message.email}</p>
                    </div>
                    <time className="text-xs text-zinc-500 tabular-nums shrink-0" dateTime={message.createdAt}>
                      {formatDate(message.createdAt)}
                    </time>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                    {message.message}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${message.email}?subject=${encodeURIComponent('AURA phản hồi yêu cầu của bạn')}`}
                      onClick={() => {
                        if (!message.isRead) setMessageRead(message.id, true);
                      }}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Trả lời qua email
                    </a>
                    <button
                      onClick={() =>
                        report(
                          setMessageRead(message.id, !message.isRead),
                          message.isRead ? 'Đã đánh dấu chưa đọc' : 'Đã đánh dấu đã đọc'
                        )
                      }
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {message.isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                      {message.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(message)}
                      className="ml-auto p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      aria-label={`Xóa tin nhắn của ${message.name}`}
                      title="Xóa tin nhắn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'subscribers' &&
          (subscribers.length === 0 ? (
            <EmptyState
              tone="dark"
              icon={<Newspaper className="w-7 h-7" />}
              title="Chưa có người đăng ký bản tin"
              description="Email khách đăng ký ở cuối trang cửa hàng sẽ xuất hiện tại đây."
            />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <ul className="divide-y divide-zinc-800">
                {subscribers.map((subscriber) => (
                  <li key={subscriber.email} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white break-all">{subscriber.email}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        Đăng ký {formatDate(subscriber.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        report(removeSubscriber(subscriber.email), `Đã gỡ ${subscriber.email}`)
                      }
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                      aria-label={`Gỡ ${subscriber.email} khỏi danh sách`}
                      title="Gỡ khỏi danh sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      <ConfirmDialog
        tone="dark"
        isOpen={!!deleteTarget}
        title="Xóa tin nhắn?"
        message={
          <>
            Tin nhắn của <strong className="text-white">{deleteTarget?.name}</strong> sẽ bị xóa vĩnh
            viễn.
          </>
        }
        confirmLabel="Xóa tin nhắn"
        onConfirm={() => {
          if (deleteTarget) report(deleteMessage(deleteTarget.id), 'Đã xóa tin nhắn');
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
};
