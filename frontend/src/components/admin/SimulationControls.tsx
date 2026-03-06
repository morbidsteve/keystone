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
    <div className="flex flex-col gap-4">
      {/* Status Banner */}
      <div
        className="flex items-center justify-between py-3.5 px-4 rounded-[var(--radius)]" style={{ backgroundColor: isRunning
            ? 'rgba(64, 192, 87, 0.08)'
            : 'rgba(255, 107, 107, 0.08)', border: `1px solid ${isRunning ? 'rgba(64, 192, 87, 0.3)' : 'rgba(255, 107, 107, 0.3)'}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-[10px] h-[10px]" style={{ borderRadius: '50%', backgroundColor: isRunning ? 'var(--color-success)' : 'var(--color-danger)', boxShadow: isRunning
                ? '0 0 8px rgba(64, 192, 87, 0.6)'
                : '0 0 8px rgba(255, 107, 107, 0.6)' }}
          />
          <span
            className="font-[var(--font-mono)] text-xs font-bold tracking-[2px]" style={{ color: isRunning ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] mb-0.5"
            >
              SPEED
            </div>
            <div
              className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)]"
            >
              {currentSpeed?.description ?? `${speed}x`}
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] mb-0.5"
            >
              ELAPSED
            </div>
            <div
              className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)]"
            >
              {elapsedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div
        className="grid gap-4 grid-cols-2"
      >
        {/* Speed Selection */}
        <div
          className="p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="flex items-center gap-1.5 mb-3"
          >
            <Settings size={12} className="text-[var(--color-accent)]" />
            <span
              className="font-[var(--font-mono)] text-[9px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
            >
              SIMULATION SPEED
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.multiplier}
                onClick={() => setSpeed(opt.multiplier)}
                className="flex items-center justify-between py-2 px-3 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: speed === opt.multiplier
                      ? 'rgba(77, 171, 247, 0.12)'
                      : 'var(--color-bg)', border: `1px solid ${speed === opt.multiplier ? 'var(--color-accent)' : 'var(--color-border)'}`, transition: 'all var(--transition)' }}
              >
                <span
                  className="font-[var(--font-mono)] text-[11px] tracking-[1px]" style={{ fontWeight: speed === opt.multiplier ? 700 : 400, color: speed === opt.multiplier
                        ? 'var(--color-accent)'
                        : 'var(--color-text)' }}
                >
                  {opt.label}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
                >
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div
          className="p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <div
            className="flex items-center gap-1.5 mb-3"
          >
            <Settings size={12} className="text-[var(--color-accent)]" />
            <span
              className="font-[var(--font-mono)] text-[9px] font-bold tracking-[2px] text-[var(--color-text-bright)] uppercase"
            >
              SCENARIO
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                disabled={isRunning}
                className="flex flex-col items-start gap-0.5 py-2 px-3 rounded-[var(--radius)] text-left" style={{ backgroundColor: scenario === sc.id
                      ? 'rgba(77, 171, 247, 0.12)'
                      : 'var(--color-bg)', border: `1px solid ${scenario === sc.id ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning && scenario !== sc.id ? 0.5 : 1, transition: 'all var(--transition)' }}
              >
                <span
                  className="font-[var(--font-mono)] text-[11px] tracking-[1px]" style={{ fontWeight: scenario === sc.id ? 700 : 400, color: scenario === sc.id
                        ? 'var(--color-accent)'
                        : 'var(--color-text)' }}
                >
                  {sc.name}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] leading-[1.3]"
                >
                  {sc.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={handleToggle}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-0 rounded-[var(--radius)] text-[#000] font-[var(--font-mono)] text-xs font-bold tracking-[2px] cursor-pointer" style={{ backgroundColor: isRunning ? 'var(--color-danger)' : 'var(--color-success)', transition: 'all var(--transition)' }}
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
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1.5px] cursor-pointer transition-all duration-[var(--transition)]"
        >
          <RefreshCw size={12} /> RESET
        </button>
      </div>

      {/* Scenario Description */}
      {currentScenario && (
        <div
          className="py-2.5 px-3.5 bg-[rgba(77,171,247,0.06)] rounded-[var(--radius)]" style={{ border: '1px solid rgba(77, 171, 247, 0.15)' }}
        >
          <div
            className="font-[var(--font-mono)] text-[9px] font-bold tracking-[1.5px] text-[var(--color-accent)] mb-1 uppercase"
          >
            ACTIVE SCENARIO: {currentScenario.name}
          </div>
          <div
            className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] leading-normal"
          >
            {currentScenario.description}
          </div>
        </div>
      )}
    </div>
  );
}
