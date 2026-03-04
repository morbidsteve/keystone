import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Users as UsersIcon,
  MapPin,
  Activity,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import {
  getScenarios,
  getScenarioDetail,
  getSimulatorStatus,
  startSimulation,
  stopSimulation,
  pauseSimulation,
  resumeSimulation,
  setSimulationSpeed,
} from '@/api/simulator';
import type {
  ScenarioSummary,
  ScenarioDetail,
  SimulatorStatus,
} from '@/api/simulator';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const monoFont: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
};

const controlBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.5px',
  cursor: 'pointer',
};

const speedBtnStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '3px 8px',
  border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius)',
  backgroundColor: isActive ? 'rgba(77, 171, 247, 0.15)' : 'transparent',
  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: isActive ? 700 : 400,
  cursor: 'pointer',
});

const categoryHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  padding: '12px 0 6px 0',
  borderBottom: '1px solid var(--color-border)',
  marginBottom: 8,
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  backgroundColor: 'var(--color-bg-elevated)',
  padding: 12,
  cursor: 'pointer',
  transition: 'border-color var(--transition), background-color var(--transition)',
};

const cardHoverStyle: React.CSSProperties = {
  ...cardStyle,
  borderColor: 'var(--color-accent)',
  backgroundColor: 'rgba(77, 171, 247, 0.04)',
};

const badgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  padding: '1px 6px',
  borderRadius: 2,
  fontSize: 9,
  fontWeight: 600,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.5px',
  border: `1px solid ${color}`,
  color,
});

const tempoColor = (tempo: string): string => {
  switch (tempo) {
    case 'LOW':
      return '#40c057';
    case 'MEDIUM':
      return '#fab005';
    case 'HIGH':
      return '#ff6b6b';
    default:
      return 'var(--color-text-muted)';
  }
};

const statusDotStyle = (status: string): React.CSSProperties => {
  let color: string;
  switch (status) {
    case 'running':
      color = '#40c057';
      break;
    case 'paused':
      color = '#fab005';
      break;
    case 'stopped':
      color = '#ff6b6b';
      break;
    default:
      color = '#666';
  }
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: status === 'running' ? `0 0 6px ${color}` : 'none',
    animation: status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none',
    flexShrink: 0,
  };
};

const SPEED_OPTIONS = [
  { label: '1x', value: 1 },
  { label: '10x', value: 10 },
  { label: '60x', value: 60 },
  { label: '360x', value: 360 },
  { label: '3600x', value: 3600 },
];

const CATEGORY_ORDER = [
  'Pre-Deployment Training (CONUS)',
  'Indo-Pacific',
  'Europe / Africa / Middle East',
  'Americas / Maritime',
  'Crisis Response',
  'Reserve Component',
  'Deployment / Garrison',
];

// ---------------------------------------------------------------------------
// Confirm Dialog sub-component
// ---------------------------------------------------------------------------

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: 380,
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          padding: 20,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text)',
            margin: '0 0 16px 0',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              ...controlBtnStyle,
              padding: '5px 16px',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...controlBtnStyle,
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger)',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              padding: '5px 16px',
            }}
          >
            STOP SIMULATION
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScenarioCard sub-component
// ---------------------------------------------------------------------------

