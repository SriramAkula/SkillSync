import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  onNavClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onNavClick }) => {
  const { roles, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const allItems = [
    // Learner / Mentor Discovery
    { label: 'Mentors', icon: 'people', route: '/mentors', excludeRoles: ['ROLE_ADMIN'] },
    { label: 'Skills', icon: 'collections_bookmark', route: '/skills', excludeRoles: ['ROLE_ADMIN'] },
    { label: 'Groups', icon: 'groups', route: '/groups', excludeRoles: ['ROLE_ADMIN'] },
    
    // Personal / Interaction
    { label: 'My Sessions', icon: 'event_note', route: '/sessions', roles: ['ROLE_LEARNER'] },
    { label: 'Notifications', icon: 'notifications_none', route: '/notifications' },

    { label: 'Profile', icon: 'person_outline', route: '/profile', excludeRoles: ['ROLE_ADMIN'] },
    
    // Mentor Specific
    { label: 'Dashboard', icon: 'dashboard_customize', route: '/mentor-dashboard', roles: ['ROLE_MENTOR'] },
    
    // Administrative
    { label: 'Approve Mentors', icon: 'verified_user', route: '/admin', roles: ['ROLE_ADMIN'], exact: true },
    { label: 'User Management', icon: 'manage_accounts', route: '/admin/users', roles: ['ROLE_ADMIN'] },
    { label: 'Skill Management', icon: 'settings_suggest', route: '/admin/skills', roles: ['ROLE_ADMIN'] },
  ];

  const visibleItems = allItems.filter(i => {
    // Exclude if user has excludeRole
    if (i.excludeRoles && i.excludeRoles.some(r => roles.includes(r))) {
      return false;
    }
    // Include if roles match or no roles specified
    return !i.roles || i.roles.some(r => roles.includes(r));
  });

  return (
    <div className="h-full flex flex-col py-6 px-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden">
        <img src="/assets/logo.png" className="w-10 h-10 object-contain shrink-0" alt="SkillSync" />
        {!isCollapsed ? (
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white transition-all duration-500 whitespace-nowrap opacity-100">
            SkillSync
          </span>
        ) : (
          <span className="opacity-0 w-0 overflow-hidden transition-all duration-500 whitespace-nowrap">
            SkillSync
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            end={item.exact}
            onClick={onNavClick}
            className={({ isActive }) =>
              clsx(
                "group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "bg-primary-600/10 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary-600 rounded-r-full" />
                )}
                <span className={clsx(
                  "material-icons-outlined shrink-0 transition-all duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                  {item.icon}
                </span>
                <span
                  className={clsx(
                    "text-sm tracking-wide transition-all duration-500 overflow-hidden whitespace-nowrap",
                    !isCollapsed ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-auto group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 active:scale-[0.98]"
      >
        <span className="material-icons-outlined shrink-0 group-hover:rotate-12 transition-transform text-slate-400 dark:text-slate-500 group-hover:text-red-500">
          logout
        </span>
        <span
          className={clsx(
            "font-medium text-sm tracking-wide text-slate-500 dark:text-slate-400 group-hover:text-red-600 transition-all duration-500 overflow-hidden whitespace-nowrap",
            !isCollapsed ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}
        >
          Logout
        </span>
      </button>
    </div>
  );
};
