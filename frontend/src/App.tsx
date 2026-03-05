import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
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
import FuelPage from '@/pages/FuelPage';
import CustodyPage from '@/pages/CustodyPage';
import AuditPage from '@/pages/AuditPage';

function ProtectedRoute({
  children,
  requiredPermission,
}: {
  children: React.ReactNode;
  requiredPermission?: string | string[];
}) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { hasPermission, hasAnyPermission } = usePermission();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    const permitted = Array.isArray(requiredPermission)
      ? hasAnyPermission(...requiredPermission)
      : hasPermission(requiredPermission);

    if (!permitted) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 40,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--color-danger)',
              marginBottom: 16,
            }}
          >
            403
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text-bright)',
              marginBottom: 8,
              letterSpacing: '1px',
            }}
          >
            ACCESS DENIED
          </div>
          <div style={{ fontSize: 12, textAlign: 'center', maxWidth: 400 }}>
            You do not have the required permissions to access this page.
            Contact your administrator to request access.
          </div>
        </div>
      );
    }
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
        <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard:view"><DashboardPage /></ProtectedRoute>} />
        <Route path="map" element={<ProtectedRoute requiredPermission="map:view"><MapPage /></ProtectedRoute>} />
        <Route path="supply" element={<ProtectedRoute requiredPermission="supply:view"><SupplyPage /></ProtectedRoute>} />
        <Route path="equipment" element={<ProtectedRoute requiredPermission="equipment:view"><EquipmentPage /></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute requiredPermission="maintenance:view"><MaintenanceDashboardPage /></ProtectedRoute>} />
        <Route path="requisitions" element={<ProtectedRoute requiredPermission="requisitions:view"><RequisitionsPage /></ProtectedRoute>} />
        <Route path="personnel" element={<ProtectedRoute requiredPermission="personnel:view"><PersonnelPage /></ProtectedRoute>} />
        <Route path="medical" element={<ProtectedRoute requiredPermission="medical:view"><MedicalPage /></ProtectedRoute>} />
        <Route path="fuel" element={<ProtectedRoute requiredPermission="fuel:view"><FuelPage /></ProtectedRoute>} />
        <Route path="custody" element={<ProtectedRoute requiredPermission="custody:view"><CustodyPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute requiredPermission="audit:view"><AuditPage /></ProtectedRoute>} />
        <Route path="equipment/:id" element={<ProtectedRoute requiredPermission="equipment:view"><EquipmentDetailPage /></ProtectedRoute>} />
        <Route path="transportation" element={<ProtectedRoute requiredPermission="transportation:view"><TransportationPage /></ProtectedRoute>} />
        <Route
          path="ingestion"
          element={
            <ProtectedRoute requiredPermission="ingestion:upload">
              <IngestionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="data-sources"
          element={
            <ProtectedRoute requiredPermission="data_sources:view">
              <DataSourcesPage />
            </ProtectedRoute>
          }
        />
        <Route path="reports" element={<ProtectedRoute requiredPermission="reports:view"><ReportsPage /></ProtectedRoute>} />
        <Route path="alerts" element={<ProtectedRoute requiredPermission="alerts:view"><AlertsPage /></ProtectedRoute>} />
        <Route path="readiness" element={<ProtectedRoute requiredPermission="readiness:view"><ReadinessPage /></ProtectedRoute>} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredPermission={['admin:users', 'admin:settings', 'admin:roles']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="docs" element={<DocsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
