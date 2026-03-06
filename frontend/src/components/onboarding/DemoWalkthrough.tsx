import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipForward,
  Square,
  ChevronRight,
  Monitor,
} from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  path: string;
  narration: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'intro',
    title: 'Welcome to KEYSTONE',
    path: '/dashboard',
    narration:
      'KEYSTONE provides a unified logistics common operating picture for Marine Corps units. Let\'s walk through the key capabilities.',
  },
  {
    id: 'dashboard',
    title: 'Logistics Dashboard',
    path: '/dashboard',
    narration:
      'The dashboard shows real-time KPIs including unit readiness, supply levels, equipment status, and active operations. All data is filtered to your unit scope.',
  },
  {
    id: 'map',
    title: 'Map View',
    path: '/map',
    narration:
      'The interactive map displays unit positions, supply points, convoy routes, and alerts using NATO military symbology. Click any icon for details.',
  },
  {
    id: 'supply',
    title: 'Supply Status',
    path: '/supply',
    narration:
      'Track supply levels across all NATO supply classes (I-X). Monitor days of supply, consumption rates, and identify shortfalls before they impact readiness.',
  },
  {
    id: 'equipment',
    title: 'Equipment Readiness',
    path: '/equipment',
    narration:
      'Monitor equipment operational readiness rates, track maintenance work orders, and view fault trends to prioritize repair efforts.',
  },
  {
    id: 'transportation',
    title: 'Transportation',
    path: '/transportation',
    narration:
      'Plan and track convoys, manage lift requests, view march tables, and monitor route throughput to keep supplies moving.',
  },
  {
    id: 'ingestion',
    title: 'Data Ingestion',
    path: '/ingestion',
    narration:
      'Ingest data from multiple sources including Excel spreadsheets, TAK feeds, and manual entry. The schema mapper ensures data quality.',
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    narration:
      'Generate standardized logistics reports using customizable templates. Schedule automatic generation and export to multiple destinations.',
  },
  {
    id: 'alerts',
    title: 'Alerts & Notifications',
    path: '/alerts',
    narration:
      'Automated alerts notify you of threshold breaches, overdue maintenance, supply shortfalls, and other critical conditions requiring attention.',
  },
  {
    id: 'readiness',
    title: 'Readiness Overview',
    path: '/readiness',
    narration:
      'The readiness view aggregates personnel, equipment, supply, and training data into unit readiness ratings aligned with DRRS reporting requirements.',
  },
  {
    id: 'complete',
    title: 'Demo Complete',
    path: '/dashboard',
    narration:
      'That concludes the KEYSTONE walkthrough. The system integrates data from across the logistics enterprise to give commanders and staff a single source of truth for sustainment decisions.',
  },
];

export function DemoWalkthrough() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);

  const currentStep = DEMO_STEPS[step];
  const progress = ((step + 1) / DEMO_STEPS.length) * 100;
  const isLastStep = step === DEMO_STEPS.length - 1;

  const handleStart = useCallback(() => {
    setRunning(true);
    setPaused(false);
    setStep(0);
  }, []);

  const handleEnd = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleEnd();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep, handleEnd]);

  const handleTogglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  // Start button (when not running)
  if (!running) {
    return (
      <button
        onClick={handleStart}
        className="inline-flex items-center gap-2 py-2 px-4 font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase border-0 rounded-[var(--radius)] bg-[var(--color-accent)] text-[#fff] cursor-pointer transition-opacity duration-[var(--transition)]"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <Play size={14} />
        Start Demo Walkthrough
      </button>
    );
  }

  // Full-screen overlay when running
  const overlay = createPortal(
    <div
      className="fixed z-[9990] flex flex-col bg-[rgba(0,0,0,0.85)] inset-0"
    >
      {/* Header with gradient */}
      <div
        className="py-5 px-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--color-accent), #1a5fb4)' }}
      >
        <div className="flex items-center gap-2.5">
          <Monitor size={18} className="text-[#fff]" />
          <span
            className="font-[var(--font-mono)] text-[13px] font-semibold tracking-[2px] uppercase text-[#fff]"
          >
            KEYSTONE Demo
          </span>
        </div>
        <span
          className="font-[var(--font-mono)] text-[10px] tracking-[1px] text-[rgba(255,255,255,0.7)]"
        >
          Step {step + 1} of {DEMO_STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-[3px] bg-[var(--color-border)]"
      >
        <div
          className="h-full bg-[var(--color-accent)]" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center py-10 px-6"
      >
        {/* Step card */}
        <div
          className="max-w-[560px] w-full bg-[var(--color-bg-surface)] border border-[var(--color-accent)] rounded-[var(--radius)] overflow-hidden"
        >
          {/* Step title */}
          <div
            className="py-4 px-5 border-b border-b-[var(--color-border)] flex items-center justify-between"
          >
            <span
              className="font-[var(--font-mono)] text-sm font-semibold tracking-[1.5px] uppercase text-[var(--color-text-bright)]"
            >
              {currentStep.title}
            </span>
            <span
              className="font-[var(--font-mono)] text-[9px] tracking-[1px] text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] py-0.5 px-2 rounded-[var(--radius)]"
            >
              {currentStep.path}
            </span>
          </div>

          {/* Narration */}
          <div
            className="py-5 px-5 font-[var(--font-mono)] text-xs leading-relaxed text-[var(--color-text)]"
          >
            {currentStep.narration}
          </div>

          {/* Paused indicator */}
          {paused && (
            <div
              className="py-2 px-5 bg-[rgba(250,176,5,0.1)] font-[var(--font-mono)] text-[10px] tracking-[1px] uppercase text-[var(--color-warning)] text-center" style={{ borderTop: '1px solid rgba(250, 176, 5, 0.3)' }}
            >
              Paused
            </div>
          )}
        </div>

        {/* Step dots */}
        <div
          className="flex gap-1.5 mt-6"
        >
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              className="h-[6px] rounded-[3px]" style={{ width: i === step ? 18 : 6, backgroundColor: i === step
                    ? 'var(--color-accent)'
                    : i < step
                      ? 'rgba(77, 171, 247, 0.4)'
                      : 'var(--color-border)', transition: 'all 0.2s ease' }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div
        className="py-4 px-6 border-t border-t-[var(--color-border)] flex items-center justify-center gap-3 bg-[var(--color-bg-surface)]"
      >
        {/* Pause / Resume */}
        <button
          onClick={handleTogglePause}
          className="flex items-center gap-1.5 py-2 px-3.5 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text)] cursor-pointer"
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? 'Resume' : 'Pause'}
        </button>

        {/* End Demo */}
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 py-2 px-3.5 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase border border-[var(--color-danger)] rounded-[var(--radius)] bg-transparent text-[var(--color-danger)] cursor-pointer"
        >
          <Square size={12} />
          End Demo
        </button>

        {/* Next / Finish */}
        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 py-2 px-4 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase border-0 rounded-[var(--radius)] bg-[var(--color-accent)] text-[#fff] cursor-pointer"
        >
          {isLastStep ? (
            'Finish'
          ) : (
            <>
              Next
              {step < DEMO_STEPS.length - 2 ? (
                <ChevronRight size={12} />
              ) : (
                <SkipForward size={12} />
              )}
            </>
          )}
        </button>
      </div>
    </div>,
    document.body,
  );

  return overlay;
}

export default DemoWalkthrough;
