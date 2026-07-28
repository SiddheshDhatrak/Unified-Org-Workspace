import React from 'react';
import { useNotifications, useOrgContext } from '@workspace/hooks';
import { Bell, Check, ExternalLink, Inbox } from 'lucide-react';
import { cn } from '../utils';
import { notificationsFeed } from '@workspace/api-client';

/**
 * NotificationBell (§16.1 / §16.2 / §16.4)
 * Polling-driven real-time bell with unread counter and collapsed batching support.
 */
export const NotificationBell: React.FC = () => {
  const { orgId } = useOrgContext();
  const { data: notificationsData, refetch } = useNotifications(orgId);
  const [isOpen, setIsOpen] = React.useState(false);

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsFeed.markRead(orgId, id);
      refetch();
    } catch (e) {
      console.error('Error marking read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsFeed.markAllRead(orgId);
      refetch();
    } catch (e) {
      console.error('Error marking all read:', e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-all duration-200 shadow-sm focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in-0 zoom-in-95 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 py-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <Inbox className="w-8 h-8 text-zinc-600" />
                  <p className="text-xs">No unread notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-3 rounded-xl border transition-all duration-150 flex items-start gap-3',
                      n.read ? 'bg-zinc-900/40 border-white/5 opacity-70' : 'bg-white/5 border-white/10 shadow-sm hover:bg-white/10'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-indigo-300 truncate">{n.title}</p>
                        {n.count > 1 && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                            +{n.count - 1} more (§16.4)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-zinc-500 block mt-1.5 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark read"
                        className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 text-center">
              <a
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                <span>View All History</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
