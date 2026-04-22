import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMentorStore } from '../../../store/mentorStore';
import { useAuthStore } from '../../../store/authStore';
import { useReviewStore } from '../../../store/reviewStore';
import './MentorDetailPage.scss';

export const MentorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const mentorStore = useMentorStore();
  const authStore = useAuthStore();
  const reviewStore = useReviewStore();

  useEffect(() => {
    if (id) {
      const mentorId = Number(id);
      mentorStore.loadById(mentorId);
      reviewStore.loadMentorReviews(mentorId, 0, 5);
      reviewStore.loadMentorRating(mentorId);
    }
  }, [id]);

  const mentor = mentorStore.selectedMentor;
  const loading = mentorStore.loading;
  const reviews = reviewStore.reviews;
  const rating = reviewStore.rating;

  const isOwnProfile = (mentorUserId: number) => {
    const myId = authStore.user?.userId;
    return myId !== null && myId !== undefined && Number(myId) === Number(mentorUserId);
  };

  const statusClasses = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      'AVAILABLE': { bg: 'bg-emerald-500 shadow-emerald-50', text: 'text-emerald-600' },
      'BUSY': { bg: 'bg-amber-500 shadow-amber-50', text: 'text-amber-600' },
      'UNAVAILABLE': { bg: 'bg-slate-300', text: 'text-slate-400' }
    };
    return map[status] || map['UNAVAILABLE'];
  };

  const bookSession = (mentorId: number) => {
    navigate(`/sessions/request?mentorId=${mentorId}`);
  };

  const openChat = (_mentorObj: { userId: number; name?: string; username?: string }) => {
    // Placeholder as per user request to omit messaging migration temporarily
    alert('Direct Messaging is coming soon!');
  };

  const initials = (name?: string) => {
    return (name || 'M')
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24 px-2 lg:px-4">
      
      {/* Top Navigation */}
      <button 
        onClick={() => navigate('/mentors')} 
        className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-primary-600 transition-colors bg-transparent border-none cursor-pointer"
      >
        <span className="material-icons text-sm">arrow_back</span>
        Back to Expert Directory
      </button>

      {loading && (
        <div className="h-[600px] glass-card flex flex-col items-center justify-center gap-4 text-slate-400">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
           <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Assembling Profile...</p>
        </div>
      )}

      {!loading && mentor && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Sticky Profile Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="glass-card p-10 flex flex-col items-center text-center space-y-6 border border-white/40 shadow-2xl">
              
              {/* Large Avatar */}
              <div className="relative group active:scale-105 transition-transform">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-[2.5rem] p-1 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.3rem] flex items-center justify-center overflow-hidden">
                    {mentor.profilePictureUrl ? (
                      <img src={mentor.profilePictureUrl} alt={`${mentor.username} Profile`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-extrabold text-primary-600">{initials(mentor.name || mentor.username)}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl flex items-center gap-1.5 border border-slate-50 dark:border-slate-700">
                  <span className="material-icons text-emerald-500 text-sm">verified</span>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Verified</span>
                </div>
              </div>

              {/* Main Info */}
              <div className="space-y-1 pt-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate w-full">
                  {mentor.name || mentor.username}
                </h2>
                <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">
                  {mentor.specialization || 'Technical Instructor'}
                </p>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-icons text-xs">star</span>
                        {rating?.averageRating ? Number(rating.averageRating).toFixed(1) : Number(mentor.rating).toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <span className="material-icons text-xs">groups</span>
                        {reviews.length > 0 ? reviews.length : mentor.totalStudents} Learners
                    </div>
                </div>
              </div>

              {/* Pricing Highlight */}
              <div className="w-full py-6 px-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-[2rem] border border-slate-100 dark:border-slate-600 flex flex-col items-center gap-1">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Invest in yourself</p>
                 <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                   ₹{mentor.hourlyRate} <span className="text-sm font-medium text-slate-400 dark:text-slate-400">/hr</span>
                 </p>
              </div>

              {/* CTA */}
              {isOwnProfile(mentor.userId) ? (
                <div className="w-full space-y-3">
                   <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-2xl flex items-center gap-3">
                      <span className="material-icons text-primary-600">info</span>
                      <p className="text-[10px] font-bold text-primary-700 uppercase text-left leading-tight">This is how your profile appears to learners.</p>
                   </div>
                   <button onClick={() => navigate('/mentor-dashboard')} className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer">
                      <span className="material-icons text-xl">tune</span>
                      Manage Dashboard
                   </button>
                </div>
              ) : (
                <>
                  <button 
                    disabled={mentor.availabilityStatus !== 'AVAILABLE'}
                    onClick={() => bookSession(mentor.userId)}
                    className="w-full bg-primary-600 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                  >
                    <span className="material-icons text-xl">event_available</span>
                    Book a Session
                  </button>
                  <button 
                    onClick={() => openChat(mentor)} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl py-4 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest cursor-pointer"
                  >
                    <span className="material-icons-outlined text-lg">chat_bubble_outline</span>
                    Direct Message
                  </button>
                </>
              )}

              {/* Availability Status */}
              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${statusClasses(mentor.availabilityStatus).text}`}>
                 <div className={`w-2 h-2 rounded-full ${statusClasses(mentor.availabilityStatus).bg}`}></div>
                 {mentor.availabilityStatus}
              </div>

            </div>
          </div>

          {/* Right: Details & Professional Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Bio Section */}
            <div className="glass-card p-10 border border-slate-100 dark:border-slate-700 shadow-sm animate-drop-in space-y-6" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700 pb-5">
                <span className="material-icons text-primary-600">history_edu</span>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">Professional Background</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-lg whitespace-pre-line">
                {mentor.bio || 'This expert is still crafting their story. Check back soon for full details on their career journey and mentorship approach.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-slate-50/50 dark:bg-slate-700/50 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-600">
                    <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Teaching Experience</h5>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{mentor.yearsOfExperience}+ Years</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-700/50 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-600">
                    <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-2">Mentorship Style</h5>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Direct & Practical</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="material-icons text-primary-600">reviews</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">Learner Success Stories</h3>
                </div>
                {rating && (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
                        <span className="material-icons text-amber-500 text-lg">star</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {Number(rating.averageRating).toFixed(1)}
                        </span>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-400">/ 5.0</span>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reviews.map(r => (
                    <div key={r.id} className="glass-card p-8 border border-white/40 dark:border-slate-700/40 shadow-sm animate-drop-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">L</div>
                                <div className="space-y-1">
                                    <div className="flex gap-0.5 text-amber-400">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className="material-icons text-base">
                                              {star <= (r.rating || 0) ? 'star' : 'star_border'}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{r.username || 'Verified Learner'}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest pt-2">
                              {new Date(r.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"{r.comment}"</p>
                    </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-600">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-600 shadow-sm">
                        <span className="material-icons text-3xl">rate_review</span>
                    </div>
                    <div>
                        <h4 className="text-slate-800 dark:text-slate-100 font-bold">No sessions yet for this mentor</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Be the first learner to share your experience!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
