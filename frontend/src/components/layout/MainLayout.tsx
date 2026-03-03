import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DemoBanner from '@/components/ui/DemoBanner';
import ClassificationBanner from '@/components/ui/ClassificationBanner';
import { useClassificationStore } from '@/stores/classificationStore';

export default function MainLayout() {
  const fetchClassification = useClassificationStore((s) => s.fetchClassification);

  useEffect(() => {
    fetchClassification();
  }, [fetchClassification]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        zIndex: 1,
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      <ClassificationBanner position="top" />
      <DemoBanner />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header />
          <main
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <ClassificationBanner position="bottom" />
    </div>
  );
}
