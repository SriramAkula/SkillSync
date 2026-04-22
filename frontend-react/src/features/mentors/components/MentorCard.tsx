import React from 'react';
import type { MentorProfile } from '../../../types/mentor';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/apiClient';
import './MentorCard.scss'; // Assuming we'll add the scss if needed

interface MentorCardProps {
  mentor: MentorProfile & { username?: string };
  overrideRating?: number | null;
  overrideLearnersCount?: number | null;
  onView: (id: number) => void;
  onBook: (id: number) => void;
  onChat?: (id: number) => void;
  enrichedRating?: number | null;
  enrichedReviewCount?: number | null;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  overrideRating,
  overrideLearnersCount,
  onView,
  onBook,
  onChat,
  enrichedRating,
  enrichedReviewCount
}) => {
  const { user } = useAuthStore();
  const [localRating, setLocalRating] = React.useState<number | null>(null);
  const [localReviewCount, setLocalReviewCount] = React.useState<number | null>(null);
  const isOwnProfile = user?.userId === mentor.userId;

  React.useEffect(() => {
    // Only fetch if we haven't been provided overrides
    if (overrideRating === undefined && enrichedRating === undefined) {
      apiClient.get(`/review/mentors/${mentor.userId}/rating`)
        .then(res => {
          const data = res.data.data || res.data;
          setLocalRating(data.averageRating);
          setLocalReviewCount(data.totalReviews);
        })
        .catch(err => {
          console.warn(`Failed to enrich ratings for mentor ${mentor.userId}`, err);
        });
    }
  }, [mentor.userId, overrideRating, enrichedRating]);
  const initials = () => {
    const name = mentor.name || mentor.username || 'M';
    return name.charAt(0).toUpperCase();
  };

  const finalRating = overrideRating ?? enrichedRating ?? localRating ?? mentor.rating;
  const finalReviews = overrideLearnersCount ?? enrichedReviewCount ?? localReviewCount ?? mentor.totalStudents;

  return (
    <div 
      className="card" 
      onClick={() => onView(mentor.userId)} 
      onKeyUp={(e) => e.key === 'Enter' && onView(mentor.userId)}
      tabIndex={0} 
      role="button" 
      aria-label={`View profile of ${mentor.name || mentor.username}`}
    >
      <div className="card-top">
        <div className="avatar">{initials()}</div>
        <div className={`avail-badge avail-${mentor.availabilityStatus.toLowerCase()}`}>
          <span className="dot"></span>{mentor.availabilityStatus}
        </div>
      </div>

      <div className="card-body">
        <h3 className="mentor-name">{mentor.name || mentor.username}</h3>
        <p className="specialization">{mentor.specialization}</p>
        <p className="experience">{mentor.yearsOfExperience} years of experience</p>

        <div className="stats">
          <div className="stat">
            <span className="material-icons stat-icon">star</span>
            <span className="stat-val">
              {Number(finalRating).toFixed(1)}
            </span>
          </div>
          <div className="stat">
            <span className="material-icons stat-icon">reviews</span>
            <span className="stat-val">{finalReviews}</span>
          </div>
          <div className="stat">
            <span className="material-icons stat-icon">payments</span>
            <span className="stat-val">₹{mentor.hourlyRate}/hr</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        {isOwnProfile ? (
          <button 
            className="btn-manage" 
            onClick={(e) => { e.stopPropagation(); onView(mentor.userId); }}
          >
            <span className="material-icons">settings</span> Manage Profile
          </button>
        ) : (
          <div className="mentor-actions-row">
            <button 
              className="btn-book"
              onClick={(e) => { e.stopPropagation(); onBook(mentor.userId); }}
              disabled={mentor.availabilityStatus !== 'AVAILABLE'}
            >
              Book Session
            </button>
            <button 
              className="btn-view" 
              onClick={(e) => { e.stopPropagation(); onView(mentor.userId); }} 
            >
              View
            </button>
            <button 
              className="btn-chat-icon" 
              onClick={(e) => { e.stopPropagation(); onChat && onChat(mentor.userId); }}
            >
              <span className="material-icons text-white">chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
