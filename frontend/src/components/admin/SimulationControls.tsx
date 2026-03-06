// =============================================================================
// KEYSTONE — Simulation Controls Component
// Admin panel widget for controlling the exercise simulation
// =============================================================================

import { useState } from 'react';
import { Play, Pause, Settings, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeedOption {
  label: string;
  multiplier: number;
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPEED_OPTIONS: SpeedOption[] = [
  { label: 'REAL-TIME', multiplier: 1, description: '1x' },
  { label: 'NORMAL', multiplier: 60, description: '60x' },
  { label: 'FAST', multiplier: 3600, description: '3600x' },
  { label: 'MAX', multiplier: 86400, description: '86400x' },
];

const SCENARIOS: Scenario[] = [
  { id: 'garrison', name: 'Garrison', description: 'Routine garrison operations with normal logistics tempo' },
  { id: 'pre-deployment', name: 'Pre-Deployment', description: 'Surge operations preparing for deployment; high requisition volume' },
  { id: 'itx', name: 'ITX', description: 'Integrated Training Exercise at 29 Palms; high convoy and maintenance tempo' },
  { id: 'steel-guardian', name: 'Steel Guardian', description: 'Full-scale field exercise; combat logistics operations' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SimulationControls() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(60);
  const [scenario, setScenario] = useState<string>('garrison');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const currentSpeed = SPEED_OPTIONS.find((s) => s.multiplier === speed);
  const currentScenario = SCENARIOS.find((s) => s.id === scenario);

  const handleToggle = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      // Reset elapsed when starting
      setElapsedTime('00:00:00');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime('00:00:00');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: isRunning
            ? 'rgba(64, 192, 87, 0.08)'
            : 'rgba(255, 107, 107, 0.08)',
          border: `1px solid ${isRunning ? 'rgba(64, 192, 87, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
          borderRadius: 'var(--radius)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isRunning ? 'var(--color-success)' : 'var(--color-danger)',
              boxShadow: isRunning
                ? '0 0 8px rgba(64, 192, 87, 0.6)'
                : '0 0 8px rgba(255, 107, 107, 0.6)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              color: isRunning ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                letterSpacing: '1px',
                marginBottom: 2,
              }}
            >
              SPEED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text-bright)',
              }}
            >
              {currentSpeed?.description ?? `${speed}x`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                letterSpacing: '1px',
                marginBottom: 2,
              }}
            >
              ELAPSED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text-bright)',
              }}
            >
              {elapsedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {/* Speed Selection */}
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Settings size={12} style={{ color: 'var(--color-accent)' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '2px',
                color: 'var(--color-text-bright)',
                textTransform: 'uppercase',
              }}
            >
              SIMULATION SPEED
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.multiplier}
                onClick={() => setSpeed(opt.multiplier)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor:
                    speed === opt.multiplier
                      ? 'rgba(77, 171, 247, 0.12)'
                      : 'var(--color-bg)',
                  border: `1px solid ${speed === opt.multiplier ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: speed === opt.multiplier ? 700 : 400,
                    letterSpacing: '1px',
                    color:
                      speed === opt.multiplier
                        ? 'var(--color-accent)'
                        : 'var(--color-text)',
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div
          style={{
            padding: 16,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Settings size={12} style={{ color: 'var(--color-accent)' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '2px',
                color: 'var(--color-text-bright)',
                textTransform: 'uppercase',
              }}
            >
              SCENARIO
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                disabled={isRunning}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  padding: '8px 12px',
                  backgroundColor:
                    scenario === sc.id
                      ? 'rgba(77, 171, 247, 0.12)'
                      : 'var(--color-bg)',
                  border: `1px solid ${scenario === sc.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning && scenario !== sc.id ? 0.5 : 1,
                  transition: 'all var(--transition)',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: scenario === sc.id ? 700 : 400,
                    letterSpacing: '1px',
                    color:
                      scenario === sc.id
                        ? 'var(--color-accent)'
                        : 'var(--color-text)',
                  }}
                >
                  {sc.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.3,
                  }}
                >
                  {sc.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleToggle}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            backgroundColor: isRunning ? 'var(--color-danger)' : 'var(--color-success)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: '#000',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          {isRunning ? (
            <>
              <Pause size={14} /> STOP SIMULATION
            </>
          ) : (
            <>
              <Play size={14} /> START SIMULATION
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1.5px',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <RefreshCw size={12} /> RESET
        </button>
      </div>

      {/* Scenario Description */}
      {currentScenario && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(77, 171, 247, 0.06)',
            border: '1px solid rgba(77, 171, 247, 0.15)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'var(--color-accent)',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            ACTIVE SCENARIO: {currentScenario.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text)',
              lineHeight: 1.5,
            }}
          >
            {currentScenario.description}
          </div>
        </div>
      )}
    </div>
  );
}
