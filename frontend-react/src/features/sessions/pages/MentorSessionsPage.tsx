import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { useMentorStore } from '../../../store/mentorStore';
import { useSkillStore } from '../../../store/skillStore';
import { SessionCard } from '../components/SessionCard';
import { Pagination } from '../../../components/Pagination';
import type { Session } from '../../../types/session';
import './MentorSessionsPage.scss';

type DashTab = 'pending' | 'upcoming' | 'all' | 'confirmed';

export const MentorSessionsPage = () => {
  const navigate = useNavigate();
  const sessionStore = useSessionStore();
  const mentorStore = useMentorStore();
  const skillStore = useSkillStore();

  const [activeTab, setActiveTab] = useState<DashTab>('pending');
  const [rejectingSession, setRejectingSession] = useState<Session | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const tabs: { key: DashTab; label: string }[] = [
    { key: 'pending',   label: 'Incoming Requests' },
    { key: 'upcoming',  label: 'Accepted Schedule' },
    { key: 'confirmed', label: 'Completed Sessions' },
    { key: 'all',       label: 'Session History' },
  ];

  const quickReasons = [
    'Schedule Conflict',
    'Personal Emergency',
    'Topic Misaligned',
    'Full Capacity',
  ];

  useEffect(() => {
    sessionStore.loadMentorSessions({ page: 0, size: 8 });
    mentorStore.loadMyProfile();
    if (skillStore.skills.length === 0) {
      skillStore.loadForSelection();
    }
  }, []);

  const refresh = () => {
    sessionStore.loadMentorSessions({ page: sessionStore.mentorCurrentPage, size: 8 });
  };

  const toggleAvailability = () => {
    if (!mentorStore.myProfile) return;
    const nextStatus = mentorStore.myProfile.availabilityStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    mentorStore.updateAvailability(nextStatus);
  };

  const onPageChange = (page: number) => {
    sessionStore.loadMentorSessions({ page, size: 8 });
  };

  const changeTab = (tab: DashTab) => {
    setActiveTab(tab);
    sessionStore.loadMentorSessions({ page: 0, size: 8 });
  };

  const handleConfirmReject = async () => {
    if (!rejectingSession || !rejectReason.trim()) return;
    await sessionStore.reject({ id: rejectingSession.id, reason: rejectReason });
    setRejectingSession(null);
    setRejectReason('');
  };

  const getFilteredSessions = () => {
    const sessions = sessionStore.mentorSessions;
    if (activeTab === 'pending') return sessions.filter(s => s.status === 'REQUESTED');
    if (activeTab === 'upcoming') return sessions.filter(s => s.status === 'ACCEPTED' || s.status === 'CONFIRMED');
    if (activeTab === 'confirmed') return sessions.filter(s => s.status === 'COMPLETED');
    return sessions;
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">

      {/* Premium Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">
             <span className="material-icons text-sm">verified_user</span>
             Verified Expert Dashboard
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Manage Your <span className="text-primary-600">Impact</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">Review collaboration requests and manage your upcoming schedule.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={refresh} 
            disabled={sessionStore.loading} 
            className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all hover:shadow-lg active:scale-95 group"
          >
             <span className={`material-icons ${sessionStore.loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          
          {/* Availability Toggle */}
          <button 
            onClick={toggleAvailability} 
            className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-6 py-3.5 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-400 transition-all active:scale-95 shadow-sm group"
          >
            <div className="relative">
              <div className={`w-3 h-3 rounded-full shadow-sm ${mentorStore.myProfile?.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">My Status</p>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                {mentorStore.myProfile?.availabilityStatus === 'AVAILABLE' ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <span className="material-icons text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">swap_horiz</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div 
          onClick={() => changeTab('pending')} 
          role="button"
          tabIndex={0}
          className={`glass-card dark:bg-amber-950/50 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden group border border-amber-500/10 ${activeTab === 'pending' ? 'ring-2 ring-amber-500/50 ring-offset-2 dark:ring-offset-slate-950' : ''}`}
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors shadow-sm">
              <span className="material-icons">pending_actions</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-300">Action Required</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-200 tracking-tight">
                {sessionStore.mentorSessions.filter(s => s.status === 'REQUESTED').length}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => changeTab('upcoming')} 
          role="button"
          tabIndex={0}
          className={`glass-card dark:bg-blue-950/50 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden group border border-blue-500/10 ${activeTab === 'upcoming' ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-slate-950' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors shadow-sm">
              <span className="material-icons">event_available</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">Confirmed</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-200 tracking-tight">
                {sessionStore.mentorSessions.filter(s => s.status === 'ACCEPTED' || s.status === 'CONFIRMED').length}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => changeTab('all')} 
          role="button"
          tabIndex={0}
          className={`glass-card dark:bg-violet-950/50 p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden group border border-violet-500/10 ${activeTab === 'all' ? 'ring-2 ring-violet-500/50 ring-offset-2 dark:ring-offset-slate-950' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors shadow-sm">
              <span className="material-icons">history</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">Lifetime</p>
              <p className="text-2xl font-black text-violet-600 dark:text-violet-200 tracking-tight">{sessionStore.mentorTotalElements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-8">
        
        {/* Tab Switches */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit">
          {tabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600 dark:text-primary-300' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic List View */}
        {sessionStore.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] animate-pulse"></div>
              ))}
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-drop-in">
            {filteredSessions.map(s => (
              <SessionCard 
                key={s.id}
                session={s}
                onView={(id) => navigate(`/sessions/${id}`)}
                onCancel={(id) => sessionStore.cancel(id)}
                onPay={() => {}} // Mentors don't pay
              />
            ))}
            {filteredSessions.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center text-center space-y-4 text-slate-500 dark:text-slate-400">
                 <span className="material-icons text-6xl">event_busy</span>
                 <p className="text-sm font-bold uppercase tracking-widest">No matching activities found.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {sessionStore.mentorTotalElements > sessionStore.mentorPageSize && activeTab === 'all' && (
          <Pagination
            totalItems={sessionStore.mentorTotalElements}
            pageSize={sessionStore.mentorPageSize}
            currentPage={sessionStore.mentorCurrentPage}
            onPageChange={onPageChange}
          />
        )}

      </div>

      {/* Rejection Modal */}
      {rejectingSession && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setRejectingSession(null)}
          ></div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 relative z-10 shadow-2xl animate-drop-in border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/50">
                   <span className="material-icons">block</span>
                </div>
                <div className="space-y-0.5">
                   <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Decline Session Request</h2>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Session #{rejectingSession.id}</p>
                </div>
             </div>

             <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 italic">Let the learner know why you are unable to fulfill this request.</p>

             <div className="flex flex-wrap gap-2 mb-8">
               {quickReasons.map(r => (
                 <button 
                    key={r}
                    type="button" 
                    onClick={() => setRejectReason(r)}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                      rejectReason === r 
                        ? 'bg-red-500 text-white' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                   {r}
                 </button>
               ))}
             </div>

             <div className="relative group mb-10">
                <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">edit_note</span>
                <input 
                  type="text" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Or provide a custom reason..." 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-red-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" 
                />
             </div>

             <div className="flex gap-4">
                <button onClick={() => setRejectingSession(null)} className="flex-1 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <button 
                  onClick={handleConfirmReject} 
                  disabled={!rejectReason.trim()} 
                  className="flex-[2] bg-red-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                   Confirm Rejection
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
