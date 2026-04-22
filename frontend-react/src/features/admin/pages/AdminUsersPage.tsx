import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import './AdminUsersPage.scss';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const adminStore = useAdminStore();
  const [tab, setTab] = useState<'all' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (tab === 'all') {
      adminStore.loadUsers();
    } else {
      adminStore.loadBlockedUsers();
    }
  }, [tab]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return adminStore.users;
    const q = searchQuery.toLowerCase();
    return adminStore.users.filter((u) =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    );
  }, [adminStore.users, searchQuery]);

  const handlePageChange = (newPage: number) => {
    adminStore.loadUsers(newPage);
  };

  const getInitials = (username: string) => {
    return username?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <div className="page">
      <header className="page-header border-b-2 border-slate-200 dark:border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage and monitor all platform users</p>
        </div>
        <div className="header-stats hidden md:flex gap-4">
          <div className="stat-pill bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="material-icons text-lg">people</span>
            {adminStore.usersTotal} Users
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="admin-tabs flex gap-4 border-b-2 border-slate-200 dark:border-slate-800 mb-8">
        <button 
          onClick={() => setTab('all')}
          className={`admin-tab pb-4 px-2 font-bold transition-all border-b-4 ${tab === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          All Users
        </button>
        <button 
          onClick={() => setTab('blocked')}
          className={`admin-tab pb-4 px-2 font-bold transition-all border-b-4 ${tab === 'blocked' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Blocked
        </button>
      </nav>

      {/* Search Bar */}
      <div className="search-bar bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center px-4 py-3 mb-8 w-full max-w-md shadow-sm">
        <span className="material-icons text-slate-400 mr-2">search</span>
        <input 
          type="text" 
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-slate-700 dark:text-white"
        />
      </div>

      {/* Users Table */}
      <div className="users-table overflow-x-auto rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        {adminStore.loading ? (
          <div className="loading-center p-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">USER</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">EMAIL</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">ROLES</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">STATUS</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">JOINED</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.userId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${u.isBlocked ? 'opacity-70 grayscale-[0.3]' : ''}`}>
                      <td className="px-6 py-4 truncate max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/20">
                            {getInitials(u.name || u.username)}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">{u.name || 'No Name'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px] font-medium">{u.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter border border-slate-200 dark:border-slate-700">
                              {r.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-badge px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${u.isBlocked ? 'bg-red-100 text-red-600 dark:bg-red-950/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30'}`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/users/${u.userId}`)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all active:scale-90"
                            title="View Details"
                          >
                            <span className="material-icons text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-4">
                        <span className="material-icons text-5xl opacity-20">person_search</span>
                        <p className="font-bold text-lg">No users found</p>
                        <p className="text-sm">Try a different search or filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {tab === 'all' && adminStore.usersTotal > adminStore.users.length && (
              <div className="pagination flex justify-center items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                 <button 
                  disabled={adminStore.usersPage === 0}
                  onClick={() => handlePageChange(adminStore.usersPage - 1)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:border-primary-500 transition-all active:scale-95"
                >
                  Previous
                </button>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  Page {adminStore.usersPage + 1}
                </span>
                <button 
                  disabled={adminStore.users.length < 20}
                  onClick={() => handlePageChange(adminStore.usersPage + 1)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:border-primary-500 transition-all active:scale-95"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
