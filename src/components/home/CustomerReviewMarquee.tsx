import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Review } from '../../types';
import { Star, Check } from 'lucide-react';

interface CustomerReviewMarqueeProps {
  speedSeconds?: number;
}

export const CustomerReviewMarquee: React.FC<CustomerReviewMarqueeProps> = ({
  speedSeconds = 150
}) => {
  const [reviews, setReviews] = useState<Review[]>(() => {
    const approved = storageService.getApprovedReviews();
    return approved.length > 0 ? approved : [];
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Sync with storageService and check for any dynamic updates
    const approved = storageService.getApprovedReviews();
    if (approved.length > 0) {
      setReviews(approved);
    }
  }, []);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Duplicate items 4 times to guarantee a mathematically seamless -50% translation loop
  const marqueeItems = [...reviews, ...reviews, ...reviews, ...reviews];

  return (
    <section
      className="customer-reviews-marquee-section"
      aria-label="Student Reviews and Ratings"
      style={{
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
        padding: '0 1rem',
        margin: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1
      }}
    >
      {/* Full-width Marquee Track Frame */}
      <div
        className="fullwidth-review-glass-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          width: '100%',
          minHeight: '154px',
          margin: 0,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          borderRadius: '22px',
          boxShadow: '0 8px 32px 0 rgba(87, 51, 58, 0.03)',
          padding: '0.85rem 0',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab'
        }}
      >
        {/* Continuous right-to-left scrolling marquee track */}
        <div
          className="fullwidth-review-marquee-track"
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 'max-content',
            margin: 0,
            padding: '0 0.5rem',
            animation: `marqueeLoop ${speedSeconds}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            willChange: 'transform'
          }}
        >
          {marqueeItems.map((review, idx) => {
            const isVerified = Boolean(review.userId || review.status === 'approved');

            return (
              <div
                key={`${review.id}-${idx}`}
                className="fullwidth-review-card"
                style={{
                  flex: '0 0 auto',
                  width: '360px',
                  height: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.15rem 1.4rem',
                  marginRight: '1.1rem',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 245, 248, 0.38) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 8px 28px rgba(87, 51, 58, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
                  boxSizing: 'border-box',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}
              >
                {/* ROW 1: Five-star rating & numerical rating (5.0) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    lineHeight: 1
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      color: '#C47C8B'
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill="#C47C8B"
                        color="#C47C8B"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      marginLeft: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--color-plum)',
                      lineHeight: 1
                    }}
                  >
                    {Number(review.rating || 5).toFixed(1)}
                  </span>
                </div>

                {/* ROW 2: Customer review text - 2 lines max with clean truncation */}
                <p
                  style={{
                    fontSize: '0.81rem',
                    lineHeight: 1.48,
                    color: '#382026',
                    fontWeight: 500,
                    margin: 0,
                    padding: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={review.comment}
                >
                  "{review.comment}"
                </p>

                {/* ROW 3: Customer name & verified purchase indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.55rem',
                    fontSize: '0.78rem',
                    margin: 0,
                    padding: 0,
                    lineHeight: 1,
                    marginTop: '0.05rem'
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-plum)'
                    }}
                  >
                    {review.userName}
                  </span>

                  {isVerified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.22rem',
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        color: '#2E7D32',
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '9999px',
                        lineHeight: 1.2,
                        letterSpacing: '0.01em'
                      }}
                    >
                      <Check size={9} strokeWidth={2.5} />
                      Verified Student
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes marqueeLoop {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .fullwidth-review-glass-container:hover .fullwidth-review-marquee-track,
        .fullwidth-review-glass-container:active .fullwidth-review-marquee-track {
          animation-play-state: paused !important;
        }

        .fullwidth-review-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(87, 51, 58, 0.1), inset 0 1px 1px rgba(255, 255, 255, 1) !important;
        }

        @media (max-width: 1024px) {
          .fullwidth-review-card {
            width: 320px !important;
            padding: 1.05rem 1.25rem !important;
          }
        }

        @media (max-width: 768px) {
          .customer-reviews-marquee-section {
            padding: 0 0.5rem !important;
            margin: 0 !important;
          }
          .fullwidth-review-glass-container {
            border-radius: 16px !important;
            min-height: 144px !important;
            padding: 0.75rem 0 !important;
            margin: 0 !important;
          }
          .fullwidth-review-card {
            width: 285px !important;
            height: 122px !important;
            border-radius: 16px !important;
            padding: 0.95rem 1.15rem !important;
            margin-right: 0.85rem !important;
          }
        }
      `}</style>
    </section>
  );
};
