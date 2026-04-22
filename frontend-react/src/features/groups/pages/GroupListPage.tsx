import { useState, useEffect, useMemo } from 'react';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { useSkillStore } from '../../../store/skillStore';
import { useNavigate } from 'react-router-dom';
import './GroupListPage.scss';

export const GroupListPage = () => {
  const groupStore = useGroupStore();
  const authStore = useAuthStore();
  const skillStore = useSkillStore();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', skillId: null as number | null, maxMembers: 10, description: '' });

  // Init
  useEffect(() => {
    skillStore.loadForSelection();
    groupStore.loadRandomGroups();
  }, []);

  // Auto-cleanup logic (7-day rule)
  useEffect(() => {
    if (groupStore.groups.length > 0) {
      const myId = Number(authStore.userId);
      const now = new Date();
      groupStore.groups.forEach(g => {
        if (Number(g.creatorId) === myId && (g.currentMembers || g.memberCount || 0) < 2) {
          const createdDate = new Date(g.createdAt);
          const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            console.log(`Auto-deleting group ${g.id} due to 7-day rule`);
            groupStore.deleteGroup(g.id);
          }
        }
      });
    }
  }, [groupStore.groups, authStore.userId]);

  const categories = useMemo(() => {
    return [...new Set(skillStore.skills.map(s => s.category).filter(Boolean))].sort();
  }, [skillStore.skills]);

  const filteredSkills = useMemo(() => {
    return selectedCategory ? skillStore.skills.filter(s => s.category === selectedCategory) : [];
  }, [selectedCategory, skillStore.skills]);

  const handleSearch = () => {
    if (selectedSkillId) {
      groupStore.loadGroupsBySkill(selectedSkillId);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSkillId(null);
    groupStore.loadRandomGroups();
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.skillId) return;
    setCreating(true);
    try {
      await groupStore.createGroup({
        name: newGroup.name,
        skillId: newGroup.skillId,
        maxMembers: newGroup.maxMembers,
        description: newGroup.description
      });
      setShowCreate(false);
      setNewGroup({ name: '', skillId: null, maxMembers: 10, description: '' });
    } catch (err) {
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const getCapacityPct = (g: any) => {
    const members = g.currentMembers ?? g.memberCount ?? 0;
    const max = g.maxMembers || 1;
    return Math.min(100, Math.round((members / max) * 100));
  };

  const isCreator = (g: any) => Number(authStore.userId) === Number(g.creatorId);

  return (
    <div className="page pb-20">
      <header className="page-header flex justify-between items-end">
        <div>
          <h1>Study Groups</h1>
          <p>Master new skills through collaborative peer learning</p>
        </div>
        {!authStore.roles.includes('ROLE_ADMIN') && (
          <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-primary-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
            <span className="material-icons">add_circle</span>
            Create Group
          </button>
        )}
      </header>

      <section className="search-container">
        <div className="filter-group">
          <span className="material-icons">category</span>
          <select 
            value={selectedCategory} 
            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSkillId(null); }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className={`filter-group ${!selectedCategory ? 'opacity-40' : ''}`}>
          <span className="material-icons">psychology</span>
          <select 
            disabled={!selectedCategory}
            value={selectedSkillId || ''} 
            onChange={(e) => setSelectedSkillId(Number(e.target.value))}
          >
            <option value="">Select Skill</option>
            {filteredSkills.map(s => <option key={s.id} value={s.id}>{s.skillName}</option>)}
          </select>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleSearch} 
            disabled={!selectedSkillId}
            className="bg-slate-900 text-white dark:bg-primary-600 px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:opacity-90 disabled:opacity-30 transition-all"
          >
            Filter
          </button>
          <button onClick={clearFilters} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">
            Reset
          </button>
        </div>
      </section>

      {groupStore.loading ? (
        <div className="flex justify-center py-24">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="groups-grid">
          {groupStore.groups.map(g => {
            const pct = getCapacityPct(g);
            return (
              <div key={g.id} className="group-card" onClick={() => navigate(`/groups/${g.id}`)}>
                <div className="flex justify-between items-start">
                  <div className="group-icon">
                    {g.name.slice(0, 1)}
                  </div>
                  <div className="members-count">
                    {g.currentMembers ?? g.memberCount ?? 0} / {g.maxMembers}
                  </div>
                </div>

                <div className="group-status">
                  <h3 className="uppercase truncate pr-4">{g.name}</h3>
                </div>

                <p className="group-desc">{g.description || 'Join this study group to share resources, discuss concepts, and collaborate on projects related to ' + g.skillName + '.'}</p>

                <div className="capacity-section">
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                   </div>
                   <div className="capacity-label">
                     {pct >= 100 ? 'Fully Booked' : (g.maxMembers - (g.currentMembers ?? g.memberCount ?? 0)) + ' spots available'}
                   </div>
                </div>

                <div className="group-footer">
                  {isCreator(g) ? (
                    <span className="badge creator">Creator</span>
                  ) : g.isJoined ? (
                    <span className="badge member">Joined</span>
                  ) : (
                    <span className="badge none">Join Group</span>
                  )}
                  <span className="material-icons text-slate-300">east</span>
                </div>
              </div>
            );
          })}

          {groupStore.groups.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                <span className="material-icons text-5xl">groups_3</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">No groups found</h3>
              <p className="text-slate-500">Be the first one to start a conversation about this skill.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal - Polished */}
      {showCreate && (
        <div className="modal-overlay fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
          <div className="modal-card bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl">
            <header className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Study Group</h3>
              <button 
                onClick={() => setShowCreate(false)} 
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                <span className="material-icons font-bold">close</span>
              </button>
            </header>

            <div className="space-y-8">
              <div className="input-group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Group Identity</label>
                <input 
                  type="text" 
                  value={newGroup.name} 
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g. FullStack Masters 2024"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Primary Skill</label>
                  <select 
                    value={newGroup.skillId || ''} 
                    onChange={(e) => setNewGroup({ ...newGroup, skillId: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                  >
                    <option value="">Choose Skill</option>
                    {skillStore.skills.map(s => <option key={s.id} value={s.id}>{s.skillName}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Capacity</label>
                  <input 
                    type="number" 
                    value={newGroup.maxMembers} 
                    onChange={(e) => setNewGroup({ ...newGroup, maxMembers: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Group Description</label>
                <textarea 
                  rows={4}
                  value={newGroup.description} 
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Set the goals and expectations for this group..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-6 mt-12">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-5 rounded-2xl font-black uppercase text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all">Discard</button>
              <button 
                onClick={handleCreateGroup} 
                disabled={creating || !newGroup.name || !newGroup.skillId}
                className="flex-1 py-5 rounded-2xl font-black uppercase text-sm bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {creating && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                Launch Group
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
