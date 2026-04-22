import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReviewStore } from '../../../store/reviewStore';
import { useAuthStore } from '../../../store/authStore';
import './MentorReviewsPage.scss';

export const MentorReviewsPage = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const reviewStore = useReviewStore();

  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState({ sessionId: '', rating: 0, comment: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState('');

  const mId = Number(mentorId);

  useEffect(() => {
    if (mId) {
      reviewStore.loadMentorReviews(mId, 0);
      reviewStore.loadMentorRating(mId);
    }
  }, [mId]);

  const loadMore = () => {
    if (reviewStore.currentPage < reviewStore.totalPages - 1) {
      reviewStore.loadMentorReviews(mId, reviewStore.currentPage + 1);
    }
  };

  const handleSubmit = async () => {
    if (!newReview.sessionId || !newReview.rating || !newReview.comment) return;
    try {
      await reviewStore.submitReview({
        mentorId: mId,
        sessionId: Number(newReview.sessionId),
        rating: newReview.rating,
        comment: newReview.comment
      });
      setNewReview({ sessionId: '', rating: 0, comment: '' });
    } catch (error) {
      console.error('Failed to submit review', error);
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditComment(r.comment);
  };

  const handleSaveEdit = async (r: any) => {
    try {
      await reviewStore.updateReview(r.id, {
        mentorId: r.mentorId,
        sessionId: r.sessionId,
        rating: r.rating,
        comment: editComment
      });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update review', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await reviewStore.deleteReview(id);
    }
  };

  const starString = (r: number) => {
    const rounded = Math.round(r);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  };

  const ratingLabel = (r: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[r] || '';
  };

  const isLearner = authStore.roles.includes('ROLE_LEARNER');

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(`/mentors/${mId}`)}>
        <span className="material-icons">arrow_back</span> Mentor Profile
      </button>

      <div className="page-header">
        <h1 className="text-slate-900 dark:text-white">Reviews</h1>
        {reviewStore.rating && (
          <div className="rating-summary">
            <div className="big-rating">{reviewStore.rating.averageRating.toFixed(1)}</div>
            <div className="rating-details">
              <div className="stars-row">{starString(reviewStore.rating.averageRating)}</div>
              <div className="review-count">{reviewStore.rating.totalReviews} reviews</div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Form (learners only) */}
      {isLearner && (
        <div className="review-form-card dark:bg-slate-800 dark:border-slate-700">
          <h3 className="dark:text-white">Write a Review</h3>
          <p className="dark:text-slate-400">Share your experience with this mentor</p>

          <div className="form">
            <div className="input-group">
              <label htmlFor="sessionId" className="input-label dark:text-slate-300">Session ID <span className="required">*</span></label>
              <div className="input-wrapper dark:bg-slate-900 dark:border-slate-700">
                <span className="material-icons input-icon">event</span>
                <input 
                  type="number" 
                  id="sessionId" 
                  value={newReview.sessionId} 
                  onChange={(e) => setNewReview({ ...newReview, sessionId: e.target.value })}
                  placeholder="Your session ID"
                  className="dark:text-white"
                />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label dark:text-slate-300">Rating <span className="required">*</span></span>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button 
                    key={i}
                    type="button" 
                    className={`star-btn ${newReview.rating >= i ? 'active' : ''}`}
                    onClick={() => setNewReview({ ...newReview, rating: i })}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <span className="material-icons">
                      {(hoverRating || newReview.rating) >= i ? 'star' : 'star_border'}
                    </span>
                  </button>
                ))}
                <span className="rating-label">{ratingLabel(hoverRating || newReview.rating)}</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="comment" className="input-label dark:text-slate-300">Comment <span className="required">*</span></label>
              <div className="input-wrapper textarea-wrap dark:bg-slate-900 dark:border-slate-700">
                <textarea 
                  id="comment" 
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Describe your experience..." 
                  rows={4}
                  className="dark:text-white"
                ></textarea>
              </div>
            </div>

            <button 
              className="btn-submit" 
              onClick={handleSubmit}
              disabled={!newReview.sessionId || !newReview.rating || !newReview.comment || reviewStore.submitting}
            >
              {reviewStore.submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-icons">rate_review</span> 
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviewStore.loading && reviewStore.reviews.length === 0 ? (
        <div className="loading-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="reviews-list">
          {reviewStore.reviews.length > 0 ? (
            reviewStore.reviews.map((r) => (
              <div key={r.id} className="review-card dark:bg-slate-800 dark:border-slate-700">
                <div className="review-top">
                  <div className="reviewer-avatar">L</div>
                  <div className="reviewer-info">
                    <div className="stars-row">{starString(r.rating)}</div>
                    <div className="review-date dark:text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  {Number(r.learnerId) === Number(authStore.userId) && (
                    <div className="review-actions">
                      <button className="btn-edit" onClick={() => startEdit(r)}>
                        <span className="material-icons">edit</span>
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(r.id)}>
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                {editingId === r.id ? (
                  <div className="edit-form">
                    <div className="input-wrapper textarea-wrap dark:bg-slate-900 dark:border-slate-700">
                      <textarea 
                        value={editComment} 
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="dark:text-white"
                      ></textarea>
                    </div>
                    <div className="edit-actions">
                      <button className="btn-cancel-edit" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn-save-edit" onClick={() => handleSaveEdit(r)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="review-text dark:text-slate-300">{r.comment}</p>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><span className="material-icons">rate_review</span></div>
              <h3 className="dark:text-white">No reviews yet</h3>
              <p className="dark:text-slate-400">Be the first to review this mentor!</p>
            </div>
          )}

          {/* Load More Pagination */}
          {reviewStore.currentPage < reviewStore.totalPages - 1 && (
            <div className="pagination-footer">
              <button className="btn-load-more" onClick={loadMore} disabled={reviewStore.loading}>
                {reviewStore.loading ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
