import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import DemoBanner from '@/components/ui/DemoBanner';
import ClassificationBanner from '@/components/ui/ClassificationBanner';
import KeyboardShortcuts from '@/components/common/KeyboardShortcuts';
import { useClassificationStore } from '@/stores/classificationStore';
import { useSidebarToggle } from '@/hooks/useMediaQuery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CommandPalette from '@/components/common/CommandPalette';
import ToastContainer from '@/components/ui/ToastContainer';
import GlobalModals from '@/components/common/GlobalModals';
import GuidedTour from '@/components/onboarding/GuidedTour';

export default function MainLayout() {
  const fetchClassification = useClassificationStore((s) => s.fetchClassification);
  const { isMobile, isMobileOpen, toggle, close } = useSidebarToggle();
  const location = useLocation();
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  useEffect(() => {
    fetchClassification();
  }, [fetchClassification]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [location.pathname, isMobile, close]);

  return (
    <div
      className="flex flex-col h-screen relative z-[1] pt-6 pb-6"
    >
      <ClassificationBanner position="top" />
      <DemoBanner />
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay${isMobileOpen ? ' visible' : ''}`}
          onClick={close}
          role="presentation"
        />

        <Sidebar isMobileOpen={isMobileOpen} onClose={close} />

        <div
          className="main-content-area flex-1 flex flex-col overflow-hidden"
        >
          <Header onMenuToggle={toggle} />
          <main
            className="main-content-padding flex-1 overflow-auto p-5 px-6"
            role="main"
            id="main-content"
          >
            <Breadcrumb />
            <Outlet />
          </main>
        </div>
      </div>
      <ClassificationBanner position="bottom" />
      <CommandPalette />
      <KeyboardShortcuts isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <ToastContainer />
      <GlobalModals />
      <GuidedTour />
    </div>
  );
}
