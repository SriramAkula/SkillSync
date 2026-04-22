import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { clsx } from 'clsx';

export const ShellLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500">
      
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out overflow-hidden",
          !isCollapsed ? "w-72" : "w-20"
        )}
      >
        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Navbar */}
        <Navbar 
          isCollapsed={isCollapsed} 
          onToggleSidebar={() => {
            // If on mobile, toggle mobile drawer, else toggle desktop collapse
            if (window.innerWidth < 1024) {
              setMobileMenuOpen(true);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }} 
        />

        {/* Router Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10 pb-24 lg:pb-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-white/20 px-6 py-3 z-50 flex justify-between items-center rounded-t-3xl shadow-2xl">
          <NavLink to="/mentors" className={({ isActive }) => clsx("flex flex-col items-center gap-1 transition-colors hover:text-primary-500", isActive ? "text-primary-600" : "text-slate-400")}>
            <span className="material-icons-outlined">search</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">Explore</span>
          </NavLink>
          <NavLink to="/sessions" className={({ isActive }) => clsx("flex flex-col items-center gap-1 transition-colors hover:text-primary-500", isActive ? "text-primary-600" : "text-slate-400")}>
            <span className="material-icons-outlined">calendar_today</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">Sessions</span>
          </NavLink>
          <div className="relative -top-6">
            <NavLink to="/groups" className={({ isActive }) => clsx("flex items-center justify-center w-14 h-14 text-white rounded-2xl shadow-xl transition-transform active:scale-95", isActive ? "bg-primary-700" : "bg-primary-600")}>
              <span className="material-icons">group</span>
            </NavLink>
          </div>
          <NavLink to="/notifications" className={({ isActive }) => clsx("flex flex-col items-center gap-1 transition-colors hover:text-primary-500", isActive ? "text-primary-600" : "text-slate-400")}>
            <span className="material-icons-outlined">notifications</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">Alerts</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => clsx("flex flex-col items-center gap-1 transition-colors hover:text-primary-500", isActive ? "text-primary-600" : "text-slate-400")}>
            <span className="material-icons-outlined">person</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
          </NavLink>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside 
            className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
             <Sidebar isCollapsed={false} onNavClick={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
};
