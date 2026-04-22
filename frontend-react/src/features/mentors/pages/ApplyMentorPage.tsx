import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMentorStore } from '../../../store/mentorStore';
import { useSkillStore } from '../../../store/skillStore';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/apiClient';
import type { UserProfile } from '../../../types/auth';
import './ApplyMentorPage.scss';

export const ApplyMentorPage = () => {
  const navigate = useNavigate();
  const mentorStore = useMentorStore();
  const skillStore = useSkillStore();
  const authStore = useAuthStore();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [baseProfile, setBaseProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState('');
  
  const [form, setForm] = useState({
    yearsOfExperience: '' as string | number,
    hourlyRate: '' as string | number,
    bio: ''
  });

  const benefits = [
    { icon: 'payments', title: 'Monetize Skillsets', desc: 'Turn your professional experience into a secondary income stream with hourly-based sessions.' },
    { icon: 'public', title: 'Global Impact', desc: 'Connect with students across time zones and help bridge the professional skill gap worldwide.' },
    { icon: 'workspace_premium', title: 'Verified Badge', desc: 'Successful mentors receive a verified checkmark increasing visibility and trust in the marketplace.' },
  ];

  // Robust aggregation: baseProfile takes precedence for new/updated external skills
  const userSkills = useMemo(() => {
    const m = mentorStore.myProfile;
    const b = baseProfile;
    
    // Priority: baseProfile (latest save) -> mentor.user (enriched) -> mentor.specialization (draft)
    const sources = [
      b?.skills,
      m?.user?.skills,
      m?.specialization
    ];

    const bestSource = sources.find(s => !!s && s.trim().length > 0) || '';
    return [...new Set((bestSource as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0))];
  }, [mentorStore.myProfile, baseProfile]);

  useEffect(() => {
    setSelectedSkills([]);
    mentorStore.loadMyProfile();
    skillStore.loadForSelection();
    
    setLoadingProfile(true);
    // User profile deep-sync
    apiClient.get('/user/profile/me')
      .then(res => {
        const profile = res.data;
        setBaseProfile(profile);
        
        // DEEP SYNC: Prioritize Java if detected in profile
        const profileSkills = profile?.skills?.split(',').map((s: string) => s.trim()) || [];
        if (profileSkills.includes('Java')) {
          setSelectedSkills(prev => [...new Set(['Java', ...prev])]);
        }
      })
      .catch(() => setBaseProfile(null))
      .finally(() => setLoadingProfile(false));
  }, []);

  useEffect(() => {
    if (!mentorStore.loading && !loadingProfile) {
      setCheckingProfile(false);
    }
  }, [mentorStore.loading, loadingProfile]);

  useEffect(() => {
    if (userSkills.length > 0 && selectedSkills.length === 0) {
      setSelectedSkills(userSkills);
    }
  }, [userSkills]);

  const forceRefreshProfile = () => {
    setCheckingProfile(true);
    setSelectedSkills([]);
    mentorStore.loadMyProfile();
    setLoadingProfile(true);
    apiClient.get('/user/profile/me')
      .then(res => {
        const profile = res.data as UserProfile;
        setBaseProfile(profile);
        setLoadingProfile(false);
      })
      .catch(() => {
        setBaseProfile(null);
        setLoadingProfile(false);
      });
  };

  const isFormValid = () => {
    const { yearsOfExperience, hourlyRate, bio } = form;
    return selectedSkills.length > 0 && 
           Number(yearsOfExperience) > 0 && 
           Number(hourlyRate) > 0 && 
           Number(hourlyRate) <= 500 && 
           bio.length >= 10;
  };

  const filteredCategories = () => {
    const q = skillSearch.toLowerCase().trim();
    const map = new Map<string, { id: number; name: string }[]>();
    
    // 1. Add skills from Global Store
    const storeSkills = skillStore.skills;
    storeSkills.forEach(s => {
      const cat = s.category?.trim() || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ id: s.id, name: s.skillName });
    });

    // 2. Ensure ALL profile skills are represented
    const allKnownSkillNames = new Set(storeSkills.map(s => s.skillName));
    const profileOnlySkills = userSkills.filter(name => !allKnownSkillNames.has(name));
    
    if (profileOnlySkills.length > 0) {
      const cat = 'Expertise from Your Profile';
      if (!map.has(cat)) map.set(cat, []);
      profileOnlySkills.forEach((name, i) => {
        map.get(cat)!.push({ id: 9999 + i, name });
      });
    }
    
    let result = Array.from(map.entries())
      .sort((a, b) => a[0].includes('Profile') ? -1 : a[0].localeCompare(b[0]))
      .map(([category, skills]) => ({ 
        category, 
        skills: skills.sort((a, b) => a.name.localeCompare(b.name)) 
      }));
    
    const userSkillNamesSet = new Set(userSkills);
    result = result.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => userSkillNamesSet.has(s.name))
    })).filter(cat => cat.skills.length > 0);

    if (q) {
      result = result.map(cat => ({ 
        ...cat, 
        skills: cat.skills.filter(s => s.name.toLowerCase().includes(q)) 
      })).filter(cat => cat.skills.length > 0);
    }
    
    return result;
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(current => current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setSubmissionError(null);
    const { yearsOfExperience, hourlyRate, bio } = form;
    const specialization = selectedSkills.join(', ');
    
    await mentorStore.applyAsMentor({ 
      specialization, 
      yearsOfExperience: Number(yearsOfExperience), 
      hourlyRate: Number(hourlyRate), 
      bio 
    });

    if (mentorStore.error) {
       setSubmissionError(mentorStore.error);
    } else {
       authStore.addRole('ROLE_MENTOR');
    }
  };

  const statusClasses = () => {
    const s = mentorStore.myProfile?.status || 'PENDING';
    const map: Record<string, { bg: string; text: string }> = {
      'PENDING': { bg: 'bg-amber-500 shadow-amber-100', text: 'text-amber-600' },
      'APPROVED': { bg: 'bg-emerald-500 shadow-emerald-100', text: 'text-emerald-600' },
      'REJECTED': { bg: 'bg-red-500 shadow-red-100', text: 'text-red-600' }
    };
    return map[s] || map['PENDING'];
  };

  const statusIcon = (status?: string) => {
    const icons: Record<string, string> = { 
      PENDING: 'hourglass_empty', 
      REQUESTED: 'schedule',
      APPROVED: 'verified', 
      REJECTED: 'cancel' 
    };
    return icons[status || 'PENDING'] ?? 'info';
  };

  const statusMessage = (status?: string) => {
    const msgs: Record<string, string> = {
      PENDING: "Your application is waiting for review. Our team will respond soon.",
      REQUESTED: "Your application has been submitted. Awaiting admin review.",
      APPROVED: 'Your mentor profile has been approved! You can now accept mentoring sessions.',
      REJECTED: 'Your application was declined. You can re-apply once you have more experience.'
    };
    return msgs[status || 'PENDING'] ?? 'Application status unknown';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">
      
      {/* Back Button */}
      <button onClick={() => navigate('/mentors')} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-primary-600 transition-colors">
        <span className="material-icons text-sm">arrow_back</span>
        Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Branding & Value Proposition */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <span className="material-icons text-3xl">rocket_launch</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Elevate your career as a <span className="text-primary-600 dark:text-primary-400 underline underline-offset-8 decoration-primary-200 dark:decoration-primary-800">Mentor</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">Join a global network of experts. Share your knowledge, inspire the next generation, and monetize your expertise.</p>
          </div>

          <div className="space-y-6">
            {benefits.map(b => (
              <div key={b.title} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  <span className="material-icons text-xl">{b.icon}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{b.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex gap-4 items-start dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <span className="material-icons text-emerald-500">verified</span>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest leading-relaxed dark:text-emerald-400">Fast review process: Get approved and start mentoring in as little as 48 hours.</p>
          </div>
        </div>

        {/* Right Side: Interaction Area */}
        <div className="lg:col-span-7">
          
          {checkingProfile ? (
            <div className="h-[600px] glass-card flex flex-col items-center justify-center gap-4 text-slate-400">
               <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Records...</p>
            </div>
          ) : mentorStore.myProfile ? (
            <div className="glass-card p-10 space-y-10 border border-white/40 shadow-2xl animate-drop-in dark:border-white/5">
              
              {/* Status Header */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl mb-2 ${statusClasses().bg}`}>
                  <span className="material-icons text-4xl text-white">{statusIcon(mentorStore.myProfile.status)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Application {mentorStore.myProfile.status}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 px-8">{statusMessage(mentorStore.myProfile.status)}</p>
                </div>
              </div>

              {/* Summary Table */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</p>
                   <p className={`font-extrabold ${statusClasses().text}`}>{mentorStore.myProfile.status}</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Rate</p>
                   <p className="font-extrabold text-slate-800 dark:text-slate-200">₹{mentorStore.myProfile.hourlyRate}<span className="text-[11px] text-slate-400 dark:text-slate-500"> /hr</span></p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Experience</p>
                   <p className="font-extrabold text-slate-800 dark:text-slate-200">{mentorStore.myProfile.yearsOfExperience}<span className="text-[11px] text-slate-400 dark:text-slate-500"> Years</span></p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Specialization</p>
                   <p className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{mentorStore.myProfile.specialization}</p>
                </div>
              </div>

              {mentorStore.myProfile.status === 'APPROVED' && (
                <button onClick={() => navigate('/mentor-dashboard')} className="w-full bg-primary-600 text-white rounded-2xl py-4 font-bold shadow-xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span className="material-icons text-xl">speed</span>
                  Enter Mentor Dashboard
                </button>
              )}
            </div>
          ) : (
            <div className="glass-card p-8 md:p-12 border border-white/40 shadow-2xl animate-drop-in dark:border-white/5">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Section: Expertise */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <span className="material-icons text-primary-600 dark:text-primary-400">psychology_alt</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Your Expertise</h3>
                  </div>

                  {userSkills.length === 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg shrink-0">
                        <span className="material-icons text-amber-600 dark:text-amber-400">info</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">No Skills in Your Profile</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-3">Your profile expertise hasn't been synced yet. Add skills to your profile first before applying.</p>
                        <div className="flex items-center gap-4">
                          <Link to="/profile" className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1">Go to profile <span className="material-icons text-xs">arrow_forward</span></Link>
                          <button type="button" onClick={forceRefreshProfile} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                            <span className="material-icons text-xs">sync</span> Sync Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map(s => (
                        <div key={s} className="bg-primary-600 text-white pl-4 pr-1.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in group shadow-sm">
                          {s}
                          <button type="button" onClick={() => toggleSkill(s)} className="hover:bg-primary-700 p-0.5 rounded-lg transition-colors">
                            <span className="material-icons text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-sm">search</span>
                        <input 
                          type="text" 
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          placeholder="Search your expertise..."
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg py-3 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none dark:text-slate-200"
                          disabled={userSkills.length === 0}
                        />
                      </div>
                      <button type="button" onClick={forceRefreshProfile} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Re-sync with profile">
                        <span className={`material-icons text-sm ${loadingProfile ? 'animate-spin' : ''}`}>sync</span>
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-6 pr-2 scrollbar-none border border-slate-100 rounded-2xl p-4 dark:border-slate-800">
                      {filteredCategories().map(cat => (
                        <div key={cat.category} className="space-y-3">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">{cat.category}</p>
                          <div className="flex flex-wrap gap-2">
                            {cat.skills.map(s => (
                              <button 
                                type="button" 
                                key={s.id}
                                onClick={() => toggleSkill(s.name)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95 ${
                                  selectedSkills.includes(s.name) 
                                    ? 'bg-primary-50 text-primary-600 border-primary-500 ring-2 ring-primary-500 shadow-sm dark:bg-primary-900/40 dark:text-primary-400' 
                                    : 'text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-700'
                                }`}
                              >
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredCategories().length === 0 && (
                        <div className="py-8 text-center text-slate-400">
                          <span className="material-icons text-4xl mb-2 opacity-50">psychology</span>
                          <p className="text-xs font-medium">No skills matching your search</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Business Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <span className="material-icons text-primary-600">payments</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Business & Experience</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label htmlFor="yearsExp" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Years of Exp.</label>
                      <input 
                        type="number" 
                        id="yearsExp" 
                        value={form.yearsOfExperience}
                        onChange={(e) => setForm(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" 
                        placeholder="e.g. 8" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="hourlyRate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Hourly Rate (₹)</label>
                      <input 
                        type="number" 
                        id="hourlyRate" 
                        value={form.hourlyRate}
                        onChange={(e) => setForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" 
                        placeholder="Max ₹500" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Professional Pitch</label>
                    <textarea 
                      id="bio" 
                      value={form.bio}
                      onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4} 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 leading-relaxed resize-none" 
                      placeholder="Explain why you are the best mentor for your skills..."
                    ></textarea>
                    <div className={`flex justify-end text-[9px] font-bold uppercase tracking-widest ${form.bio.length < 10 ? 'text-red-500' : 'text-slate-400'}`}>
                       {form.bio.length}/500 {form.bio.length < 10 ? '· Min 10 chars required' : ''}
                    </div>
                  </div>
                </div>

                {submissionError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3">
                     <span className="material-icons text-red-500 dark:text-red-400 text-xl flex-shrink-0 mt-0.5">error_outline</span>
                     <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">Application Error</p>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{submissionError}</p>
                     </div>
                  </div>
                )}

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={!isFormValid() || mentorStore.loading} 
                    className="w-full bg-primary-600 text-white rounded-[1.5rem] py-5 font-bold shadow-2xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mentorStore.loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-icons text-xl">send</span>
                        <span>Submit Mentor Application</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
