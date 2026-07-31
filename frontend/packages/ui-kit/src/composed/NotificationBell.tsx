import React from 'react';
import { useNotifications, useOrgContext } from '@workspace/hooks';
import { Bell, Check, Inbox } from 'lucide-react';
import { cn } from '../utils';
import { notificationsFeed } from '@workspace/api-client';

export const NotificationBell: React.FC = () => {
  const { orgId } = useOrgContext();
  const { data: notificationsData, refetch } = useNotifications(orgId);
  const [isOpen, setIsOpen] = React.useState(false);

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try { await notificationsFeed.markRead(orgId, id); refetch(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await notificationsFeed.markAllRead(orgId); refetch(); } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-1.5 w-80 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 z-50 animate-fade-up"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent-text)' }}>
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <Inbox className="w-6 h-6" />
                  <p className="text-xs">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-2.5 rounded-lg flex items-start gap-2.5 transition-colors',
                      n.read ? 'opacity-60' : 'bg-[var(--accent-light)]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                      <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id)} className="p-1 rounded hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-tertiary)' }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
