import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-mono)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            fontSize: '28px',
            color: 'var(--color-danger)',
          }}
        >
          !
        </div>

        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-bright)',
            marginBottom: '0.5rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            maxWidth: 480,
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. You can try reloading the page or
          navigating back to the dashboard.
        </p>

        {/* Error details (collapsed) */}
        {this.state.error && (
          <pre
            style={{
              fontSize: '10px',
              color: 'var(--color-danger)',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              maxWidth: 500,
              overflow: 'auto',
              marginBottom: '1.5rem',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error.message}
          </pre>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '8px 20px',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(77, 171, 247, 0.15)',
              color: 'var(--color-accent)',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          <a
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '8px 20px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
}
