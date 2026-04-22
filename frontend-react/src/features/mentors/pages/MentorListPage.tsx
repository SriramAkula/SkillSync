import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMentorStore } from '../../../store/mentorStore';
import { useSkillStore } from '../../../store/skillStore';
import { useAuthStore } from '../../../store/authStore';
import { useReviewStore } from '../../../store/reviewStore';
import { MentorCard } from '../components/MentorCard';
import { Pagination } from '../../../components/Pagination';
import type { MentorProfile } from '../../../types/mentor';
import type { SkillCategoryGroup, Skill } from '../../../types/skill';
import './MentorListPage.scss';

export const MentorListPage = () => {
  const navigate = useNavigate();
  const mentorStore = useMentorStore();
  const skillStore = useSkillStore();
  const authStore = useAuthStore();
  const reviewStore = useReviewStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availFilter, setAvailFilter] = useState('');
  
  // Extra state mirroring Angular component's logic

  const { register, watch, setValue, reset, getValues } = useForm({
    defaultValues: {
      skill: '',
      minExperience: null,
      maxExperience: null,
      maxRate: null,
      minRating: null,
    }
  });

  const filterValues = watch();

  useEffect(() => {
    mentorStore.loadApproved({ page: mentorStore.currentPage, size: mentorStore.pageSize });
    if (skillStore.skills.length === 0) {
      skillStore.loadForSelection();
    }
    if (authStore.roles.includes('ROLE_MENTOR') && authStore.user?.userId) {
      mentorStore.loadMyProfile();
      reviewStore.loadMentorRating(authStore.user.userId);
      reviewStore.loadMentorReviews(authStore.user.userId, 0, 5);
    }
  }, []);

  useEffect(() => {
    const hasFilter = 
      (filterValues.skill && filterValues.skill.length >= 2) ||
      filterValues.minExperience !== null ||
      filterValues.maxExperience !== null ||
      filterValues.maxRate !== null ||
      filterValues.minRating !== null;

    if (hasFilter) {
      const timer = setTimeout(() => {
        mentorStore.search({ ...getValues(), page: 0, size: mentorStore.pageSize });
      }, 400);
      return () => clearTimeout(timer);
    } else {
       // Ignore init fire
    }
  }, [JSON.stringify(filterValues)]);

  const syncedApprovedMentors = () => {
    const mentors = mentorStore.approvedMentors || [];
    const myProfile = mentorStore.myProfile;
    const myUserId = authStore.user?.userId;

    if (!myProfile || !myUserId) return mentors;
    return mentors.map((m: MentorProfile) => Number(m.userId) === Number(myUserId) ? myProfile : m);
  };

  const getFilteredMentors = () => {
    const hasSearchActive = 
      (filterValues.skill && filterValues.skill.length >= 2) ||
      filterValues.minExperience !== null ||
      filterValues.maxExperience !== null ||
      filterValues.maxRate !== null ||
      filterValues.minRating !== null;

    const list = (hasSearchActive ? mentorStore.searchResults : syncedApprovedMentors()) || [];
    return availFilter ? list.filter((m: MentorProfile) => m.availabilityStatus === availFilter) : list;
  };

  const filteredMentors = getFilteredMentors();

  const handleClearSearch = () => {
    reset();
    setAvailFilter('');
    mentorStore.loadApproved({ page: 0, size: mentorStore.pageSize });
  };

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-text">
          <h1>Find Your Perfect Mentor</h1>
          <p>Connect with industry experts and accelerate your career</p>
        </div>
        <form>
          <div className="search-bar dark-search-bar">
            <span className="material-icons search-icon text-slate-400">auto_stories</span>
            <select {...register('skill')} className="search-input skill-select text-white">
              <option value="" className="text-slate-900">All Skills / Specializations</option>
              {skillStore.groupedByCategory().map((cat: SkillCategoryGroup) => (
                <optgroup label={cat.category} key={cat.category} className="text-slate-900">
                  {cat.skills.map((s: Skill) => (
                    <option value={s.skillName} key={s.id}>{s.skillName}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {filterValues.skill && (
              <button type="button" className="icon-btn clear-btn text-slate-400" onClick={() => setValue('skill', '')}>
                <span className="material-icons">close</span>
              </button>
            )}
            <div className="divider-v bg-slate-700"></div>
            <button type="button" className={`icon-btn filter-toggle text-slate-400 ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)} title="Advanced Filters">
              <span className="material-icons">tune</span>
              <span className="filter-lbl text-slate-400">Filters</span>
            </button>
          </div>

          {isFilterOpen && (
            <div className="advanced-filters">
              <div className="filter-group">
                <label htmlFor="minExp">Experience (Years)</label>
                <div className="range-inputs">
                  <input type="number" id="minExp" {...register('minExperience', { setValueAs: v => v === '' ? null : parseInt(v) })} placeholder="Min" min="0" />
                  <span className="dash">-</span>
                  <input type="number" id="maxExp" {...register('maxExperience', { setValueAs: v => v === '' ? null : parseInt(v) })} placeholder="Max" min="0" aria-label="Maximum experience" />
                </div>
              </div>
              
              <div className="filter-group">
                <label htmlFor="maxRate">Max Hourly Rate ($)</label>
                <input type="number" id="maxRate" {...register('maxRate', { setValueAs: v => v === '' ? null : parseInt(v) })} placeholder="Any" min="0" />
              </div>

              <div className="filter-group">
                <label htmlFor="minRating">Minimum Rating</label>
                <select id="minRating" {...register('minRating', { setValueAs: v => v === '' ? null : parseFloat(v) })} className="rating-select">
                  <option value="">Any</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.0">3.0+ ⭐</option>
                </select>
              </div>
            </div>
          )}
        </form>

        <div className="filter-chips">
          {[
            { label: 'All', value: '' },
            { label: '🟢 Available', value: 'AVAILABLE' },
            { label: '🟡 Busy', value: 'BUSY' }
          ].map(f => (
            <button key={f.value} className={`chip ${availFilter === f.value ? 'active' : ''}`} onClick={() => setAvailFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar dark-stats-bar">
        <div className="stat-item">
          <span className="stat-num text-primary-500">{mentorStore.totalElements}</span>
          <span className="stat-lbl">Mentors</span>
        </div>
        <div className="divider-v"></div>
        <div className="stat-item">
          <span className="stat-num text-primary-500">{filteredMentors.length}</span>
          <span className="stat-lbl">Showing</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mentor-grid-container">

      {/* Loading */}
      {mentorStore.loading && (
        <div className="loading-center">
          <div className="spinner-placeholder" /> {/* Replaces mat-spinner */}
          <p>Finding mentors for you...</p>
        </div>
      )}

      {/* Error */}
      {mentorStore.error && (
        <div className="error-banner dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300">
          <span className="material-icons">error_outline</span>
          {mentorStore.error}
        </div>
      )}

      {/* Grid */}
      {!mentorStore.loading && (
        <>
          <div className="mentor-grid">
            {filteredMentors.map((mentor: MentorProfile) => (
              <MentorCard 
                key={mentor.id}
                mentor={mentor} 
                overrideRating={mentor.userId === authStore.user?.userId ? reviewStore.rating?.averageRating : undefined}
                overrideLearnersCount={mentor.userId === authStore.user?.userId ? reviewStore.reviews.length : undefined}
                onView={(id) => navigate(`/mentors/${id}`)} 
                onBook={(id) => navigate(`/sessions/request?mentorId=${id}`)} 
                onChat={() => {}}
              />
            ))}
            {filteredMentors.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon dark:bg-slate-800"><span className="material-icons dark:text-slate-600">search_off</span></div>
                <h3 className="dark:text-slate-200">No mentors found</h3>
                <p className="dark:text-slate-400">Try a different skill or remove filters</p>
                <button className="btn-reset" onClick={handleClearSearch}>Clear Search</button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {mentorStore.totalElements > mentorStore.pageSize && (
            <div className="pagination-wrapper">
              <Pagination 
                totalItems={mentorStore.totalElements} 
                pageSize={mentorStore.pageSize} 
                currentPage={mentorStore.currentPage}
                onPageChange={(page) => mentorStore.loadApproved({ page, size: mentorStore.pageSize })} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
