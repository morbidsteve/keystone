import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DemoBanner from '@/components/ui/DemoBanner';

export default function MainLayout() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        zIndex: 1,
      }}
    >
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
    </div>
  );
}
