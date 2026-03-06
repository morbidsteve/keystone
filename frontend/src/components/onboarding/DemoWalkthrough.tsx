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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-accent)',
          color: '#fff',
          cursor: 'pointer',
          transition: 'opacity var(--transition)',
        }}
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      {/* Header with gradient */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--color-accent), #1a5fb4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Monitor size={18} style={{ color: '#fff' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#fff',
            }}
          >
            KEYSTONE Demo
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '1px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Step {step + 1} of {DEMO_STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          backgroundColor: 'var(--color-border)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--color-accent)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        {/* Step card */}
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          {/* Step title */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--color-text-bright)',
              }}
            >
              {currentStep.title}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '1px',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-bg-hover)',
                padding: '2px 8px',
                borderRadius: 'var(--radius)',
              }}
            >
              {currentStep.path}
            </span>
          </div>

          {/* Narration */}
          <div
            style={{
              padding: '20px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.7,
              color: 'var(--color-text)',
            }}
          >
            {currentStep.narration}
          </div>

          {/* Paused indicator */}
          {paused && (
            <div
              style={{
                padding: '8px 20px',
                backgroundColor: 'rgba(250, 176, 5, 0.1)',
                borderTop: '1px solid rgba(250, 176, 5, 0.3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--color-warning)',
                textAlign: 'center',
              }}
            >
              Paused
            </div>
          )}
        </div>

        {/* Step dots */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 24,
          }}
        >
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === step
                    ? 'var(--color-accent)'
                    : i < step
                      ? 'rgba(77, 171, 247, 0.4)'
                      : 'var(--color-border)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          backgroundColor: 'var(--color-bg-surface)',
        }}
      >
        {/* Pause / Resume */}
        <button
          onClick={handleTogglePause}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? 'Resume' : 'Pause'}
        </button>

        {/* End Demo */}
        <button
          onClick={handleEnd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'transparent',
            color: 'var(--color-danger)',
            cursor: 'pointer',
          }}
        >
          <Square size={12} />
          End Demo
        </button>

        {/* Next / Finish */}
        <button
          onClick={handleNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            cursor: 'pointer',
          }}
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
