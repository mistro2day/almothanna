import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, CheckCheck, Circle, X } from 'lucide-react';

export default function NotificationsCenter() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connectSSE,
    disconnectSSE,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);

  useEffect(() => {
    if (!user || !user.id) return;
    fetchNotifications(user.id);

    // Hybrid Sync fallback: Poll every 5 seconds to sync notifications instantly
    // under all local network conditions or proxy setups
    const interval = setInterval(() => {
      fetchNotifications(user.id);
    }, 5000);

    // Connect to SSE for real-time notifications
    connectSSE(user.id, (newNotif) => {
      // Play a subtle notification sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.4;
        audio.play();
      } catch (e) {
        console.log('Audio autoplay blocked');
      }

      // Show toast
      setToast({
        id: newNotif.id,
        title: newNotif.title,
        message: newNotif.message,
      });

      // Clear toast after 5 seconds
      setTimeout(() => {
        setToast((prev) => (prev?.id === newNotif.id ? null : prev));
      }, 5000);
    });

    return () => {
      clearInterval(interval);
      disconnectSSE();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative" dir="rtl">
      {/* Real-time Toast Pop-up */}
      {toast && (
        <div 
          className="fixed bottom-24 md:bottom-auto md:top-6 left-6 z-50 p-4 rounded-2xl border-2 border-emerald-500 shadow-2xl animate-shake max-w-sm flex items-start gap-3 backdrop-blur-md"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 text-right text-xs">
            <h4 className="font-bold text-sm text-[var(--text-primary)]">{toast.title}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[var(--border-color)]/50 hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing text-emerald-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] animate-pulse border border-[var(--bg-primary)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div 
            className="fixed md:absolute top-16 md:top-full left-4 right-4 md:left-0 md:right-auto mt-2 md:w-96 rounded-2xl border border-[var(--border-color)] shadow-2xl z-[101] overflow-hidden animate-zoom-in text-right max-h-[500px] flex flex-col"
            style={{ backgroundColor: 'var(--bg-secondary)', opacity: 1 }}
          >
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <button
                onClick={() => {
                  markAllAsRead(user.id);
                }}
                className="text-xs text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">التنبيهات والإشعارات</h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  لا توجد إشعارات جديدة حالياً.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      notif.isRead ? 'hover:bg-[var(--border-color)]/25' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="mt-1 text-emerald-500">
                        <Circle className="w-2.5 h-2.5 fill-current animate-pulse" />
                      </div>
                    )}
                    <div className="flex-1 text-right">
                      <h4 className={`text-xs font-bold ${notif.isRead ? 'text-[var(--text-primary)]' : 'text-emerald-500'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{notif.message}</p>
                      <span className="text-[9px] text-[var(--text-secondary)] block mt-1 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
