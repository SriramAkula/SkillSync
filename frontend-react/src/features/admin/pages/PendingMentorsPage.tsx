import { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import './PendingMentorsPage.scss';

export const PendingMentorsPage = () => {
  const adminStore = useAdminStore();
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    adminStore.loadPendingMentors(currentPage);
  }, [currentPage]);

  const handleApprove = async (id: number) => {
    if (window.confirm('Are you sure you want to approve this mentor application?')) {
      await adminStore.approveMentor(id);
    }
  };

  const handleReject = async (id: number) => {
    if (window.confirm('Are you sure you want to reject this mentor application?')) {
      await adminStore.rejectMentor(id);
    }
  };

  const getInitials = (name?: string, username?: string) => {
    const str = name || username || '??';
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div className="page">
      <header className="page-header border-b-2 border-slate-200 dark:border-slate-800 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Pending Mentors</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Audit and approve new mentor applications</p>
        </div>
        {adminStore.pendingTotal > 0 && (
          <div className="stat-pill bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-icons text-lg">hourglass_empty</span>
            {adminStore.pendingTotal} Pending
          </div>
        )}
      </header>

      {adminStore.loading && adminStore.pendingMentors.length === 0 ? (
        <div className="loading-center p-20 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminStore.pendingMentors.length > 0 ? (
            adminStore.pendingMentors.map((m) => (
              <div key={m.id} className="app-card bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all flex flex-col gap-6">
                <div className="card-header flex items-center gap-4">
                  <div className="avatar w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {getInitials(m.name, m.username)}
                  </div>
                  <div className="card-info truncate">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{m.name || m.username}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{m.username}</p>
                    <span className="pending-chip inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                      Under Review
                    </span>
                  </div>
                </div>

                <div className="card-details space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="detail-item flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-icons text-lg text-slate-400">psychology</span>
                    <span className="font-bold">{m.specialization}</span>
                  </div>
                  <div className="detail-item flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-icons text-lg text-slate-400">history</span>
                    <span>{m.yearsOfExperience} years exp.</span>
                  </div>
                  <div className="detail-item flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-icons text-lg text-slate-400">payments</span>
                    <span className="font-black text-primary-600 dark:text-primary-400">${m.hourlyRate}/hr</span>
                  </div>
                </div>

                <div className="card-actions flex gap-3">
                  <button 
                    onClick={() => handleApprove(m.id)}
                    className="btn-approve flex-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-all active:scale-95"
                  >
                    <span className="material-icons text-lg">check_circle</span>
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(m.id)}
                    className="btn-reject flex-1 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all active:scale-95"
                  >
                    <span className="material-icons text-lg">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state col-span-full py-20 text-center flex flex-col items-center gap-4">
              <div className="empty-icon w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 animate-pulse">
                <span className="material-icons text-5xl">task_alt</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">All caught up!</h3>
              <p className="text-slate-500 dark:text-slate-400">No pending mentor applications to review.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {adminStore.pendingTotal > 12 && (
        <div className="pagination flex justify-center items-center gap-6 mt-12">
          <button 
            disabled={currentPage === 0 || adminStore.loading}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-6 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-primary-500 transition-all active:scale-95 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
            {currentPage + 1} / {Math.ceil(adminStore.pendingTotal / 12)}
          </span>
          <button 
            disabled={adminStore.pendingMentors.length < 12 || adminStore.loading}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-6 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-primary-500 transition-all active:scale-95 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
