import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Loader, Search, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/api/mockClient';
import { DEMO_USERS_LIST, SECTION_TITLES, type DemoUser } from '@/api/demoUsers';
import ClassificationBanner from '@/components/ui/ClassificationBanner';
import { useClassificationStore } from '@/stores/classificationStore';
import DemoWalkthrough from '@/components/onboarding/DemoWalkthrough';

// ---------------------------------------------------------------------------
// Rank accent colors
// ---------------------------------------------------------------------------

function getRankColor(rank: string): string {
  // O-grade (officers): purple
  const officerRanks = ['2ndLt', '1stLt', 'Capt', 'Maj', 'LtCol', 'Col', 'BGen', 'MajGen', 'LtGen', 'Gen'];
  if (officerRanks.includes(rank)) return '#b197fc';
  // SNCO: orange/gold
  const sncoRanks = ['SSgt', 'GySgt', 'MSgt', '1stSgt', 'MGySgt', 'SgtMaj'];
  if (sncoRanks.includes(rank)) return '#ffa94d';
  // NCO: green
  return '#69db7c';
}

function getRankCategory(rank: string): string {
  const officerRanks = ['2ndLt', '1stLt', 'Capt', 'Maj', 'LtCol', 'Col', 'BGen', 'MajGen', 'LtGen', 'Gen'];
  if (officerRanks.includes(rank)) return 'OFFICER';
  const sncoRanks = ['SSgt', 'GySgt', 'MSgt', '1stSgt', 'MGySgt', 'SgtMaj'];
  if (sncoRanks.includes(rank)) return 'SNCO';
  return 'NCO';
}

// ---------------------------------------------------------------------------
// Section ordering
// ---------------------------------------------------------------------------

