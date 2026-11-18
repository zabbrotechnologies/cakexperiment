import React, { useState } from 'react';

interface GoogleButtonProps {
  redirectTarget?: string;
  onError?: (msg: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  redirectTarget,
  onError,
  className,
  style
}) => {
  const [connecting, setConnecting] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (connecting) return;

    setConnecting(true);
    try {
      const redirectQuery = redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : '';
      window.location.href = `/api/auth/google${redirectQuery}`;
    } catch (err: any) {
      setConnecting(false);
      onError?.(err?.message || 'Failed initiating Google sign-in. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      aria-label="Continue with Google"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        width: '100%',
        padding: '0.85rem 1.25rem',
        backgroundColor: '#FFFFFF',
        color: 'var(--color-plum, #3A2329)',
        border: '1.5px solid var(--border-subtle, #E8DDD9)',
        borderRadius: 'var(--radius-md, 8px)',
        fontSize: '0.96rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: connecting ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 3px rgba(58, 35, 41, 0.06)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: connecting ? 0.8 : 1,
        outline: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!connecting) {
          e.currentTarget.style.borderColor = 'var(--color-berry, #8B3A4A)';
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 58, 74, 0.12)';
          e.currentTarget.style.backgroundColor = '#FCFAF9';
        }
      }}
      onMouseLeave={(e) => {
        if (!connecting) {
          e.currentTarget.style.borderColor = 'var(--border-subtle, #E8DDD9)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(58, 35, 41, 0.06)';
          e.currentTarget.style.backgroundColor = '#FFFFFF';
        }
      }}
    >
      {connecting ? (
        <span
          style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            border: '2px solid rgba(139, 58, 74, 0.25)',
            borderTopColor: 'var(--color-berry, #8B3A4A)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          style={{ flexShrink: 0, display: 'block' }}
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
          />
        </svg>
      )}
      <span>{connecting ? 'Connecting to Google...' : 'Continue with Google'}</span>
    </button>
  );
};
