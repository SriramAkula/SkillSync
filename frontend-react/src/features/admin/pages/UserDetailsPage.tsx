import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import './UserDetailsPage.scss';

export const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const adminStore = useAdminStore();

  useEffect(() => {
    if (id) {
      adminStore.loadUserDetails(Number(id));
    }
  }, [id]);

  const user = adminStore.selectedUser;

  const handleBlock = async () => {
    const reason = prompt('Enter reason for blocking this user:');
    if (reason && reason.trim()) {
      try {
        await adminStore.blockUser(user!.userId, reason);
        alert('User blocked successfully');
      } catch (error) {
        alert('Failed to block user');
      }
    }
  };

  const handleUnblock = async () => {
    if (window.confirm('Are you sure you want to unblock this user?')) {
      try {
        await adminStore.unblockUser(user!.userId);
        alert('User unblocked successfully');
      } catch (error) {
        alert('Failed to unblock user');
      }
    }
  };

  const getInitials = (username: string) => {
    return username?.slice(0, 2).toUpperCase() || '??';
  };

  if (adminStore.loading && !user) {
    return (
      <div className="loading-center p-20 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state p-20 text-center">
        <span className="material-icons text-5xl text-slate-300">person_off</span>
        <h3 className="text-xl font-bold mt-4">User Not Found</h3>
        <button onClick={() => navigate('/admin/users')} className="mt-4 text-primary-500 font-bold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="page-header flex justify-between items-start mb-8 gap-4 flex-wrap">
        <div className="header-content flex items-center gap-6">
          <button className="back-btn p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-all active:scale-95 shadow-sm" onClick={() => navigate('/admin/users')}>
            <span className="material-icons">arrow_back</span>
          </button>
          <div className="header-title">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{user.username}</h1>
            <p className="header-subtitle text-slate-500 dark:text-slate-400">User Profile Details</p>
          </div>
        </div>
        <div className="header-actions">
          {user.isBlocked ? (
            <button className="btn btn-emerald bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-all active:scale-95" onClick={handleUnblock}>
              <span className="material-icons">check_circle</span>
              Unblock User
            </button>
          ) : (
            <button className="btn btn-red bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all active:scale-95" onClick={handleBlock}>
              <span className="material-icons">block</span>
              Block User
            </button>
          )}
        </div>
      </div>

      <div className="profile-section">
        <div className={`profile-card p-8 rounded-3xl border-2 transition-all bg-white dark:bg-slate-900 ${user.isBlocked ? 'border-red-200 dark:border-red-900 opacity-80' : 'border-slate-100 dark:border-slate-800 shadow-xl'}`}>
          <div className="profile-header flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="avatar-large w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {getInitials(user.name || user.username)}
            </div>
            <div className="profile-info">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{user.name || user.username}</h2>
              <span className={`status-badge inline-block mt-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${user.isBlocked ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30'}`}>
                {user.isBlocked ? '🔒 Blocked' : '✓ Active'}
              </span>
            </div>
          </div>

          <div className="info-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">📧</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                <span className="info-value font-bold text-slate-700 dark:text-slate-200 block truncate">{user.email}</span>
              </div>
            </div>

            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">👤</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</span>
                <span className="info-value font-bold text-slate-700 dark:text-slate-200 block truncate">{user.name || '—'}</span>
              </div>
            </div>

            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">🔐</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roles</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles.map(r => (
                    <span key={r} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">
                      {r.replace('ROLE_', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">📅</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</span>
                <span className="info-value font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {new Date(user.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">📋</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Status</span>
                <span className="info-value font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {user.isProfileComplete ? '✓ Complete' : 'Incomplete'}
                </span>
              </div>
            </div>

            <div className="info-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <span className="info-icon text-2xl">⭐</span>
              <div className="info-content truncate">
                <span className="info-label block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</span>
                <span className="info-value font-bold text-slate-700 dark:text-slate-200 block truncate">
                  {user.rating !== null ? user.rating.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {user.isBlocked && (
            <div className="block-info mt-12 p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/50">
              <div className="block-header flex items-center gap-3 mb-4">
                <span className="material-icons text-red-500">warning</span>
                <h3 className="text-lg font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Block Information</h3>
              </div>
              <div className="block-details space-y-4">
                <div className="block-detail-item">
                  <span className="label block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Reason</span>
                  <p className="value reason text-sm font-medium text-red-800 dark:text-red-300 bg-white/50 dark:bg-black/20 p-3 rounded-xl">{user.blockReason || 'No reason provided'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="block-detail-item">
                    <span className="label block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Blocked On</span>
                    <span className="value text-sm font-bold text-red-700 dark:text-red-400">
                      {new Date(user.blockDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="block-detail-item">
                    <span className="label block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Blocked By</span>
                    <span className="value text-sm font-bold text-red-700 dark:text-red-400">Admin #{user.blockedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
