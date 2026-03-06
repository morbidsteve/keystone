import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Compass } from 'lucide-react';

const STORAGE_KEY = 'keystone_onboarding_complete';

interface TourStep {
  id: string;
  target: string | null; // element ID or null for centered modal
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to KEYSTONE',
    content:
      'KEYSTONE is your logistics common operating picture. This quick tour will show you the key features. You can skip at any time and restart later from the help menu.',
  },
  {
    id: 'sidebar',
    target: 'nav-sidebar',
    title: 'Navigation Sidebar',
    content:
      'The sidebar gives you access to all KEYSTONE modules: Dashboard, Map, Supply, Equipment, Transportation, and more. Click any item to navigate.',
  },
  {
    id: 'unit-selector',
    target: 'unit-selector-dropdown',
    title: 'Unit Selector',
    content:
      'Use the unit selector to filter all data by your unit or any subordinate unit in the hierarchy. All KPIs, tables, and charts update automatically.',
  },
  {
    id: 'dashboard',
    target: 'dashboard-kpi-container',
    title: 'Dashboard KPIs',
    content:
      'The dashboard shows key performance indicators at a glance: unit readiness, supply levels, equipment status, active alerts, and convoy operations.',
  },
  {
    id: 'search',
    target: 'header-search-button',
    title: 'Quick Search',
    content:
      'Press Ctrl+K or click the search icon to open the command palette. Search for units, supply items, equipment, pages, or actions instantly.',
  },
  {
    id: 'alerts',
    target: 'alerts-container',
    title: 'Alerts & Notifications',
    content:
      'Alerts notify you of threshold breaches, overdue maintenance, supply shortfalls, and operational changes. Critical alerts appear as banners.',
  },
  {
    id: 'help',
    target: 'header-help-button',
    title: 'Help Mode',
    content:
      'Toggle Help Mode to see contextual tooltips on any element. Hover over KPIs, buttons, and labels to learn what they do.',
  },
  {
    id: 'done',
    target: null,
    title: 'You\'re Ready!',
    content:
      'That\'s the basics! Explore each module to see detailed logistics data. You can restart this tour anytime from the help menu. Good luck, and stay mission-ready.',
  },
];

export function resetGuidedTour() {
  localStorage.removeItem(STORAGE_KEY);
}

export function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let the UI render
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStep = TOUR_STEPS[step];

  const updateTargetRect = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [active, step, updateTargetRect]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setActive(false);
    setStep(0);
  };

  if (!active) return null;

  const padding = 8;
  const hasTarget = targetRect !== null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const tooltipWidth = 340;
    const tooltipGap = 16;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Prefer below target
    let top = targetRect.bottom + tooltipGap;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // If it goes below viewport, place above
    if (top + 200 > viewportH) {
      top = targetRect.top - tooltipGap - 200;
    }

    // Clamp horizontally
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportW - 16) left = viewportW - 16 - tooltipWidth;

    // Clamp vertically
    if (top < 16) top = 16;

    return {
      position: 'fixed',
      top,
      left,
    };
  };

  const overlay = createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
      }}
    >
      {/* SVG overlay with cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hasTarget && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={6}
                ry={6}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight border highlight */}
      {hasTarget && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            border: '2px solid var(--color-accent)',
            borderRadius: 6,
            pointerEvents: 'none',
            boxShadow: '0 0 0 4px rgba(77, 171, 247, 0.2)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          ...getTooltipStyle(),
          width: 340,
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={16} style={{ color: 'var(--color-accent)' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '1px',
                color: 'var(--color-text-bright)',
                textTransform: 'uppercase',
              }}
            >
              {currentStep.title}
            </span>
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '14px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--color-text)',
          }}
        >
          {currentStep.content}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor:
                    i === step ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '1px',
                color: 'var(--color-text-muted)',
                padding: '4px 8px',
                textTransform: 'uppercase',
              }}
            >
              Skip
            </button>

            {step > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '1px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <ChevronLeft size={12} />
                Prev
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '1px',
                border: 'none',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: '#fff',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {step < TOUR_STEPS.length - 1 && <ChevronRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );

  return overlay;
}

export default GuidedTour;
