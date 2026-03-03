import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import SupplyPage from '@/pages/SupplyPage';
import EquipmentPage from '@/pages/EquipmentPage';
import TransportationPage from '@/pages/TransportationPage';
import IngestionPage from '@/pages/IngestionPage';
import ReportsPage from '@/pages/ReportsPage';
import AlertsPage from '@/pages/AlertsPage';
import AdminPage from '@/pages/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="supply" element={<SupplyPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="transportation" element={<TransportationPage />} />
        <Route path="ingestion" element={<IngestionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
