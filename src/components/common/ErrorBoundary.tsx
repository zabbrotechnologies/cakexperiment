import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-cream)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FFEBEE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C62828',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-plum)', marginBottom: '0.6rem' }}>
            {this.props.fallbackTitle || 'Unable to Load Masterclass'}
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '2rem', fontSize: '0.96rem', lineHeight: 1.6 }}>
            Something went wrong while preparing this masterclass view. You can refresh the page or return to the courses catalog.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
            <Link to="/courses" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <Home size={16} />
              <span>Browse All Courses</span>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