function ScenarioCard({
  scenario,
  isExpanded,
  detail,
  isLoadingDetail,
  onToggle,
  onStart,
  isSimRunning,
}: {
  scenario: ScenarioSummary;
  isExpanded: boolean;
  detail: ScenarioDetail | null;
  isLoadingDetail: boolean;
  onToggle: () => void;
  onStart: (name: string) => void;
  isSimRunning: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={hovered || isExpanded ? cardHoverStyle : cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            flexShrink: 0,
            marginTop: 2,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...monoFont,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              marginBottom: 4,
            }}
          >
            {scenario.display_name}
          </div>
          <div
            style={{
              ...monoFont,
              fontSize: 10,
              color: 'var(--color-text-muted)',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {scenario.description}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={badgeStyle('var(--color-accent)')}>
              <Clock size={8} />
              {scenario.duration_days} DAYS
            </span>
            <span style={badgeStyle('var(--color-text-muted)')}>
              <Zap size={8} />
              {scenario.phase_count} PHASES
            </span>
            <span style={badgeStyle('var(--color-text-muted)')}>
              <UsersIcon size={8} />
              {scenario.unit_count} UNITS
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart(scenario.name);
          }}
          disabled={isSimRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            border: `1px solid ${isSimRunning ? 'var(--color-border)' : '#40c057'}`,
            borderRadius: 'var(--radius)',
            backgroundColor: isSimRunning ? 'transparent' : 'rgba(64, 192, 87, 0.1)',
            color: isSimRunning ? 'var(--color-text-muted)' : '#40c057',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.5px',
            cursor: isSimRunning ? 'not-allowed' : 'pointer',
            opacity: isSimRunning ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          <Play size={9} />
          START
        </button>
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {isLoadingDetail ? (
            <div
              style={{
                ...monoFont,
                fontSize: 10,
                color: 'var(--color-text-muted)',
                padding: 8,
              }}
            >
              Loading details...
            </div>
          ) : detail ? (
            <>
              {/* Phase Timeline */}
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    ...monoFont,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 8,
                  }}
                >
                  PHASE TIMELINE
                </div>
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: 28,
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {detail.phases.map((phase, i) => {
                    const totalH = detail.phases.reduce(
                      (acc, p) => acc + p.duration_h,
                      0,
                    );
                    const widthPct =
                      totalH > 0 ? (phase.duration_h / totalH) * 100 : 0;
                    const tc = tempoColor(phase.tempo);
                    return (
                      <div
                        key={i}
                        title={`${phase.name}\n${phase.duration_h}h - ${phase.tempo} tempo\n${phase.description}`}
                        style={{
                          width: `${widthPct}%`,
                          minWidth: widthPct > 3 ? undefined : 4,
                          backgroundColor: `${tc}22`,
                          borderRight:
                            i < detail.phases.length - 1
                              ? '1px solid var(--color-border)'
                              : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: tc,
                          }}
                        />
                        {widthPct > 12 && (
                          <span
                            style={{
                              ...monoFont,
                              fontSize: 8,
                              color: 'var(--color-text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              padding: '0 4px',
                            }}
                          >
                            {phase.name.replace(/^Phase \w+ -- /, '')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Phase legend */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  {detail.phases.map((phase, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        ...monoFont,
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 1,
                          backgroundColor: tempoColor(phase.tempo),
                        }}
                      />
                      <span>{phase.name}</span>
                      <span style={{ opacity: 0.6 }}>
                        ({phase.duration_h}h)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Units List */}
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    ...monoFont,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: 'var(--color-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  UNITS ({detail.units.length})
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {detail.units.map((unit, i) => (
                    <span
                      key={i}
                      style={{
                        ...monoFont,
                        fontSize: 9,
                        padding: '2px 6px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 2,
                        color: 'var(--color-text)',
                        backgroundColor: 'var(--color-bg)',
                      }}
                      title={`${unit.name} (${unit.type}) - ${unit.callsign}`}
                    >
                      {unit.callsign}
                      <span
                        style={{
                          color: 'var(--color-text-muted)',
                          marginLeft: 4,
                          fontSize: 8,
                        }}
                      >
                        {unit.type}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* AO Info */}
              {detail.area_of_operation && (
                <div>
                  <div
                    style={{
                      ...monoFont,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      color: 'var(--color-text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    AREA OF OPERATIONS
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      ...monoFont,
                      fontSize: 10,
                      color: 'var(--color-text)',
                    }}
                  >
                    <MapPin size={10} style={{ color: 'var(--color-accent)' }} />
                    {detail.area_of_operation.name}
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 9 }}>
                      ({detail.area_of_operation.center[0].toFixed(2)},{' '}
                      {detail.area_of_operation.center[1].toFixed(2)}) r=
                      {detail.area_of_operation.radius_km}km
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScenarioManager (main component)
// ---------------------------------------------------------------------------

export default function ScenarioManager() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [status, setStatus] = useState<SimulatorStatus>({ status: 'idle' });
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [scenarioDetails, setScenarioDetails] = useState<
    Record<string, ScenarioDetail>
  >({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getScenarios();
        if (!cancelled) {
          setScenarios(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load scenarios');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll status every 2 seconds when running
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await getSimulatorStatus();
        if (!cancelled) setStatus(s);
      } catch {
        // ignore polling errors
      }
    };

    poll(); // initial fetch
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Toggle expanded scenario and load detail
  const handleToggle = useCallback(
    async (name: string) => {
      if (expandedScenario === name) {
        setExpandedScenario(null);
        return;
      }
      setExpandedScenario(name);

      if (!scenarioDetails[name]) {
        setLoadingDetail(name);
        try {
          const detail = await getScenarioDetail(name);
          setScenarioDetails((prev) => ({ ...prev, [name]: detail }));
        } catch {
          // ignore detail load errors
        } finally {
          setLoadingDetail(null);
        }
      }
    },
    [expandedScenario, scenarioDetails],
  );

  const handleStart = useCallback(
    async (scenarioName: string, speed = 60) => {
      setActionLoading(true);
      try {
        await startSimulation(scenarioName, speed);
        setStatus({
          status: 'running',
          scenario_name: scenarioName,
          speed,
          started_at: new Date().toISOString(),
          events_processed: 0,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to start simulation';
        setError(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [],
  );

  const handleStop = useCallback(async () => {
    setConfirmStop(false);
    setActionLoading(true);
    try {
      await stopSimulation();
      setStatus({ status: 'stopped' });
    } catch {
      setError('Failed to stop simulation');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handlePauseResume = useCallback(async () => {
    setActionLoading(true);
    try {
      if (status.status === 'paused') {
        await resumeSimulation();
        setStatus((prev) => ({ ...prev, status: 'running' }));
      } else {
        await pauseSimulation();
        setStatus((prev) => ({ ...prev, status: 'paused' }));
      }
    } catch {
      setError('Failed to pause/resume');
    } finally {
      setActionLoading(false);
    }
  }, [status.status]);

  const handleSpeedChange = useCallback(async (speed: number) => {
    try {
      await setSimulationSpeed(speed);
      setStatus((prev) => ({ ...prev, speed }));
    } catch {
      // ignore
    }
  }, []);

  // Group scenarios by category
  const grouped: Record<string, ScenarioSummary[]> = {};
  for (const s of scenarios) {
    const cat = s.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
  // Add any categories not in the predefined order
  for (const cat of Object.keys(grouped)) {
    if (!sortedCategories.includes(cat)) sortedCategories.push(cat);
  }

  const isSimActive = status.status === 'running' || status.status === 'paused';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Inject keyframe animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Error banner */}
      {error && (
        <div
          style={{
            ...monoFont,
            fontSize: 11,
            color: 'var(--color-danger)',
            padding: '8px 12px',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'rgba(255, 107, 107, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Section 1: Simulation Control Bar */}
      <Card title="SIMULATION CONTROL">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div style={statusDotStyle(status.status)} />
            <span
              style={{
                ...monoFont,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-bright)',
                letterSpacing: '0.5px',
              }}
            >
              {status.status.toUpperCase()}
            </span>
          </div>

          {/* Current scenario name */}
          {status.scenario_name && (
            <div
              style={{
                ...monoFont,
                fontSize: 10,
                color: 'var(--color-text)',
                padding: '2px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            >
              {status.scenario_name.replace(/_/g, ' ').toUpperCase()}
            </div>
          )}

          {/* Speed display + controls */}
          {isSimActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  ...monoFont,
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginRight: 4,
                }}
              >
                SPEED:
              </span>
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSpeedChange(opt.value)}
                  style={speedBtnStyle(status.speed === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Events processed */}
          {isSimActive && status.events_processed != null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                ...monoFont,
                fontSize: 10,
                color: 'var(--color-text-muted)',
              }}
            >
              <Activity size={10} />
              {status.events_processed.toLocaleString()} events
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {isSimActive && (
              <button
                onClick={handlePauseResume}
                disabled={actionLoading}
                style={{
                  ...controlBtnStyle,
                  borderColor: status.status === 'paused' ? '#40c057' : '#fab005',
                  color: status.status === 'paused' ? '#40c057' : '#fab005',
                }}
              >
                {status.status === 'paused' ? (
                  <>
                    <RotateCcw size={10} /> RESUME
                  </>
                ) : (
                  <>
                    <Pause size={10} /> PAUSE
                  </>
                )}
              </button>
            )}

            {isSimActive && (
              <button
                onClick={() => setConfirmStop(true)}
                disabled={actionLoading}
                style={{
                  ...controlBtnStyle,
                  borderColor: 'var(--color-danger)',
                  color: 'var(--color-danger)',
                }}
              >
                <Square size={10} /> STOP
              </button>
            )}
          </div>
        </div>

        {/* Started at / sim time row */}
        {status.started_at && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: '0 12px 12px 12px',
              ...monoFont,
              fontSize: 9,
              color: 'var(--color-text-muted)',
            }}
          >
            <span>
              Started: {new Date(status.started_at).toLocaleString()}
            </span>
            {status.sim_time && <span>Sim Time: {status.sim_time}</span>}
          </div>
        )}
      </Card>

      {/* Section 2: Scenario Catalog */}
      <Card title="SCENARIO CATALOG">
        {loading ? (
          <div
            style={{
              ...monoFont,
              fontSize: 11,
              color: 'var(--color-text-muted)',
              padding: 24,
              textAlign: 'center',
            }}
          >
            Loading scenarios...
          </div>
        ) : (
          <div style={{ padding: 12 }}>
            {sortedCategories.map((category) => (
              <div key={category} style={{ marginBottom: 16 }}>
                <div style={categoryHeaderStyle}>{category}</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 8,
                  }}
                >
                  {grouped[category].map((scenario) => (
                    <ScenarioCard
                      key={scenario.name}
                      scenario={scenario}
                      isExpanded={expandedScenario === scenario.name}
                      detail={scenarioDetails[scenario.name] || null}
                      isLoadingDetail={loadingDetail === scenario.name}
                      onToggle={() => handleToggle(scenario.name)}
                      onStart={handleStart}
                      isSimRunning={isSimActive}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stop confirmation dialog */}
      {confirmStop && (
        <ConfirmDialog
          message="Are you sure you want to stop the current simulation? This cannot be undone."
          onConfirm={handleStop}
          onCancel={() => setConfirmStop(false)}
        />
      )}
    </div>
  );
}
