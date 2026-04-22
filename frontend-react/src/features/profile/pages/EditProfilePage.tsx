import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';
import { useSkillStore } from '../../../store/skillStore';

const editProfileSchema = z.object({
  firstName: z.string().min(2, 'First name is required (min 2 chars)').max(100),
  lastName: z.string().min(2, 'Last name is required (min 2 chars)').max(100),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const skillStore = useSkillStore();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  });

  const username = watch('username');

  useEffect(() => {
    if (skillStore.skills.length === 0) {
      skillStore.loadForSelection();
    }
    
    if (!userStore.profile) {
      userStore.loadProfile();
    }
  }, []);

  useEffect(() => {
    if (userStore.profile) {
      const p = userStore.profile;
      const [fName, ...lNameParts] = (p.name || '').split(' ');
      setValue('firstName', fName || '');
      setValue('lastName', lNameParts.join(' ') || '');
      setValue('username', p.username || '');
      setValue('phoneNumber', p.phoneNumber || '');
      setValue('bio', p.bio || '');
      
      if (p.skills) {
        setSelectedSkills(p.skills.split(',').map(s => s.trim()).filter(Boolean));
      }
    }
  }, [userStore.profile, setValue]);

  // Async username check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (username && username.length >= 2 && username !== userStore.profile?.username) {
        const available = await userStore.checkUsernameAvailability(username);
        setUsernameAvailable(available);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, userStore.profile?.username]);

  const addSkill = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skill = e.target.value;
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
    }
    e.target.value = '';
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const onSubmit = async (data: EditProfileFormData) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updateData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim(),
        skills: selectedSkills.join(','),
      };
      await userStore.updateProfile(updateData);
      // Update local auth store too if needed
      authStore.setUser({
        ...authStore.user!,
        name: updateData.name,
        username: updateData.username,
        phoneNumber: updateData.phoneNumber,
        bio: updateData.bio,
        skills: updateData.skills
      });
      navigate('/profile');
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (userStore.loading && !userStore.profile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 px-2 lg:px-0">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest hover:text-primary-700 transition-colors mb-2">
            <span className="material-icons text-sm">arrow_back</span>
            Back to Profile
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Edit <span className="text-primary-600">Profile</span></h1>
          <p className="text-slate-500 font-medium italic">Shape your identity on SkillSync.</p>
        </div>
      </div>

      <div className="glass-card p-8 md:p-12 border border-white/40 shadow-2xl shadow-primary-900/5 animate-drop-in">
        {/* Error Alert */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
            <div className="flex gap-3">
              <span className="material-icons text-red-600 flex-shrink-0 mt-0.5">error_outline</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Update Failed</p>
                <p className="text-sm text-red-600 mt-1">{saveError}</p>
                <button type="button" onClick={() => setSaveError(null)} className="text-xs text-red-600 hover:text-red-800 font-semibold mt-2 transition-colors">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Section: Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-800 dark:text-white">
              <span className="material-icons text-primary-600">fingerprint</span>
              <h3 className="text-sm font-bold uppercase tracking-widest">Identity & Contact</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input
                  {...register('firstName')}
                  type="text"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.firstName ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-white`}
                />
                {errors.firstName && <p className="text-xs text-red-600 font-semibold">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input
                  {...register('lastName')}
                  type="text"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.lastName ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-white`}
                />
                {errors.lastName && <p className="text-xs text-red-600 font-semibold">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
                <div className="relative">
                  <input
                    {...register('username')}
                    type="text"
                    className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.username ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-white font-mono`}
                  />
                  {usernameAvailable === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-red-500 text-sm">close</span>
                  )}
                  {usernameAvailable === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-green-500 text-sm">check</span>
                  )}
                </div>
                {errors.username && <p className="text-xs text-red-600 font-semibold">{errors.username.message}</p>}
                {usernameAvailable === false && <p className="text-xs text-red-600 font-semibold">Username already taken</p>}
              </div>
              <div className="space-y-1.5 opacity-60">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email (Immutable)</label>
                <input
                  value={userStore.profile?.email || ''}
                  readOnly
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm cursor-not-allowed font-mono text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                <input
                  {...register('phoneNumber')}
                  type="text"
                  placeholder="10 digit number"
                  className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.phoneNumber ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-white font-mono`}
                />
                {errors.phoneNumber && <p className="text-xs text-red-600 font-semibold">{errors.phoneNumber.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Professional Bio */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-800 dark:text-white">
              <span className="material-icons text-primary-600">history_edu</span>
              <h3 className="text-sm font-bold uppercase tracking-widest">Professional Bio</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tell your story</label>
              <textarea
                {...register('bio')}
                rows={5}
                className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.bio ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-2xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 dark:text-white leading-relaxed resize-none`}
                placeholder="Share your experience, passions, and goals..."
              />
              <div className="flex justify-between px-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">500 Characters Max</span>
                {errors.bio && <p className="text-xs text-red-600 font-semibold">{errors.bio.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Skills Cloud */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-800 dark:text-white">
              <span className="material-icons text-primary-600">auto_awesome</span>
              <h3 className="text-sm font-bold uppercase tracking-widest">Skills & Expertise</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((s) => (
                  <div key={s} className="bg-primary-600 text-white pl-4 pr-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg animate-fade-in transition-all">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:bg-primary-700 p-0.5 rounded-lg transition-colors">
                      <span className="material-icons text-xs">close</span>
                    </button>
                  </div>
                ))}
                {selectedSkills.length === 0 && (
                  <div className="py-4 px-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center w-full">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No skills added yet</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">add_task</span>
                <select
                  onChange={addSkill}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 dark:text-white cursor-pointer appearance-none"
                >
                  <option value="" disabled selected>Add Expertise...</option>
                  {skillStore.groupedByCategory().map((cat) => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.skills.map((s) => (
                        <option key={s.id} value={s.skillName} disabled={selectedSkills.includes(s.skillName)}>
                          {s.skillName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto px-10 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || usernameAvailable === false}
              className="w-full sm:w-auto bg-primary-600 text-white rounded-2xl px-12 py-4 font-bold shadow-xl hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-icons text-base">verified</span>
              )}
              <span>Commit Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
