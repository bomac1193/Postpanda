import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import api from '../../lib/api';

const ICON_MAP = {
  schedule_reminder: Clock,
  published: CheckCircle,
  failed: AlertCircle,
  info: Bell,
};

const COLOR_MAP = {
  schedule_reminder: 'text-blue-400',
  published: 'text-green-400',
  failed: 'text-red-400',
  info: 'text-dark-400',
};

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  };

  // Poll every 30s + on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Browser notification for new unread items
  useEffect(() => {
    if (unreadCount === 0) return;
    const latest = notifications.find(n => !n.read);
    if (!latest || typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission === 'granted' && document.hidden) {
      try {
        new window.Notification(latest.title, { body: latest.message, tag: latest._id });
      } catch {
        // silent
      }
    }
  }, [unreadCount, notifications]);

  // Request browser notification permission on first open
  const handleOpen = () => {
    setOpen(!open);
    if (!open && typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleOpen} className="btn-icon relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark-700">
            <span className="text-sm font-medium text-dark-100">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-dark-400 hover:text-dark-200">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-6 h-6 text-dark-600 mx-auto mb-2" />
                <p className="text-xs text-dark-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICON_MAP[n.type] || Bell;
                const color = COLOR_MAP[n.type] || 'text-dark-400';
                return (
                  <button
                    key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-dark-700/50 transition-colors ${!n.read ? 'bg-dark-750/30' : ''}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-medium ${!n.read ? 'text-dark-100' : 'text-dark-400'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-dark-500 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-dark-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
