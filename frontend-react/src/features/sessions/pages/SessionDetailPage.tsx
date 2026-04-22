import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSessionStore } from '../../../store/sessionStore';
import { useMentorStore } from '../../../store/mentorStore';
import { useAuthStore } from '../../../store/authStore';
import './SessionDetailPage.scss';

const STATUS_CFG: Record<string, { color: string; bg: string; icon: string }> = {
  PENDING:    { color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  REQUESTED:  { color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  ACCEPTED:   { color: '#2563eb', bg: '#dbeafe', icon: 'thumb_up' },
  CONFIRMED:  { color: '#16a34a', bg: '#dcfce7', icon: 'check_circle' },
  COMPLETED:  { color: '#059669', bg: '#ecfdf5', icon: 'verified' },
  REJECTED:   { color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
  CANCELLED:  { color: '#6b7280', bg: '#f3f4f6', icon: 'block' },
  PAYMENT_FAILED: { color: '#ef4444', bg: '#fef2f2', icon: 'error' },
  REFUNDED:   { color: '#8b5cf6', bg: '#f5f3ff', icon: 'undo' },
};

export const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionStore = useSessionStore();
  const mentorStore = useMentorStore();
  const authStore = useAuthStore();

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (id) {
      sessionStore.loadById(Number(id));
    }
    if (authStore.roles.includes('ROLE_MENTOR') && !mentorStore.myProfile) {
      mentorStore.loadMyProfile();
    }
    return () => sessionStore.clearSelected();
  }, [id]);

  const s = sessionStore.selectedSession;

  if (sessionStore.loading && !s) {
    return (
      <div className="page">
        <div className="loading-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (sessionStore.error) {
    return (
      <div className="page">
        <div className="error-banner">
          <p className="error-title">Error loading session</p>
          <p className="error-message">{sessionStore.error}</p>
          <button className="back-btn retry" onClick={() => navigate('/sessions')}>
            <span className="material-icons">arrow_back</span> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!s) return null;

  const isLearnerForThisSession = Number(authStore.user?.userId) === Number(s.learnerId);
  const isMentorForThisSession = mentorStore.myProfile ? s.mentorId === mentorStore.myProfile.userId : false;

  const cfg = STATUS_CFG[s.status] || STATUS_CFG['CANCELLED'];

  const handleAccept = async () => {
    await sessionStore.accept(s.id);
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    await sessionStore.reject({ id: s.id, reason: rejectReason });
    setShowReject(false);
  };

  const handleCancel = async () => {
    await sessionStore.cancel(s.id);
  };

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/sessions')}>
        <span className="material-icons">arrow_back</span> My Sessions
      </button>

      <div className="layout">
        {/* Main Card */}
        <div className="main-col">
          <div className="detail-card">
            <div className="detail-header" data-status={s.status}>
              <div 
                className="status-icon" 
                style={{ 
                  background: `${cfg.color}20`, 
                  borderColor: `${cfg.color}40`, 
                  border: '1px solid' 
                }}
              >
                <span className="material-icons" style={{ color: cfg.color }}>{cfg.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">Session #{s.id}</h2>
                <div 
                  className="status-badge px-2 py-0.5 rounded text-[10px] font-bold uppercase" 
                  style={{ background: cfg.color, color: 'white' }}
                >
                  {s.status}
                </div>
              </div>
            </div>

            <div className="detail-body">
              <div className="info-grid overflow-hidden">
                <div className="info-item">
                  <span className="info-label">Scheduled</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">{format(new Date(s.scheduledAt), 'EEEE, MMM d, y')}</span>
                  <span className="info-sub text-slate-500">{format(new Date(s.scheduledAt), 'h:mm a')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">{s.durationMinutes} minutes</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mentor ID</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">#{s.mentorId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Skill ID</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">#{s.skillId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">{format(new Date(s.createdAt), 'MMM d, y')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value text-slate-900 dark:text-slate-100">{format(new Date(s.updatedAt), 'MMM d, y')}</span>
                </div>
              </div>

              {s.rejectionReason && (
                <div className="rejection-box bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900 flex items-start gap-3 mt-6">
                  <span className="material-icons text-red-500">info</span>
                  <div>
                    <strong className="block text-red-800 dark:text-red-300">Rejection Reason</strong>
                    <p className="text-red-700 dark:text-red-400">{s.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="actions-col">
          <div className="actions-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Actions</h3>

            <div className="flex flex-col gap-3">
              {s.status === 'ACCEPTED' && isLearnerForThisSession && s.paymentStatus !== 'COMPLETED' && (
                <button 
                  className="action-btn primary bg-primary-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  onClick={() => navigate(`/payment?sessionId=${s.id}`)}
                >
                  <span className="material-icons">payment</span>
                  Pay Now
                </button>
              )}

              {isMentorForThisSession && (
                <>
                  {s.status === 'REQUESTED' && (
                    <>
                      <button 
                        className="action-btn success bg-emerald-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        onClick={handleAccept}
                      >
                        <span className="material-icons">check_circle</span>
                        Accept Session
                      </button>
                      <button 
                        className="action-btn danger bg-red-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        onClick={() => setShowReject(true)}
                      >
                        <span className="material-icons">cancel</span>
                        Reject Session
                      </button>
                    </>
                  )}
                </>
              )}

              {s.status === 'REQUESTED' && isLearnerForThisSession && (
                <button 
                  className="action-btn secondary bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  onClick={handleCancel}
                >
                  <span className="material-icons">block</span>
                  Cancel Session
                </button>
              )}

              {(s.status === 'ACCEPTED') && (
                <button 
                  className="action-btn secondary bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  onClick={handleCancel}
                >
                  <span className="material-icons">block</span>
                  Cancel Session
                </button>
              )}

              {s.status === 'CONFIRMED' && (
                <button 
                  className="action-btn outline border-2 border-primary-600 text-primary-600 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  onClick={() => navigate(`/reviews/mentor/${s.mentorId}`)}
                >
                  <span className="material-icons">rate_review</span>
                  Write a Review
                </button>
              )}

              {!isMentorForThisSession && (
                <button 
                  className="action-btn outline border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  onClick={() => navigate(`/mentors/${s.mentorId}`)}
                >
                  <span className="material-icons">person</span>
                  View Mentor Profile
                </button>
              )}
            </div>
          </div>

          {/* Reject Form */}
          {showReject && (
            <div className="reject-card mt-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-lg">
              <h4 className="text-sm font-bold uppercase tracking-widest text-red-600 mb-3">Reject Session</h4>
              <div className="input-wrapper mb-4">
                <input 
                  type="text" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div className="reject-actions flex gap-2">
                <button 
                  className="action-btn secondary flex-1 bg-slate-100 dark:bg-slate-800 py-2 rounded-xl text-xs font-bold"
                  onClick={() => setShowReject(false)}
                >
                  Cancel
                </button>
                <button 
                  className="action-btn danger flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                  onClick={handleReject}
                  disabled={!rejectReason}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
