import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect } from 'react';

interface NavbarProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isCollapsed, onToggleSidebar }) => {
  const { user, roles, logout } = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 60000); // 1 minute polling
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const roleDisplay = roles.includes('ROLE_ADMIN') ? 'Admin' : roles.includes('ROLE_MENTOR') ? 'Mentor' : 'Learner';
  const isAdmin = roles.includes('ROLE_ADMIN');
  const canApply = roles.includes('ROLE_LEARNER') && !roles.includes('ROLE_MENTOR');

  return (
    <nav className="h-20 sticky top-0 z-[100] px-6 lg:px-10 flex items-center justify-between transition-all duration-300 navbar-glass">
      {/* Left: Mobile Menu Toggle + Desktop Search/Breadcrumb */}
      <div className="flex items-center gap-4 lg:gap-8 min-w-[200px]">
        <button
          onClick={onToggleSidebar}
          className="lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all hidden text-slate-600 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-300 focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <span className={`material-icons-outlined transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>

        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-100 active:bg-slate-100 dark:active:bg-white/10 transition-colors"
          aria-label="Mobile Sidebar Toggle"
        >
          <span className="material-icons-outlined">menu</span>
        </button>

        {/* Brand (Mobile Only) */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/assets/logo.png" className="w-8 h-8 object-contain" alt="SkillSync" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SkillSync</span>
        </div>
      </div>

      {/* Right Actions: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Placeholder for ThemeToggle */}
        <button className="p-2 rounded-xl text-slate-600 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
          <span className="material-icons-outlined">dark_mode</span>
        </button>

        {canApply && !isAdmin && (
          <NavLink
            to="/mentors/apply"
            className="hidden sm:flex items-center bg-slate-900/10 dark:bg-white/20 text-slate-700 dark:text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-900/20 dark:hover:bg-white/30 transition-all active:scale-95 border border-slate-900/10 dark:border-white/20"
          >
            <span className="material-icons-outlined text-base mr-2">verified_user</span>
            Become Mentor
          </NavLink>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => navigate('/notifications')}
            className="notif-btn p-2 rounded-xl text-slate-600 dark:text-slate-100 hover:text-primary-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all group relative"
          >
            <span className="material-icons-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-400 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Detailed Notif Dropdown omitted for brevity initially */}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative profile-dropdown underline-none">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-10 w-10 overflow-hidden ring-2 ring-white/50 ring-offset-2 ring-offset-slate-100 rounded-xl hover:scale-105 transition-all shadow-md active:scale-95 bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center"
          >
            <span className="text-white dark:text-white font-bold text-sm tracking-tighter">{initial}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 shadow-2xl animate-drop-in z-[300] py-1 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg dark:shadow-primary-900/40">
                  {initial}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-none">{user?.name || 'User'}</p>
                  <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1 block">
                    {roleDisplay}
                  </span>
                </div>
              </div>

              <div className="px-2 space-y-0.5">
                {!isAdmin && (
                  <>
                    <NavLink
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="material-icons-outlined text-base">account_circle</span>
                      Profile
                    </NavLink>
                    <NavLink
                      to="/sessions"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="material-icons-outlined text-base">calendar_view_day</span>
                      My Sessions
                    </NavLink>
                    <NavLink
                      to="/profile/edit"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="material-icons-outlined text-base">settings</span>
                      Settings
                    </NavLink>
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 mt-2 px-2 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <span className="material-icons-outlined text-base">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
