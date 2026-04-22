import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { useSkillStore } from '../../../store/skillStore';
import './GroupDetailPage.scss';

export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupStore = useGroupStore();
  const authStore = useAuthStore();
  const skillStore = useSkillStore();

  useEffect(() => {
    if (id) {
      groupStore.loadGroupDetails(Number(id));
      if (skillStore.skills.length === 0) {
        skillStore.loadForSelection();
      }
    }
  }, [id]);

  const group = groupStore.selectedGroup;

  const handleJoin = async () => {
    try {
      await groupStore.joinGroup(group!.id);
      alert('Joined group successfully!');
    } catch (err) {
      alert('Failed to join group');
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await groupStore.leaveGroup(group!.id);
        alert('Left group successfully.');
      } catch (err) {
        alert('Failed to leave group');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await groupStore.deleteGroup(group!.id);
        navigate('/groups');
      } catch (err) {
        alert('Failed to delete group');
      }
    }
  };

  const getSkillName = (skillId: number) => {
    const s = skillStore.skills.find(sk => sk.id === skillId);
    return s ? s.skillName : `Skill #${skillId}`;
  };

  const getCapacityPct = (g: any) => {
    const members = g.currentMembers ?? g.memberCount ?? 0;
    const max = g.maxMembers || 1;
    return Math.min(100, Math.round((members / max) * 100));
  };

  if (groupStore.loading && !group) {
    return (
      <div className="loading-center flex justify-center py-20">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="empty-state py-20 text-center">
        <span className="material-icons text-6xl text-slate-300">broken_image</span>
        <h3 className="text-2xl font-black mt-6">Group not found</h3>
        <button onClick={() => navigate('/groups')} className="mt-6 btn btn-outline border-2 px-6 py-2 rounded-xl font-bold">Back to Directory</button>
      </div>
    );
  }

  const members = group.currentMembers ?? group.memberCount ?? 0;
  const pct = getCapacityPct(group);
  const isCreator = Number(authStore.userId) === Number(group.creatorId);
  const isFull = members >= group.maxMembers;

  return (
    <div className="page max-w-5xl mx-auto px-6 py-10">
      <button onClick={() => navigate('/groups')} className="back-btn group flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-primary-600 mb-8 transition-all">
        <span className="material-icons text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Groups
      </button>

      <div className="layout grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div className="main-content">
          <div className="group-card bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] shadow-2xl overflow-hidden relative">
            <div className="group-header flex items-center gap-8 mb-10 border-b-2 border-slate-50 dark:border-slate-800 pb-10">
              <div className="group-avatar w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary-500/30">
                {group.name.slice(0, 1)}
              </div>
              <div className="group-meta flex-1">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{group.name}</h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="skill-chip px-4 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-black uppercase tracking-widest leading-none">
                    {getSkillName(group.skillId)}
                  </span>
                  <span className={`status-badge px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest leading-none ${group.isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                    {group.isActive ? '✓ Active' : '● Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="description-section mb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ms-1">Mission & Goal</h4>
              <p className="group-desc text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                {group.description || "This group is dedicated to collaborative learning and development in " + getSkillName(group.skillId) + ". Members share resources, solve problems together, and participate in peer-to-peer mentoring."}
              </p>
            </div>

            <div className="stats-row grid grid-cols-3 gap-6">
              <div className="stat-box p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 rounded-[2rem] text-center transition-all">
                <span className="stat-val text-3xl font-black text-primary-600 dark:text-primary-400 block mb-1">{members}</span>
                <span className="stat-lbl text-[10px] font-black uppercase tracking-widest text-slate-400">Members</span>
              </div>
              <div className="stat-box p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 rounded-[2rem] text-center transition-all">
                <span className="stat-val text-3xl font-black text-primary-600 dark:text-primary-400 block mb-1">{group.maxMembers}</span>
                <span className="stat-lbl text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity</span>
              </div>
              <div className="stat-box p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 rounded-[2rem] text-center transition-all">
                <span className={`stat-val text-3xl font-black block mb-1 ${group.maxMembers - members <= 2 ? 'text-red-500' : 'text-primary-600 dark:text-primary-400'}`}>{group.maxMembers - members}</span>
                <span className="stat-lbl text-[10px] font-black uppercase tracking-widest text-slate-400">Spots Left</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="sidebar-content space-y-6">
          <div className="actions-card bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <span className="material-icons text-primary-500">bolt</span> Quick Actions
            </h3>
            
            <div className="space-y-4">
              {isCreator ? (
                <>
                  <div className="creator-note bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border-2 border-amber-100 dark:border-amber-900/30">
                    <span className="material-icons">stars</span> You are the creator
                  </div>
                  <button onClick={handleDelete} className="action-btn w-full py-4 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-200 transition-all active:scale-95">
                    <span className="material-icons">delete_forever</span> Delete Group
                  </button>
                </>
              ) : group.isJoined ? (
                <>
                  <div className="member-status bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border-2 border-emerald-100 dark:border-emerald-900/30">
                    <span className="material-icons">verified</span> You are a member
                  </div>
                  {/* Messaging removed as per user request */}
                  <button onClick={handleLeave} className="action-btn w-full py-4 bg-red-50 dark:bg-red-950/10 text-red-500 dark:text-red-400 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 border-2 border-red-100 dark:border-red-900/20">
                    <span className="material-icons">logout</span> Leave Group
                  </button>
                </>
              ) : isFull ? (
                <div className="full-notice bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center border-2 border-red-100 dark:border-red-900/30">
                  <span className="material-icons text-3xl mb-2">error_outline</span>
                  <p className="font-black uppercase text-xs tracking-widest">Group is Full</p>
                  <p className="text-[10px] mt-1 opacity-80">This learning pod has reached its max capacity.</p>
                </div>
              ) : (
                <button onClick={handleJoin} className="action-btn w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary-500/30 hover:scale-105 transition-all active:scale-95">
                  <span className="material-icons">person_add</span> Join Squad
                </button>
              )}
            </div>
          </div>

          <div className="capacity-card bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
            <div className="capacity-section">
              <div className="capacity-label flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Space Occupancy</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${pct > 90 ? 'text-red-500 animate-pulse' : 'text-primary-500'}`}>{pct}% Full</span>
              </div>
              <div className="capacity-bar h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 p-1">
                <div className={`capacity-fill h-full rounded-full transition-all duration-1000 ${pct > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-indigo-500'}`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed text-center font-medium italic">
                {isFull ? "No more spots available at this time." : `Only ${group.maxMembers - members} seats remaining for live collaboration sessions.`}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
