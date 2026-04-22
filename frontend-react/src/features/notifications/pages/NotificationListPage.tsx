import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../../store/notificationStore';
import { useAuthStore } from '../../../store/authStore';
import { Pagination } from '../../../components/Pagination';
import './NotificationListPage.scss';

type NotifFilter = 'all' | 'unread';

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const notifStore = useNotificationStore();
  const [filter, setFilter] = useState<NotifFilter>('all');

  useEffect(() => {
    notifStore.loadNotifications({ page: 0, size: 15, unreadOnly: filter === 'unread' });
  }, [filter]);

  const onPageChange = (page: number) => {
    notifStore.loadNotifications({ page, size: 15, unreadOnly: filter === 'unread' });
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'MENTOR_APPROVED': return { icon: 'volunteer_activism', class: 'success' };
      case 'SESSION_REQUESTED': return { icon: 'event_note', class: 'info' };
      case 'SESSION_CONFIRMED': return { icon: 'event_available', class: 'success' };
      case 'SESSION_CANCELLED': return { icon: 'event_busy', class: 'danger' };
      case 'PAYMENT_SUCCESSFUL': return { icon: 'payments', class: 'success' };
      default: return { icon: 'notifications', class: 'warning' };
    }
  };

  const onNotifClick = (n: any) => {
    if (!n.isRead) {
      notifStore.markAsRead(n.id);
    }
    
    const type = n.type.toUpperCase();
    if (type === 'SESSION_REQUESTED' && authStore.roles.includes('ROLE_MENTOR')) {
      navigate('/mentor-dashboard');
    } else if (type.includes('SESSION')) {
      navigate('/sessions');
    } else if (type.includes('PROFILE')) {
      navigate('/profile');
    }
  };

  const formatMessage = (msg: string) => {
    if (!msg) return '';
    const isoRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)/g;
    return msg.replace(isoRegex, (match) => {
      try {
        const d = new Date(match.endsWith('Z') || match.includes('+') ? match : match + 'Z');
        return d.toLocaleString('en-GB', { 
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true 
        });
      } catch {
        return match;
      }
    });
  };

  const activeTabPos = filter === 'unread' ? 50 : 0;

  return (
    <div className="notifications-container">
      {/* Header */}
      <header className="page-header">
        <div className="header-main">
          <h1 className="text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400">Stay updated with your activities</p>
        </div>
        <div className="header-actions">
          {notifStore.unreadCount > 0 && (
            <button onClick={() => notifStore.markAllRead()} className="btn-action secondary">
              <span className="material-icons">done_all</span>
              Mark All Read
            </button>
          )}
          {notifStore.notifications.length > 0 && (
            <button onClick={() => notifStore.deleteAll()} className="btn-action danger">
              <span className="material-icons">delete_sweep</span>
              Delete All
            </button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <nav className="filter-tabs">
        <div className="pill-track">
          <div className="pill-active" style={{ left: `${activeTabPos}%` }}></div>
          <button 
            onClick={() => setFilter('all')} 
            className={filter === 'all' ? 'active' : ''}
          >
            All <span>{notifStore.totalElements}</span>
          </button>
          <button 
            onClick={() => setFilter('unread')} 
            className={filter === 'unread' ? 'active' : ''}
          >
            Unread <span>{notifStore.unreadCount}</span>
          </button>
        </div>
      </nav>

      {/* Notifications List */}
      <main className="notifications-list">
        {notifStore.notifications.length > 0 ? (
          notifStore.notifications.map((n) => {
            const iconData = getNotifIcon(n.type);
            return (
              <div 
                key={n.id} 
                className={`notif-card ${!n.isRead ? 'unread' : ''}`}
                onClick={() => onNotifClick(n)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`notif-icon-wrap ${iconData.class}`}>
                  <span className="material-icons">{iconData.icon}</span>
                </div>
                
                <div className="notif-content">
                  <div className="notif-header">
                    <span className="notif-type">{n.type.replace(/_/g, ' ')}</span>
                    <span className="notif-time">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="notif-message text-slate-800 dark:text-slate-100">{formatMessage(n.message)}</p>
                  <span className="notif-date">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>

                <div className="notif-actions">
                  {!n.isRead && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); notifStore.markAsRead(n.id); }} 
                      title="Mark as read" 
                      className="btn-item-action read"
                    >
                      <span className="material-icons">done</span>
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); notifStore.deleteNotification(n.id); }} 
                    title="Delete" 
                    className="btn-item-action delete"
                  >
                    <span className="material-icons">delete_outline</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon-ring">
              <span className="material-icons">notifications_off</span>
            </div>
            <h3>Nothing here</h3>
            <p>You're all caught up! No notifications for your current filter.</p>
          </div>
        )}

        {/* Pagination */}
        {notifStore.totalElements > notifStore.pageSize && (
          <Pagination
            currentPage={notifStore.currentPage}
            totalItems={notifStore.totalElements}
            pageSize={notifStore.pageSize}
            onPageChange={onPageChange}
          />
        )}
      </main>
    </div>
  );
};
