import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Review } from '../../types';
import { MessageSquare, Star, Check, EyeOff, Trash2, ShieldCheck } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(() => storageService.getReviews());

  const handleStatusChange = (id: string, status: 'approved' | 'hidden') => {
    storageService.updateReviewStatus(id, status);
    setReviews(storageService.getReviews());
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this review permanently?')) {
      storageService.deleteReview(id);
      setReviews(storageService.getReviews());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Reviews & Testimonial Moderation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Approve or hide student cake feedback displayed on public pages
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {reviews.map((rev) => (
          <div
            key={rev.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={rev.userAvatar} alt={rev.userName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.95rem' }}>{rev.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-berry)' }}>{rev.courseTitle}</div>
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    backgroundColor: rev.status === 'approved' ? '#E8F5E9' : '#FFF3E0',
                    color: rev.status === 'approved' ? '#2E7D32' : '#E65100',
                    textTransform: 'capitalize',
                    fontSize: '0.72rem'
                  }}
                >
                  {rev.status}
                </span>
              </div>

              {/* Stars */}
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.8rem', color: '#FFB800' }}>
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={14} fill="#FFB800" color="#FFB800" />
                ))}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.2rem' }}>
                "{rev.comment}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
              {rev.status === 'approved' ? (
                <button
                  onClick={() => handleStatusChange(rev.id, 'hidden')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <EyeOff size={13} /> Hide
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(rev.id, 'approved')}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Check size={13} /> Approve
                </button>
              )}
              <button
                onClick={() => handleDelete(rev.id)}
                style={{ background: 'none', border: '1px solid #FFCDD2', color: '#D32F2F', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
