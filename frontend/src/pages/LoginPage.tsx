import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/api/mockClient';

export default function LoginPage() {
  const { isAuthenticated, login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
    } catch {
      // Error handled in store
    }
  };

  return (
    <div
      className="crt-scanlines"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Radial gradient light sources */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(77, 171, 247, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(64, 192, 87, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Classification Banner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 24,
          backgroundColor: 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: '#000',
            letterSpacing: '3px',
          }}
        >
          UNCLASSIFIED
        </span>
      </div>

      {/* Login Form */}
      <div
        className="animate-fade-in"
        style={{
          width: 380,
          padding: '40px 32px',
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          position: 'relative',
          zIndex: 12,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Shield
            size={36}
            style={{ color: 'var(--color-accent)', marginBottom: 12 }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '4px',
              color: 'var(--color-text-bright)',
              margin: 0,
            }}
          >
            KEYSTONE
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '2px',
              color: 'var(--color-text-muted)',
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            LOGISTICS COMMON OPERATING PICTURE
          </p>
          {isDemoMode && (
            <div
              style={{
                marginTop: 10,
                padding: '4px 12px',
                backgroundColor: 'rgba(77, 171, 247, 0.12)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '2px',
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
              }}
            >
              DEMO MODE
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--color-text)',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid var(--color-danger)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-danger)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || (!isDemoMode && !password)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor:
                isLoading || !username || (!isDemoMode && !password)
                  ? 'var(--color-muted)'
                  : 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: isLoading || !username || (!isDemoMode && !password) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              transition: 'background-color var(--transition)',
            }}
          >
            {isLoading ? (
              <>
                <Loader size={14} className="animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              'LOGIN'
            )}
          </button>

          {isDemoMode && (
            <div
              style={{
                marginTop: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                letterSpacing: '0.5px',
                lineHeight: 1.6,
              }}
            >
              Try: <span style={{ color: 'var(--color-accent)' }}>admin</span>,{' '}
              <span style={{ color: 'var(--color-accent)' }}>commander</span>,{' '}
              <span style={{ color: 'var(--color-accent)' }}>s4officer</span>,{' '}
              or any username. Password optional.
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.5px',
          }}
        >
          USMC LOGISTICS INTELLIGENCE SYSTEM v0.1.0
        </div>
      </div>

      {/* Bottom Classification Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 24,
          backgroundColor: 'var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: '#000',
            letterSpacing: '3px',
          }}
        >
          UNCLASSIFIED
        </span>
      </div>
    </div>
  );
}
