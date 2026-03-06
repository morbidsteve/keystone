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
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] inset-0 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-[380px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius)] p-5 font-[var(--font-mono)]" style={{ boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)' }}
      >
        <p
          className="text-xs text-[var(--color-text)]" style={{ margin: '0 0 16px 0' }}
        >
          {message}
        </p>
        <div className="flex gap-2 justify-end">
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
            className="text-[var(--color-danger)] bg-[rgba(255,107,107,0.1)] py-1.5 px-4"
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
        className="flex items-start gap-2"
      >
        <button
          className="flex items-center justify-center w-[16px] h-[16px] shrink-0 mt-0.5 bg-transparent border-0 p-0 cursor-pointer text-[var(--color-text-muted)]"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-[var(--color-text-bright)] mb-1"
          >
            {scenario.display_name}
          </div>
          <div
            className="text-[var(--color-text-muted)] overflow-hidden" style={{ lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {scenario.description}
          </div>
          <div
            className="flex gap-2 mt-2 flex-wrap"
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
          className="flex items-center gap-1 py-1 px-2.5 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px] shrink-0" style={{ border: `1px solid ${isSimRunning ? 'var(--color-border)' : '#40c057'}`, backgroundColor: isSimRunning ? 'transparent' : 'rgba(64, 192, 87, 0.1)', color: isSimRunning ? 'var(--color-text-muted)' : '#40c057', cursor: isSimRunning ? 'not-allowed' : 'pointer', opacity: isSimRunning ? 0.5 : 1 }}
        >
          <Play size={9} />
          START
        </button>
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div
          className="mt-3 pt-3 border-t border-t-[var(--color-border)]"
        >
          {isLoadingDetail ? (
            <div
              className="text-[var(--color-text-muted)] p-2"
            >
              Loading details...
            </div>
          ) : detail ? (
            <>
              {/* Phase Timeline */}
              <div className="mb-3">
                <div
                  className="font-bold tracking-[1px] text-[var(--color-text-muted)] mb-2"
                >
                  PHASE TIMELINE
                </div>
                <div
                  className="flex w-full h-[28px] rounded-[var(--radius)] overflow-hidden border border-[var(--color-border)]"
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
                        className="flex items-center justify-center overflow-hidden relative" style={{ width: `${widthPct}%`, minWidth: widthPct > 3 ? undefined : 4, backgroundColor: `${tc}22`, borderRight: i < detail.phases.length - 1
                              ? '1px solid var(--color-border)'
                              : 'none' }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: tc }}
                        />
                        {widthPct > 12 && (
                          <span
                            className="text-[var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis py-0 px-1"
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
                  className="flex flex-wrap gap-1.5 mt-1.5"
                >
                  {detail.phases.map((phase, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 text-[var(--color-text-muted)]"
                    >
                      <div
                        className="w-[6px] h-[6px] rounded-[1px]" style={{ backgroundColor: tempoColor(phase.tempo) }}
                      />
                      <span>{phase.name}</span>
                      <span className="opacity-60">
                        ({phase.duration_h}h)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Units List */}
              <div className="mb-3">
                <div
                  className="font-bold tracking-[1px] text-[var(--color-text-muted)] mb-1.5"
                >
                  UNITS ({detail.units.length})
                </div>
                <div
                  className="flex flex-wrap gap-1"
                >
                  {detail.units.map((unit, i) => (
                    <span
                      key={i}
                      className="py-0.5 px-1.5 border border-[var(--color-border)] rounded-[2px] text-[var(--color-text)] bg-[var(--color-bg)]"
                      title={`${unit.name} (${unit.type}) - ${unit.callsign}`}
                    >
                      {unit.callsign}
                      <span
                        className="text-[var(--color-text-muted)] ml-1 text-[8px]"
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
                    className="font-bold tracking-[1px] text-[var(--color-text-muted)] mb-1"
                  >
                    AREA OF OPERATIONS
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-[var(--color-text)]"
                  >
                    <MapPin size={10} className="text-[var(--color-accent)]" />
                    {detail.area_of_operation.name}
                    <span className="text-[var(--color-text-muted)] text-[9px]">
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
    <div className="flex flex-col gap-4">
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
          className="text-[var(--color-danger)] py-2 px-3 border border-[var(--color-danger)] rounded-[var(--radius)] bg-[rgba(255,107,107,0.08)] flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="bg-transparent border-0 text-[var(--color-danger)] cursor-pointer font-[var(--font-mono)] text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Section 1: Simulation Control Bar */}
      <Card title="SIMULATION CONTROL">
        <div
          className="flex items-center gap-4 p-3 flex-wrap"
        >
          {/* Status indicator */}
          <div
            className="flex items-center gap-1.5"
          >
            <div style={statusDotStyle(status.status)} />
            <span
              className="font-bold text-[var(--color-text-bright)] tracking-[0.5px]"
            >
              {status.status.toUpperCase()}
            </span>
          </div>

          {/* Current scenario name */}
          {status.scenario_name && (
            <div
              className="text-[var(--color-text)] py-0.5 px-2 border border-[var(--color-border)] rounded-[var(--radius)]"
            >
              {status.scenario_name.replace(/_/g, ' ').toUpperCase()}
            </div>
          )}

          {/* Speed display + controls */}
          {isSimActive && (
            <div
              className="flex items-center gap-1"
            >
              <span
                className="text-[var(--color-text-muted)] mr-1"
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
              className="flex items-center gap-1 text-[var(--color-text-muted)]"
            >
              <Activity size={10} />
              {status.events_processed.toLocaleString()} events
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex gap-1.5">
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
                className="text-[var(--color-danger)]"
              >
                <Square size={10} /> STOP
              </button>
            )}
          </div>
        </div>

        {/* Started at / sim time row */}
        {status.started_at && (
          <div
            className="flex gap-4 text-[var(--color-text-muted)]" style={{ padding: '0 12px 12px 12px' }}
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
            className="text-[var(--color-text-muted)] p-6 text-center"
          >
            Loading scenarios...
          </div>
        ) : (
          <div className="p-3">
            {sortedCategories.map((category) => (
              <div key={category} className="mb-4">
                <div style={categoryHeaderStyle}>{category}</div>
                <div
                  className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
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
