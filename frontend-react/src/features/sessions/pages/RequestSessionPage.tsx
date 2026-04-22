import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMentorStore } from '../../../store/mentorStore';
import { useSkillStore } from '../../../store/skillStore';
import { useSessionStore } from '../../../store/sessionStore';
import type { Skill, SkillCategoryGroup } from '../../../types/skill';
import './RequestSessionPage.scss';

interface RequestSessionForm {
  skillId: number | null;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
}

export const RequestSessionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mentorStore = useMentorStore();
  const skillStore = useSkillStore();
  const sessionStore = useSessionStore();

  const mentorId = Number(searchParams.get('mentorId'));
  const today = new Date().toISOString().split('T')[0];

  const durations = [
    { label: '30m', value: 30,  sub: '₹ × 0.5' },
    { label: '60m', value: 60,  sub: '₹ × 1.0' },
    { label: '90m', value: 90,  sub: '₹ × 1.5' },
    { label: '2hr', value: 120, sub: '₹ × 2.0' },
  ];

  const { register, handleSubmit, watch, setValue, formState: { isValid } } = useForm<RequestSessionForm>({
    defaultValues: {
      skillId: null,
      scheduledDate: '',
      scheduledTime: '',
      durationMinutes: 60
    }
  });

  const durationMinutes = watch('durationMinutes');

  useEffect(() => {
    sessionStore.clearError();
    if (mentorId) {
      mentorStore.loadById(mentorId);
    }
    if (skillStore.skills.length === 0) {
      skillStore.loadForSelection();
    }
    return () => mentorStore.clearSelected();
  }, [mentorId]);

  const mentorName = () => {
    const m = mentorStore.selectedMentor;
    if (!m) return 'Loading...';
    return m.name || 'Mentor';
  };

  const mentorInitials = () => {
    const nameStr = mentorName();
    if (nameStr === 'Loading...' || nameStr === 'Mentor') return 'M';
    return nameStr
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const estimatedCost = (hourlyRate: number) => {
    return (hourlyRate / 60) * durationMinutes;
  };

  const onSubmit = async (data: RequestSessionForm) => {
    const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`).toISOString();
    
    await sessionStore.requestSession({
      mentorId,
      skillId: data.skillId!,
      scheduledAt,
      durationMinutes: data.durationMinutes
    });

    if (!sessionStore.error) {
      navigate('/sessions');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button onClick={() => navigate('/mentors')} className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest hover:text-primary-700 transition-colors mb-2 dark:text-primary-400 dark:hover:text-primary-300">
            <span className="material-icons text-sm">arrow_back</span>
            Back to Catalog
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Book <span className="text-primary-600 dark:text-primary-400">Expert</span> Session</h1>
          <p className="text-slate-500 font-medium italic dark:text-slate-400">Your personalized learning path starts with a single request.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Mentor & Context */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {mentorStore.selectedMentor ? (
            <div className="glass-card p-8 border border-white/40 shadow-2xl space-y-8 animate-drop-in dark:border-white/10">
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-0.5 shadow-2xl">
                    <div className="w-full h-full bg-slate-100 rounded-[0.9rem] flex items-center justify-center overflow-hidden dark:bg-slate-900 border border-white/10">
                       {mentorStore.selectedMentor.profilePictureUrl ? (
                         <img src={mentorStore.selectedMentor.profilePictureUrl} alt={mentorName() + ' Profile'} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-3xl font-black bg-gradient-to-br from-primary-600 to-indigo-600 bg-clip-text text-transparent">{mentorInitials()}</span>
                       )}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight dark:text-white leading-tight">{mentorName()}</h3>
                    <p className="text-[10px] font-extrabold text-primary-600 uppercase tracking-[0.2em] mt-2 dark:text-primary-400 opacity-80">{mentorStore.selectedMentor.specialization}</p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] dark:text-slate-500">Hourly Rate</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{mentorStore.selectedMentor.hourlyRate}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] dark:text-slate-500">Duration</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{durationMinutes} Minutes</span>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex justify-between items-center dark:border-slate-800">
                    <span className="font-extrabold text-slate-900 text-sm uppercase tracking-widest dark:text-white">Total Estimate</span>
                    <span className="text-2xl font-black text-primary-600 tracking-tighter dark:text-primary-400">₹{Math.round(estimatedCost(mentorStore.selectedMentor.hourlyRate))}</span>
                 </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                 <span className="material-icons text-emerald-500 text-sm dark:text-emerald-400">security</span>
                 <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.15em] leading-tight">Secure Payment: You'll only be charged after the mentor accepts the session.</p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 h-80 flex flex-col items-center justify-center gap-4 animate-pulse">
               <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem]"></div>
               <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Right: Form Area */}
        <div className="lg:col-span-8">
          <div className="glass-card p-8 md:p-12 border border-slate-100 shadow-sm animate-drop-in dark:border-white/5" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              
              {/* Section: Topic */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 dark:border-slate-800">
                  <span className="material-icons text-primary-600 dark:text-primary-400">tips_and_updates</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Focus Area</h3>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="skillId" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 dark:text-slate-500">What do you want to learn? <span className="text-red-400">*</span></label>
                  <div className="relative group">
                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors dark:text-slate-600">auto_stories</span>
                    <select id="skillId" {...register('skillId', { required: true, valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200">
                      <option value="" disabled>Select Specific Expertise...</option>
                      {skillStore.groupedByCategory().map((cat: SkillCategoryGroup) => (
                        <optgroup label={cat.category} key={cat.category}>
                          {cat.skills.map((s: Skill) => (
                            <option value={s.id} key={s.id}>{s.skillName}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Schedule */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 dark:border-slate-800">
                  <span className="material-icons text-primary-600 dark:text-primary-400">event</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Pick a Time</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label htmlFor="schedDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 dark:text-slate-500">Date</label>
                    <div className="relative group">
                      <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors dark:text-slate-600">calendar_month</span>
                      <input type="date" id="schedDate" {...register('scheduledDate', { required: true })} min={today} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="schedTime" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 dark:text-slate-500">Time (Local)</label>
                    <div className="relative group">
                      <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors dark:text-slate-600">schedule</span>
                      <input type="time" id="schedTime" {...register('scheduledTime', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Duration */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 dark:border-slate-800">
                  <span className="material-icons text-primary-600 dark:text-primary-400">av_timer</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Session Length</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {durations.map(d => (
                    <button type="button" 
                      key={d.value}
                      onClick={() => setValue('durationMinutes', d.value)}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 transition-all duration-300 active:scale-95 space-y-1 group dark:border-slate-800 ${
                        durationMinutes === d.value 
                          ? 'bg-primary-600 text-white shadow-xl' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-black">{d.label}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 dark:border-slate-800">
                 <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                    <span className="material-icons">help_outline</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Mentor will have 24 hours to accept or decline.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto px-4 md:px-0">
                    <button type="button" onClick={() => navigate('/mentors')} className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:text-slate-300">Cancel</button>
                    <button type="submit" disabled={!isValid || sessionStore.loading} 
                            className="bg-primary-600 text-white rounded-2xl px-12 py-4 font-bold shadow-2xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                       {sessionStore.loading ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <>
                           <span className="material-icons text-base">send</span>
                           <span>Request Session</span>
                         </>
                       )}
                    </button>
                 </div>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
