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
      className="fixed z-[9998] inset-0"
    >
      {/* SVG overlay with cutout */}
      <svg
        className="fixed w-full h-full" style={{ inset: 0, pointerEvents: 'none' }}
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
          className="fixed rounded-[6px]" style={{ top: targetRect.top - padding, left: targetRect.left - padding, width: targetRect.width + padding * 2, height: targetRect.height + padding * 2, border: '2px solid var(--color-accent)', pointerEvents: 'none', boxShadow: '0 0 0 4px rgba(77, 171, 247, 0.2)' }}
        />
      )}

      {/* Tooltip */}
      <div
        className="bg-[var(--color-bg-surface)] border border-[var(--color-accent)] rounded-[var(--radius)] z-[9999] overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[var(--color-border)]"
        >
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[var(--color-accent)]" />
            <span
              className="font-[var(--font-mono)] text-xs font-semibold tracking-[1px] text-[var(--color-text-bright)] uppercase"
            >
              {currentStep.title}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0.5 flex items-center"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div
          className="py-3.5 px-4 font-[var(--font-mono)] text-[11px] leading-relaxed text-[var(--color-text)]"
        >
          {currentStep.content}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between py-2.5 px-4 border-t border-t-[var(--color-border)]"
        >
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="w-[6px] h-[6px]" style={{ borderRadius: '50%', backgroundColor: i === step ? 'var(--color-accent)' : 'var(--color-border)', transition: 'background-color 0.2s' }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="bg-transparent border-0 cursor-pointer font-[var(--font-mono)] text-[10px] tracking-[1px] text-[var(--color-text-muted)] py-1 px-2 uppercase"
            >
              Skip
            </button>

            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 py-1.5 px-2.5 font-[var(--font-mono)] text-[10px] tracking-[1px] border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text)] cursor-pointer uppercase"
              >
                <ChevronLeft size={12} />
                Prev
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] border-0 rounded-[var(--radius)] bg-[var(--color-accent)] text-[#fff] cursor-pointer uppercase"
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
