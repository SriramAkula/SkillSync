import React from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import type { Session } from '../../../types/session';

interface SessionCardProps {
  session: Session;
  onView: (id: number) => void;
  onCancel: (id: number) => void;
  onPay: (id: number) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onView, onCancel, onPay }) => {
  const authStore = useAuthStore();
  const isLearner = authStore.user?.userId === session.learnerId;

  // Formatting scheduledAtUtc to match angular date formatting
  const scheduledAtUtc = new Date(session.scheduledAt);
  
  // To avoid circular or missing dependencies on skills, SkillName is taken generically
  // In the real angular app, they probably joined this from the session or looked it up.
  const skillName = session.title || 'MENTORSHIP SESSION';

  const getStatusStyles = () => {
    switch(session.status) {
      case 'REQUESTED':
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-900', icon: 'hourglass_empty', label: 'Requested' };
      case 'ACCEPTED':
      case 'CONFIRMED':
        return { bg: 'bg-primary-100 dark:bg-primary-900/30', color: 'text-primary-600 dark:text-primary-400', ring: 'ring-primary-200 dark:ring-primary-900', icon: 'event_available', label: 'Confirmed' };
      case 'COMPLETED':
        return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-900', icon: 'check_circle', label: 'Completed' };
      case 'CANCELLED':
      case 'REJECTED':
        return { bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-900', icon: 'cancel', label: 'Cancelled' };
      default:
        return { bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-200 dark:ring-slate-700', icon: 'event', label: session.status };
    }
  };

  const s = getStatusStyles();
  
  const uiStatus = session.status;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 hover:-translate-y-1.5 relative overflow-hidden flex flex-col justify-between h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-transparent transition-all duration-500"></div>
      
      {/* Top Section */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center shadow-sm`}>
              <span className="material-icons text-xl">{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Session ID</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">#{session.id}</p>
            </div>
          </div>
          <div className={`${s.bg} ${s.color} ${s.ring} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${(uiStatus === 'REQUESTED' || uiStatus === 'ACCEPTED') ? 'animate-pulse' : ''}`}></span>
            {s.label}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <span className="material-icons-outlined text-lg text-slate-300 dark:text-slate-600">event</span>
            <p className="text-sm font-medium tracking-tight">
              {format(scheduledAtUtc, 'MMM d, yyyy · h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <span className="material-icons-outlined text-lg text-slate-300 dark:text-slate-600">school</span>
            <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-primary-400 uppercase">{skillName}</p>
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <span className="material-icons-outlined text-lg text-slate-300 dark:text-slate-600">person_outline</span>
            <p className="text-sm font-medium tracking-tight">{session.mentorName || ('Mentor #' + session.mentorId)}</p>
          </div>
        </div>

        {/* Status Context Message */}
        {uiStatus === 'REQUESTED' && isLearner && (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex items-center gap-3 animate-pulse">
            <span className="material-icons text-amber-500 dark:text-amber-400 text-sm">hourglass_top</span>
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">Waiting for Approval</p>
          </div>
        )}
        
        {uiStatus === 'ACCEPTED' && isLearner && session.paymentStatus !== 'COMPLETED' && (
          <div className="p-4 bg-primary-50/50 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/50 flex items-center gap-3 animate-bounce">
            <span className="material-icons text-primary-600 dark:text-primary-400 text-sm">payments</span>
            <p className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest">Action Required: Pay Now</p>
          </div>
        )}
      </div>

      {/* Action Section */}
      <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800/50 flex gap-3 relative z-10">
        <button onClick={() => onView(session.id)} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95">
          Details
        </button>
        
        {uiStatus === 'ACCEPTED' && isLearner && session.paymentStatus !== 'COMPLETED' && (
          <button onClick={() => onPay(session.id)} className="flex-[2] bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:from-primary-500 hover:to-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span className="material-icons text-sm">payment</span>
            Pay Now
          </button>
        )}
        
        {(uiStatus === 'REQUESTED' || uiStatus === 'ACCEPTED') && (
          <button onClick={() => onCancel(session.id)} className="px-4 text-red-400 hover:text-red-600 transition-colors" aria-label="Cancel session">
            <span className="material-icons text-sm">delete_outline</span>
          </button>
        )}
      </div>
    </div>
  );
};
