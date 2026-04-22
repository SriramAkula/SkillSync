import { useState, useEffect, useCallback } from 'react';
import { useSkillStore } from '../../../store/skillStore';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/apiClient';
import './SkillListPage.scss';

export const SkillListPage = () => {
  const skillStore = useSkillStore();
  const authStore = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [formData, setFormData] = useState({ skillName: '', description: '', category: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    skillStore.loadAll({ page: 0, size: skillStore.pageSize });
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) {
      skillStore.search({ keyword: q, page: 0, size: skillStore.pageSize });
    } else if (!q) {
      skillStore.loadAll({ page: 0, size: skillStore.pageSize });
    }
  }, [skillStore]);

  const handlePageChange = (page: number) => {
    if (searchQuery.length >= 2) {
      skillStore.search({ keyword: searchQuery, page, size: skillStore.pageSize });
    } else {
      skillStore.loadAll({ page, size: skillStore.pageSize });
    }
  };

  const handleCreate = () => {
    setEditingSkill(null);
    setFormData({ skillName: '', description: '', category: '' });
    setShowForm(true);
  };

  const handleEdit = (skill: any) => {
    setEditingSkill(skill);
    setFormData({ 
      skillName: skill.skillName, 
      description: skill.description || '', 
      category: skill.category || '' 
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.skillName) return;
    setSaving(true);
    try {
      if (editingSkill) {
        const res = await apiClient.put(`/skill/${editingSkill.id}`, formData);
        skillStore.updateSkill(res.data.data || res.data);
      } else {
        const res = await apiClient.post('/skill', formData);
        skillStore.addSkill(res.data.data || res.data);
      }
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save skill', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await apiClient.delete(`/skill/${id}`);
        skillStore.removeSkill(id);
      } catch (err) {
        console.error('Failed to delete skill', err);
      }
    }
  };

  const isAdmin = authStore.roles.includes('ROLE_ADMIN');

  return (
    <div className="page">
      <header className="page-header">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1>Skills Catalog</h1>
            <p>Explore specialized expertise and industry skills</p>
          </div>
          {isAdmin && (
            <button onClick={handleCreate} className="btn-add-skill bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-primary-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
              <span className="material-icons">add_circle</span>
              New Skill
            </button>
          )}
        </div>
      </header>

      <div className="search-container">
        <span className="material-icons">search</span>
        <input 
          type="text" 
          placeholder="Search skills, categories or descriptions..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => handleSearch('')} className="p-2 text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      <div className="skills-grid">
        {skillStore.loading && skillStore.skills.length === 0 ? (
          <div className="loading-center col-span-full">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : skillStore.skills.length > 0 ? (
          skillStore.skills.map((skill: any) => (
            <div key={skill.id} className="skill-card">
              <div className="skill-header">
                <div className="skill-icon">
                  {skill.skillName.slice(0, 1)}
                </div>
                <div className="skill-meta">
                  <div className="skill-category">{skill.category || 'Expertise'}</div>
                  <h3>{skill.skillName}</h3>
                </div>
              </div>

              <p className="skill-desc">{skill.description || 'Professional competency in ' + skill.skillName + '. Master this skill to accelerate your career growth.'}</p>

              <div className="skill-footer">
                <div className="popularity-chip">
                  <span className="material-icons">trending_up</span>
                  {skill.popularityScore || 0} Learners
                </div>

                {isAdmin && (
                  <div className="admin-actions">
                    <button onClick={() => handleEdit(skill)} className="btn-action edit">
                      <span className="material-icons">edit</span>
                    </button>
                    <button onClick={() => handleDelete(skill.id)} className="btn-action delete">
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <span className="material-icons">inventory_2</span>
            </div>
            <h3>No skills found</h3>
            <p>Try adjusting your search query or add a new skill to the catalog.</p>
          </div>
        )}
      </div>

      {/* Pagination Fix if needed */}
      {skillStore.totalElements > skillStore.pageSize && (
        <div className="flex justify-center items-center gap-8 mt-12 mb-20 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20">
          <button 
            disabled={skillStore.currentPage === 0}
            onClick={() => handlePageChange(skillStore.currentPage - 1)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl active:scale-95 disabled:opacity-30 transition-all"
          >
            <span className="material-icons">west</span> Prev
          </button>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Page {skillStore.currentPage + 1}
          </span>
          <button 
            disabled={skillStore.skills.length < skillStore.pageSize}
            onClick={() => handlePageChange(skillStore.currentPage + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl active:scale-95 disabled:opacity-30 transition-all"
          >
            Next <span className="material-icons">east</span>
          </button>
        </div>
      )}

      {/* Modal - Polished */}
      {showForm && (
        <div className="modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
          <div className="modal-card bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl">
            <header className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingSkill ? 'Edit Skill' : 'New Skill'}
              </h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                <span className="material-icons font-bold">close</span>
              </button>
            </header>

            <div className="space-y-8">
              <div className="input-group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Skill Name</label>
                <input 
                  type="text" 
                  value={formData.skillName} 
                  onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                  placeholder="e.g. Advanced TypeScript"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                />
              </div>

              <div className="input-group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Category</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Frontend Development"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                />
              </div>

              <div className="input-group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What should learners know about this skill?"
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-6 mt-12">
              <button onClick={() => setShowForm(false)} className="flex-1 py-5 rounded-2xl font-black uppercase text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={saving || !formData.skillName}
                className="flex-1 py-5 rounded-2xl font-black uppercase text-sm bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xl shadow-primary-500/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {saving && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                {editingSkill ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
