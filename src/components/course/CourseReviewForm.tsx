import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle2, Lock, Edit3, Trash2, GraduationCap, AlertCircle } from 'lucide-react';
import { Review, User } from '../../types';
import { storageService } from '../../services/storage';

interface CourseReviewFormProps {
  courseId: string;
  courseTitle: string;
  isEnrolled: boolean;
  user: User | null;
  onReviewSubmitted: (review: Review) => void;
  onReviewDeleted?: (reviewId: string) => void;
  onEnrollClick?: () => void;
  coursePrice?: number;
}

const RATING_LABELS: Record<number, string> = {
  1: '★ 1/5 — Needs Improvement',
  2: '★ 2/5 — Below Expectations',
  3: '★ 3/5 — Good & Practical',
  4: '★ 4/5 — Very Good Masterclass',
  5: '★ 5/5 — Masterclass Excellence!'
};

export const CourseReviewForm: React.FC<CourseReviewFormProps> = ({
  courseId,
  courseTitle,
  isEnrolled,
  user,
  onReviewSubmitted,
  onReviewDeleted,
  onEnrollClick,
  coursePrice = 499
}) => {
  // Check if current user already submitted a review for this course
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Load existing review on mount or user/course change
  useEffect(() => {
    if (user && courseId) {
      const allReviews = storageService.getReviews();
      const cleanCourseId = (courseId || '').trim().toLowerCase();
      const found = allReviews.find(
        r =>
          (r.courseId || '').trim().toLowerCase() === cleanCourseId &&
          (r.userId === user.id || (user.email && r.userId === user.email))
      );
      if (found) {
        setExistingReview(found);
        setRating(found.rating);
        setComment(found.comment);
      } else {
        setExistingReview(null);
        setRating(5);
        setComment('');
      }
    } else {
      setExistingReview(null);
    }
  }, [user, courseId]);

  // Handle Submit / Update
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnrolled || !user) {
      setErrorMsg('Only enrolled students can leave a comment.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.');
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      setErrorMsg('Please write at least 5 characters in your review comment.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (existingReview) {
        // Update existing review
        const updated = storageService.updateReview(existingReview.id, {
          rating,
          comment: trimmedComment
        });
        if (updated) {
          setExistingReview(updated);
          setIsEditing(false);
          setSuccessMsg('Your review has been successfully updated!');
          onReviewSubmitted(updated);
        }
      } else {
        // Create new review
        const studentName = user.name || (user as any).fullName || user.email.split('@')[0];
        const newRev = storageService.addReview({
          userId: user.id,
          userName: studentName,
          userAvatar:
            user.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          courseId,
          courseTitle,
          rating,
          comment: trimmedComment,
          status: 'approved'
        });

        setExistingReview(newRev);
        setIsEditing(false);
        setSuccessMsg('Thank you! Your verified student review has been posted.');
        onReviewSubmitted(newRev);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMsg('Failed to save review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Review
  const handleDelete = () => {
    if (!existingReview) return;
    if (window.confirm('Are you sure you want to remove your review?')) {
      storageService.deleteReview(existingReview.id);
      if (onReviewDeleted) {
        onReviewDeleted(existingReview.id);
      }
      setExistingReview(null);
      setIsEditing(false);
      setRating(5);
      setComment('');
      setSuccessMsg('Your review was deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // 1. NON-ENROLLED STATE
  if (!isEnrolled) {
    return (
      <div
        style={{
          backgroundColor: '#FFF9FA',
          border: '1px dashed rgba(87, 51, 58, 0.22)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          boxShadow: '0 2px 8px rgba(87, 51, 58, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(87, 51, 58, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-plum)'
              }}
            >
              <Lock size={16} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                Leave a Student Review & Comment
              </h4>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Only verified enrolled students who have joined this masterclass can leave ratings and comments.
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={onEnrollClick}
              className="btn btn-primary btn-sm"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                backgroundColor: 'var(--color-berry)',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <GraduationCap size={14} />
              Enroll to Review (₹{coursePrice})
            </button>
          ) : (
            <a
              href={`/login?redirect=/courses/${courseId}`}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                color: 'var(--color-plum)',
                borderColor: 'var(--border-subtle)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Sign In to Review
            </a>
          )}
        </div>
      </div>
    );
  }

  // 2. ENROLLED USER ALREADY POSTED A REVIEW (VIEW MODE)
  if (existingReview && !isEditing) {
    const initialLetter = (existingReview.userName || user?.name || 'S').charAt(0).toUpperCase();

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF9FA 0%, #FFFFFF 100%)',
          border: '1.5px solid rgba(46, 125, 50, 0.25)',
          borderRadius: '16px',
          padding: '1.35rem 1.5rem',
          boxShadow: '0 4px 14px rgba(46, 125, 50, 0.06)'
        }}
      >
        {successMsg && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Header with Your Review badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-berry)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.92rem'
              }}
            >
              {initialLetter}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.94rem' }}>
                  {existingReview.userName}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '9999px'
                  }}
                >
                  <CheckCircle2 size={10} /> Your Verified Review
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                Posted on {new Date(existingReview.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--color-plum)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: 'none',
                border: '1px solid rgba(211, 47, 47, 0.25)',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#D32F2F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '0.65rem', color: '#C47C8B' }}>
          {[1, 2, 3, 4, 5].map(starNum => (
            <Star
              key={starNum}
              size={15}
              fill={starNum <= existingReview.rating ? '#C47C8B' : '#E0D0D4'}
              color={starNum <= existingReview.rating ? '#C47C8B' : '#E0D0D4'}
              strokeWidth={0}
            />
          ))}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 500 }}>
            {RATING_LABELS[existingReview.rating]}
          </span>
        </div>

        {/* Review text */}
        <p style={{ margin: 0, fontSize: '0.92rem', color: '#3A2027', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{existingReview.comment}"
        </p>
      </div>
    );
  }

  // 3. ENROLLED USER CREATING OR EDITING A REVIEW (FORM MODE)
  const activeRating = hoverRating || rating;
  const initialLetter = (user?.name || (user as any)?.fullName || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'linear-gradient(135deg, #FFF9FA 0%, #FFFFFF 100%)',
        border: '1.5px solid rgba(87, 51, 58, 0.16)',
        borderRadius: '16px',
        padding: '1.35rem 1.5rem',
        boxShadow: '0 4px 16px rgba(87, 51, 58, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.95rem'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-blush)',
              color: 'var(--color-berry)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}
          >
            {initialLetter}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.95rem' }}>
                {isEditing ? 'Edit Your Review' : 'Leave your comment & review'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#2E7D32',
                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '9999px'
                }}
              >
                <CheckCircle2 size={10} /> Verified Enrolled Student
              </span>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {user?.name || user?.email} • Sharing feedback for {courseTitle}
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Star Selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}>
          Your Rating
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[1, 2, 3, 4, 5].map(starNum => {
              const filled = starNum <= activeRating;
              return (
                <button
                  key={starNum}
                  type="button"
                  onMouseEnter={() => setHoverRating(starNum)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starNum)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: filled ? '#C47C8B' : '#E0D0D4',
                    transition: 'transform 0.15s ease'
                  }}
                  title={`${starNum} Stars`}
                >
                  <Star
                    size={22}
                    fill={filled ? '#C47C8B' : '#E0D0D4'}
                    color={filled ? '#C47C8B' : '#E0D0D4'}
                    strokeWidth={0}
                  />
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-berry)', fontWeight: 600, marginLeft: '0.5rem' }}>
            {RATING_LABELS[activeRating] || 'Click stars to rate'}
          </span>
        </div>
      </div>

      {/* Comment Textarea */}
      <div>
        <label
          htmlFor="review-comment-input"
          style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-plum)', marginBottom: '0.35rem' }}
        >
          Your Feedback & Experience
        </label>
        <textarea
          id="review-comment-input"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience with this masterclass... What techniques did you learn? How were Chef Camille's explanations?"
          style={{
            width: '100%',
            padding: '0.75rem 0.95rem',
            borderRadius: '10px',
            border: '1.5px solid rgba(87, 51, 58, 0.18)',
            backgroundColor: '#FFFFFF',
            fontSize: '0.9rem',
            color: 'var(--color-plum)',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-berry)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(87, 51, 58, 0.18)')}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
          <span>Minimum 5 characters required</span>
          <span>{comment.trim().length} characters</span>
        </div>
      </div>

      {/* Error / Success Feedback */}
      {errorMsg && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#FFEBEE',
            color: '#D32F2F',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Submit Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isSubmitting || comment.trim().length < 5 || rating === 0}
          style={{
            backgroundColor: isSubmitting || comment.trim().length < 5 || rating === 0 ? '#C4B5B8' : 'var(--color-berry)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.4rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            cursor: isSubmitting || comment.trim().length < 5 || rating === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 2px 8px rgba(139, 43, 67, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={14} />
          {isSubmitting ? 'Posting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};
