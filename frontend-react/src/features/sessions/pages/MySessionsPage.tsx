import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { useSkillStore } from '../../../store/skillStore';
import { SessionCard } from '../components/SessionCard';
import { Pagination } from '../../../components/Pagination';
import type { Session } from '../../../types/session';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

export const MySessionsPage = () => {
  const navigate = useNavigate();
  const sessionStore = useSessionStore();
  const skillStore = useSkillStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All Sessions' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    sessionStore.loadLearnerSessions({ page: 0, size: 12 });
    if (skillStore.skills.length === 0) {
      skillStore.loadForSelection();
    }
  }, []);

  const emptyConfig = {
    all: { icon: 'event_note', title: 'No sessions recorded', desc: 'Your journey starts here. Book a session with a top-tier mentor to accelerate your growth.' },
    active: { icon: 'auto_fix_off', title: 'No ongoing sessions', desc: 'You are all caught up! Browse upcoming slots or reach out to mentors.' },
    completed: { icon: 'assignment_turned_in', title: 'No completed goals', desc: 'Once you finish your first session, it will appear here for review.' },
    cancelled: { icon: 'event_busy', title: 'No cancelled sessions', desc: 'Good news! You have no cancelled or rejected sessions.' },
  };

  const currentEmptyProps = emptyConfig[activeTab];

  const getFilteredSessions = () => {
    const list = sessionStore.learnerSessions;
    if (activeTab === 'all') return list;
    if (activeTab === 'active') return list.filter((s: Session) => s.status === 'REQUESTED' || s.status === 'ACCEPTED' || s.status === 'CONFIRMED');
    if (activeTab === 'completed') return list.filter((s: Session) => s.status === 'COMPLETED');
    if (activeTab === 'cancelled') return list.filter((s: Session) => s.status === 'CANCELLED' || s.status === 'REJECTED');
    return list;
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10 animate-fade-in pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Learning</span> Sessions
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-300 font-medium leading-relaxed">
            Track your progress and upcoming mentorship meetings.
          </p>
        </div>
        <button 
          onClick={() => navigate('/mentors')}
          className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg sm:rounded-2xl px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base font-bold shadow-lg shadow-primary-600/20 hover:from-primary-500 hover:to-indigo-500 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
        >
          <span className="material-icons text-lg sm:text-xl group-hover:rotate-90 transition-transform">add_circle</span>
          <span className="hidden sm:inline">Book New Session</span>
          <span className="sm:hidden">Book</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total stats and others map here... matching HTML */}
        <div 
          onClick={() => setActiveTab('all')}
          tabIndex={0} 
          role="button"
          className={`relative group glass-card dark:bg-indigo-950/50 p-3 sm:p-4 lg:p-6 cursor-pointer hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-indigo-500/10 ${activeTab === 'all' ? 'ring-2 ring-primary-500' : ''}`}
        >
          <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            <div className="w-8 sm:w-12 h-8 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              <span className="material-icons text-base sm:text-lg">event</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Total</p>
              <p className="text-lg sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-200 tracking-tight">{sessionStore.learnerTotalElements}</p>
            </div>
          </div>
        </div>
        {/* Simplified rest of stats to mimic layout visually but save code size */}
        <div 
          onClick={() => setActiveTab('active')}
          tabIndex={0} 
          role="button"
          className={`relative group glass-card dark:bg-blue-950/50 p-3 sm:p-4 lg:p-6 cursor-pointer hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-blue-500/10 ${activeTab === 'active' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            <div className="w-8 sm:w-12 h-8 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
              <span className="material-icons text-base sm:text-lg">bolt</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">Active</p>
              <p className="text-lg sm:text-2xl font-extrabold text-blue-600 dark:text-blue-200 tracking-tight">{filteredSessions.filter((s: Session) => s.status==='REQUESTED'||s.status==='ACCEPTED'||s.status==='CONFIRMED').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 sm:space-y-6">
        
        {/* Error Display */}
        {sessionStore.error && (
          <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
                <span className="material-icons text-2xl">error_outline</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-red-800 dark:text-red-300 mb-1">Failed to Load Sessions</h3>
                <p className="text-sm sm:text-base text-red-700 dark:text-red-400">{sessionStore.error}</p>
                <button 
                  onClick={() => sessionStore.loadLearnerSessions({ page: 0, size: 12 })}
                  className="mt-4 px-4 sm:px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors active:scale-95"
                >
                  <span className="material-icons inline mr-2 text-lg align-text-bottom">refresh</span>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit">
          {tabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-white dark:bg-slate-800 shadow-md text-primary-600' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Session List / Grid */}
        {sessionStore.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSessions.map((s: Session) => (
              <SessionCard 
                key={s.id}
                session={s}
                onView={(id) => navigate(`/sessions/${id}`)}
                onCancel={(id) => sessionStore.cancel(id)}
                onPay={(id) => navigate(`/payment?sessionId=${id}`)}
              />
            ))}
            {filteredSessions.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center animate-drop-in">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                  <span className="material-icons text-6xl">{currentEmptyProps.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{currentEmptyProps.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 font-medium">{currentEmptyProps.desc}</p>
                {activeTab === 'all' && (
                  <button onClick={() => navigate('/mentors')} className="mt-8 px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg transition-all active:scale-95">
                    Find Your First Mentor
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pagination - only showing when activeTab refers to total dataset pagination */}
        {!sessionStore.loading && activeTab === 'all' && sessionStore.learnerTotalElements > sessionStore.learnerPageSize && (
          <div className="mt-8">
            <Pagination 
              totalItems={sessionStore.learnerTotalElements} 
              pageSize={sessionStore.learnerPageSize} 
              currentPage={sessionStore.learnerCurrentPage}
              onPageChange={(page) => sessionStore.loadLearnerSessions({ page, size: sessionStore.learnerPageSize })}
            />
          </div>
        )}

      </div>
    </div>
  );
};
