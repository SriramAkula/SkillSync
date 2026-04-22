import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { useSkillStore } from '../../../store/skillStore';
import './ProfilePage.scss';

const CORE_FIELDS = [
  { key: 'username', label: 'Add a username' },
  { key: 'name', label: 'Add name' },
  { key: 'bio', label: 'Complete your bio' },
  { key: 'phoneNumber', label: 'Add phone number' },
  { key: 'skills', label: 'Select your skills' }
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const skillStore = useSkillStore();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('userAvatar'));
  const [showConfetti, setShowConfetti] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    userStore.loadProfile();
    userStore.loadActivities();
    skillStore.loadForSelection();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // No-op since we removed the state but let's keep the logic if needed or just remove it
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const completionPercentage = useMemo(() => {
    if (!userStore.profile) return 0;
    let filledCount = 0;
    const p = userStore.profile as any;
    if (p.username) filledCount++;
    if (p.name) filledCount++;
    if (p.bio) filledCount++;
    if (p.phoneNumber) filledCount++;
    if (p.skills) filledCount++;

    const basePercentage = (filledCount / CORE_FIELDS.length) * 90;
    const bonus = avatarUrl ? 10 : 0;
    return Math.min(100, Math.round(basePercentage + bonus));
  }, [userStore.profile, avatarUrl]);

  useEffect(() => {
    if (completionPercentage === 100 && !localStorage.getItem('profileBadgeShown')) {
      setShowConfetti(true);
      localStorage.setItem('profileBadgeShown', 'true');
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [completionPercentage]);

  const profileLevel = useMemo(() => {
    if (completionPercentage < 40) return 'Beginner 🥉';
    if (completionPercentage < 80) return 'Intermediate 🥈';
    return 'Pro 🥇';
  }, [completionPercentage]);

  const initials = () => {
    return (userStore.profile?.name || authStore.user?.name || '?').charAt(0).toUpperCase();
  };

  const selectedSkills = useMemo(() => {
    return userStore.profile?.skills ? userStore.profile.skills.split(',').map(s => s.trim()) : [];
  }, [userStore.profile?.skills]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        localStorage.setItem('userAvatar', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const ts = new Date(dateStr).getTime();
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  if (userStore.loading && !userStore.profile) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary-500/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials()
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <span className="material-icons text-white">camera_alt</span>
              <input type="file" hidden onChange={handleFileChange} accept="image/*" />
            </label>
          </div>
          {completionPercentage === 100 && (
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1 rounded-full border-2 border-white shadow-lg animate-bounce">
              <span className="material-icons text-white text-sm">stars</span>
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              {userStore.profile?.name || 'Your Name'}
            </h1>
            <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wider dark:bg-primary-900/30 dark:text-primary-400">
              {authStore.roles.includes('ROLE_ADMIN') ? 'Admin' : (authStore.roles.includes('ROLE_MENTOR') ? 'Mentor' : 'Learner')}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            @{userStore.profile?.username || 'username'}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="material-icons text-sm">location_on</span>
              <span className="text-sm">{userStore.profile?.location || 'Add location'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="material-icons text-sm">email</span>
              <span className="text-sm">{userStore.profile?.email || authStore.user?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/profile/edit" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold transition-all shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700">
            <span className="material-icons text-sm">edit</span>
            <span>Edit Profile</span>
          </Link>
          <button onClick={() => authStore.logout()} className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-all dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40">
            <span className="material-icons text-xl">logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-icons text-primary-500">insights</span>
              Profile Maturity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 dark:text-slate-400">Completion</span>
                <span className="font-bold text-primary-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="material-icons text-xs">workspace_premium</span>
                Level: <span className="font-bold text-slate-800 dark:text-white ml-auto">{profileLevel}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-icons text-primary-500">description</span>
              About Me
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              {userStore.profile?.bio || 'You haven\'t added a bio yet. Tell people about your expertise and interests.'}
            </p>
          </div>
                  <span key={idx} className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium border border-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm italic">No skills listed</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-icons text-primary-500">history</span>
              Recent Activity
            </h3>
            <div className="space-y-6">
              {userStore.activities.length > 0 ? (
                userStore.activities.map((act) => (
                  <div key={act.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center dark:bg-slate-700">
                      <span className="material-icons text-xl text-slate-500">
                        {act.type?.includes('SESSION') ? 'event' : 'notifications'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {act.message}
                      </p>
                      <span className="text-xs text-slate-400">{formatTime(act.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons text-4xl text-slate-200 dark:text-slate-700 mb-2">dashboard_customize</span>
                  <p className="text-slate-400 text-sm">No recent activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-4xl animate-bounce">🎉 Perfect Profile! 🌟</div>
        </div>
      )}
    </div>
  );
};
