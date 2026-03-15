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

  // NOTE: All hooks must be called before any conditional return (React rules of hooks).
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

  // Redirect after all hooks have been called
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
        className="crt-scanlines fixed flex items-center justify-center bg-[var(--color-bg)] overflow-hidden z-[1] inset-0"
      >
        {/* Radial gradient light sources */}
        <div
          className="absolute w-[600px] h-[600px]" style={{ top: '20%', left: '30%', background: 'radial-gradient(circle, rgba(77, 171, 247, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }}
        />
        <div
          className="absolute w-[500px] h-[500px]" style={{ bottom: '10%', right: '20%', background: 'radial-gradient(circle, rgba(64, 192, 87, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }}
        />

        <ClassificationBanner position="top" />

        <div
          className="animate-fade-in w-[380px] py-10 px-8 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] relative z-[12]"
          
        >
          {/* Logo */}
          <div
            className="flex flex-col items-center mb-8"
          >
            <Shield
              size={36}
              className="text-[var(--color-accent)] mb-3"
            />
            <h1
              className="font-[var(--font-mono)] text-2xl font-bold tracking-[4px] text-[var(--color-text-bright)] m-0"
            >
              KEYSTONE
            </h1>
            <p
              className="font-[var(--font-mono)] text-[9px] tracking-[2px] text-[var(--color-text-muted)] mt-1.5 uppercase"
            >
              LOGISTICS COMMON OPERATING PICTURE
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label
                className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
              >
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full py-2.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[13px] text-[var(--color-text)]"
              />
            </div>

            <div>
              <label
                className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
              >
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full py-2.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[13px] text-[var(--color-text)]"
              />
            </div>

            {error && (
              <div
                className="py-2 px-3 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || (!isDemoMode && !password)}
              className="w-full border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-xs font-bold tracking-[2px] uppercase flex items-center justify-center gap-2 mt-1" style={{ padding: '12px', backgroundColor: isLoading || !username || (!isDemoMode && !password)
                    ? 'var(--color-muted)'
                    : 'var(--color-accent)', cursor: isLoading || !username || (!isDemoMode && !password) ? 'not-allowed' : 'pointer', transition: 'background-color var(--transition)' }}
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
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowCustomLogin(false)}
                className="bg-transparent border-0 font-[var(--font-mono)] text-[10px] text-[var(--color-accent)] cursor-pointer tracking-[0.5px] underline underline-offset-[3px]"
              >
                Back to role picker
              </button>
            </div>
          )}

          <div
            className="mt-6 text-center font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
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
      className="crt-scanlines fixed flex flex-col items-center bg-[var(--color-bg)] overflow-hidden z-[1] inset-0"
    >
      {/* Radial gradient light sources */}
      <div
        className="absolute w-[700px] h-[700px]" style={{ top: '10%', left: '20%', background: 'radial-gradient(circle, rgba(77, 171, 247, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}
      />
      <div
        className="absolute w-[600px] h-[600px]" style={{ bottom: '5%', right: '15%', background: 'radial-gradient(circle, rgba(64, 192, 87, 0.03) 0%, transparent 70%)', pointerEvents: 'none' }}
      />

      <ClassificationBanner position="top" />

      {/* Scrollable content */}
      <div
        className="flex-1 w-full overflow-y-auto flex flex-col items-center pt-9 pb-9 relative z-[12]"
      >
        {/* Header */}
        <div
          className="animate-fade-in flex flex-col items-center mb-6"
          
        >
          <Shield
            size={40}
            className="text-[var(--color-accent)] mb-2.5"
          />
          <h1
            className="font-[var(--font-mono)] text-[28px] font-bold tracking-[6px] text-[var(--color-text-bright)] m-0"
          >
            KEYSTONE
          </h1>
          <p
            className="font-[var(--font-mono)] text-[9px] tracking-[3px] text-[var(--color-text-muted)] mt-1.5 uppercase"
          >
            LOGISTICS COMMON OPERATING PICTURE
          </p>
          <div
            className="mt-2.5 py-1 px-3.5 bg-[rgba(77,171,247,0.12)] border border-[var(--color-accent)] rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-semibold tracking-[2px] text-[var(--color-accent)] uppercase"
          >
            DEMO MODE — SELECT YOUR ROLE
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="max-w-[600px] w-full py-2 px-3.5 mb-3 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] text-center"
          >
            {error}
          </div>
        )}

        {/* Search bar */}
        <div
          className="w-full max-w-[900px] py-0 px-6 mb-5"
        >
          <div
            className="relative flex items-center"
          >
            <Search
              size={14}
              className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, rank, billet, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-xs text-[var(--color-text)]" style={{ padding: '10px 12px 10px 34px' }}
            />
          </div>
        </div>

        {/* User cards grouped by section */}
        <div
          className="w-full max-w-[900px] py-0 px-6 flex flex-col gap-6"
        >
          {SECTION_ORDER.map((section) => {
            const users = groupedUsers[section];
            if (!users || users.length === 0) return null;
            return (
              <div key={section}>
                {/* Section header */}
                <div
                  className="flex items-center gap-2.5 mb-2.5"
                >
                  <span
                    className="font-[var(--font-mono)] text-[9px] font-bold tracking-[2.5px] text-[var(--color-text-muted)] uppercase"
                  >
                    {SECTION_TITLES[section] ?? section}
                  </span>
                  <div
                    className="flex-1 h-[1px] bg-[var(--color-border)]"
                  />
                </div>

                {/* Cards grid */}
                <div
                  className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
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
                        className="py-3.5 px-4 rounded-[var(--radius)] cursor-pointer flex flex-col gap-2 relative overflow-hidden" style={{ backgroundColor: isHovered
                            ? 'rgba(255,255,255,0.04)'
                            : 'var(--color-bg-elevated)', border: `1px solid ${isHovered ? rankColor + '60' : 'var(--color-border)'}`, transition: 'all var(--transition)', boxShadow: isHovered
                            ? `0 0 20px ${rankColor}15, 0 4px 12px rgba(0,0,0,0.3)`
                            : 'none' }}
                        onClick={() => handleDemoLogin(user)}
                      >
                        {/* Top accent bar */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: rankColor, opacity: isHovered ? 1 : 0.3, transition: 'opacity var(--transition)' }}
                        />

                        {/* Rank badge + name row */}
                        <div className="flex items-center gap-2.5">
                          {/* Rank badge */}
                          <div
                            className="shrink-0 w-[36px] h-[36px] rounded-[var(--radius)] flex items-center justify-center font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px]" style={{ backgroundColor: `${rankColor}18`, border: `1px solid ${rankColor}40`, color: rankColor }}
                          >
                            {user.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)] whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                              {user.full_name}
                            </div>
                            <div
                              className="font-[var(--font-mono)] text-[10px] font-semibold" style={{ color: rankColor }}
                            >
                              {user.billet}
                            </div>
                          </div>
                        </div>

                        {/* Unit + MOS */}
                        <div
                          className="flex items-center gap-2"
                        >
                          <span
                            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
                          >
                            {user.unit}
                          </span>
                          <span
                            className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] py-px px-1.5 bg-[rgba(255,255,255,0.05)] rounded-[2px] tracking-[0.5px]"
                          >
                            MOS {user.mos}
                          </span>
                          <span
                            className="font-[var(--font-mono)] text-[8px] opacity-70 tracking-[0.5px]" style={{ color: rankColor }}
                          >
                            {getRankCategory(user.rank)}
                          </span>
                        </div>

                        {/* Description */}
                        <div
                          className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-[1.4]"
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
                          className="flex items-center justify-center gap-1.5 py-[7px] px-3 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-bold tracking-[1.5px]" style={{ backgroundColor: isHovered ? rankColor : 'transparent', border: `1px solid ${rankColor}60`, color: isHovered ? '#000' : rankColor, cursor: isThisLogging ? 'wait' : 'pointer', transition: 'all var(--transition)', opacity: isThisLogging ? 0.7 : 1 }}
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
              className="p-8 text-center font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]"
            >
              No users match your search.
            </div>
          )}
        </div>

        {/* Custom login link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowCustomLogin(true)}
            className="bg-transparent border-0 font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] cursor-pointer tracking-[0.5px] underline underline-offset-[3px]"
          >
            Use custom login
          </button>
        </div>

        {/* Demo Walkthrough (demo mode only) */}
        {isDemoMode && (
          <div className="mt-6 text-center">
            <DemoWalkthrough />
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-4 text-center font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px]"
        >
          USMC LOGISTICS INTELLIGENCE SYSTEM v0.1.0
        </div>
      </div>

      <ClassificationBanner position="bottom" />
    </div>
  );
}