const SECTION_ORDER: DemoUser['section'][] = ['COMMAND', 'STAFF', 'COMPANY', 'OPERATORS', 'HIGHER_HQ'];

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const { isAuthenticated, login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchClassification = useClassificationStore((s) => s.fetchClassification);

  useEffect(() => {
    fetchClassification();
  }, [fetchClassification]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_USERS_LIST;
    const q = searchQuery.toLowerCase();
    return DEMO_USERS_LIST.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.rank.toLowerCase().includes(q) ||
        u.billet.toLowerCase().includes(q) ||
        u.unit.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Group filtered users by section
  const groupedUsers = useMemo(() => {
    const groups: Partial<Record<DemoUser['section'], DemoUser[]>> = {};
    for (const user of filteredUsers) {
      if (!groups[user.section]) groups[user.section] = [];
      groups[user.section]!.push(user);
    }
    return groups;
  }, [filteredUsers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
    } catch {
      // Error handled in store
    }
  };

  const handleDemoLogin = async (user: DemoUser) => {
    clearError();
    setLoggingInAs(user.username);
    try {
      await login(user.username, 'password');
    } catch {
      setLoggingInAs(null);
    }
  };

  // ── Non-demo or custom login mode: show standard form ──
  if (!isDemoMode || showCustomLogin) {
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

        <ClassificationBanner position="top" />

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
          </form>

          {/* Back to role picker link (only in demo mode) */}
          {isDemoMode && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={() => setShowCustomLogin(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Back to role picker
              </button>
            </div>
          )}

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

        <ClassificationBanner position="bottom" />
      </div>
    );
  }

  // ── Demo mode: Role Picker ──
  return (
    <div
      className="crt-scanlines"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'var(--color-bg)',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {/* Radial gradient light sources */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(77, 171, 247, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '15%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(64, 192, 87, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <ClassificationBanner position="top" />

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          width: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 36,
          paddingBottom: 36,
          position: 'relative',
          zIndex: 12,
        }}
      >
        {/* Header */}
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Shield
            size={40}
            style={{ color: 'var(--color-accent)', marginBottom: 10 }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '6px',
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
              letterSpacing: '3px',
              color: 'var(--color-text-muted)',
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            LOGISTICS COMMON OPERATING PICTURE
          </p>
          <div
            style={{
              marginTop: 10,
              padding: '4px 14px',
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
            DEMO MODE — SELECT YOUR ROLE
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              maxWidth: 600,
              width: '100%',
              padding: '8px 14px',
              marginBottom: 12,
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-danger)',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Search bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 900,
            padding: '0 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 12,
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, rank, billet, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>

        {/* User cards grouped by section */}
        <div
          style={{
            width: '100%',
            maxWidth: 900,
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {SECTION_ORDER.map((section) => {
            const users = groupedUsers[section];
            if (!users || users.length === 0) return null;
            return (
              <div key={section}>
                {/* Section header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '2.5px',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {SECTION_TITLES[section] ?? section}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: 'var(--color-border)',
                    }}
                  />
                </div>

                {/* Cards grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 10,
                  }}
                >
                  {users.map((user) => {
                    const rankColor = getRankColor(user.rank);
                    const isHovered = hoveredCard === user.username;
                    const isThisLogging = loggingInAs === user.username;

                    return (
                      <div
                        key={user.username}
                        onMouseEnter={() => setHoveredCard(user.username)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: isHovered
                            ? 'rgba(255,255,255,0.04)'
                            : 'var(--color-bg-elevated)',
                          border: `1px solid ${isHovered ? rankColor + '60' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                          boxShadow: isHovered
                            ? `0 0 20px ${rankColor}15, 0 4px 12px rgba(0,0,0,0.3)`
                            : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onClick={() => handleDemoLogin(user)}
                      >
                        {/* Top accent bar */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: rankColor,
                            opacity: isHovered ? 1 : 0.3,
                            transition: 'opacity var(--transition)',
                          }}
                        />

                        {/* Rank badge + name row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Rank badge */}
                          <div
                            style={{
                              flexShrink: 0,
                              width: 36,
                              height: 36,
                              borderRadius: 'var(--radius)',
                              backgroundColor: `${rankColor}18`,
                              border: `1px solid ${rankColor}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              color: rankColor,
                              letterSpacing: '0.5px',
                            }}
                          >
                            {user.rank}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--color-text-bright)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {user.full_name}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: rankColor,
                                fontWeight: 600,
                              }}
                            >
                              {user.billet}
                            </div>
                          </div>
                        </div>

                        {/* Unit + MOS */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              color: 'var(--color-text-muted)',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {user.unit}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              color: 'var(--color-text-muted)',
                              padding: '1px 5px',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: 2,
                              letterSpacing: '0.5px',
                            }}
                          >
                            MOS {user.mos}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              color: rankColor,
                              opacity: 0.7,
                              letterSpacing: '0.5px',
                            }}
                          >
                            {getRankCategory(user.rank)}
                          </span>
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--color-text-muted)',
                            lineHeight: 1.4,
                          }}
                        >
                          {user.description}
                        </div>

                        {/* Login button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoLogin(user);
                          }}
                          disabled={isThisLogging}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '7px 12px',
                            backgroundColor: isHovered ? rankColor : 'transparent',
                            border: `1px solid ${rankColor}60`,
                            borderRadius: 'var(--radius)',
                            color: isHovered ? '#000' : rankColor,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            cursor: isThisLogging ? 'wait' : 'pointer',
                            transition: 'all var(--transition)',
                            opacity: isThisLogging ? 0.7 : 1,
                          }}
                        >
                          {isThisLogging ? (
                            <>
                              <Loader size={10} className="animate-spin" />
                              LOGGING IN...
                            </>
                          ) : (
                            <>
                              <LogIn size={10} />
                              LOG IN AS {user.rank}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              No users match your search.
            </div>
          )}
        </div>

        {/* Custom login link */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => setShowCustomLogin(true)}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Use custom login
          </button>
        </div>

        {/* Demo Walkthrough (demo mode only) */}
        {isDemoMode && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <DemoWalkthrough />
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 16,
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

      <ClassificationBanner position="bottom" />
    </div>
  );
}
