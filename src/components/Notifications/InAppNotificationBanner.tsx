import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTelegram } from '../../context/TelegramContext';
import { notificationEngine } from '../../services/NotificationEngine';
import { Bell, X, MessageSquare, Target, Sparkles, Phone } from 'lucide-react';
import { InAppNotification } from '../../types';

interface InAppNotificationBannerProps {
  notifications?: InAppNotification[];
  onDismiss?: (id: string) => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notifications,
  onDismiss,
}) => {
  const context = useTelegram();
  const list = Array.isArray(notifications)
    ? notifications
    : Array.isArray(context.inAppNotifications)
    ? context.inAppNotifications
    : [];
  const dismiss = onDismiss || context.dismissNotification;

  if (!list || list.length === 0) return null;

  const handleNotificationClick = (notif: InAppNotification) => {
    if (notif.chatId) {
      if (context.setActiveChatId) {
        context.setActiveChatId(notif.chatId);
      } else {
        notificationEngine.navigateToChat(notif.chatId);
      }
    }
    dismiss(notif.id);
  };

  return (
    <div className="fixed top-4 end-4 z-[9999] max-w-sm w-full space-y-2 pointer-events-none px-3 sm:px-0">
      <AnimatePresence>
        {list.slice(0, 3).map((notif) => {
          const isKeyword = notif.category === 'keyword_alert';
          const isCall = notif.category === 'call';

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full bg-[#1e2c3a]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-[#2b5278]/60 flex items-start gap-3 hover:border-[#5288c1] transition-all cursor-pointer group"
              onClick={() => handleNotificationClick(notif)}
            >
              {/* Avatar or Category Icon */}
              <div className="relative shrink-0 mt-0.5">
                {notif.avatar && !notif.avatar.startsWith('bg-') ? (
                  <img
                    src={notif.avatar}
                    alt={notif.title}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/30"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                      isKeyword
                        ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white'
                        : isCall
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
                        : 'bg-gradient-to-tr from-[#2481cc] to-sky-400 text-white'
                    }`}
                  >
                    {isKeyword ? (
                      <Target className="w-5 h-5" />
                    ) : isCall ? (
                      <Phone className="w-5 h-5" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>
                )}
                {isKeyword && (
                  <span className="absolute -bottom-1 -end-1 p-0.5 bg-amber-400 text-slate-900 rounded-full shadow">
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {notif.body}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(notif.id);
                }}
                className="shrink-0 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors mt-0.5"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
