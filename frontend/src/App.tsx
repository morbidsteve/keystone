import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import SupplyPage from '@/pages/SupplyPage';
import EquipmentPage from '@/pages/EquipmentPage';
import EquipmentDetailPage from '@/pages/EquipmentDetailPage';
import TransportationPage from '@/pages/TransportationPage';
import IngestionPage from '@/pages/IngestionPage';
import DataSourcesPage from '@/pages/DataSourcesPage';
import ReportsPage from '@/pages/ReportsPage';
import AlertsPage from '@/pages/AlertsPage';
import MapPage from '@/pages/MapPage';
import AdminPage from '@/pages/AdminPage';
import DocsPage from '@/pages/DocsPage';
import ReadinessPage from '@/pages/ReadinessPage';
import MaintenanceDashboardPage from '@/pages/MaintenanceDashboardPage';
import RequisitionsPage from '@/pages/RequisitionsPage';
import PersonnelPage from '@/pages/PersonnelPage';
import MedicalPage from '@/pages/MedicalPage';

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
        <Route path="map" element={<MapPage />} />
        <Route path="supply" element={<SupplyPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="maintenance" element={<MaintenanceDashboardPage />} />
        <Route path="requisitions" element={<RequisitionsPage />} />
        <Route path="personnel" element={<PersonnelPage />} />
        <Route path="medical" element={<MedicalPage />} />
        <Route path="equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="transportation" element={<TransportationPage />} />
        <Route path="ingestion" element={<IngestionPage />} />
        <Route path="data-sources" element={<DataSourcesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="readiness" element={<ReadinessPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="docs" element={<DocsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
