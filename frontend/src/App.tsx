import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import MainLayout from '@/components/layout/MainLayout';
import LoadingFallback from '@/components/ui/LoadingFallback';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SSOGate from '@/components/auth/SSOGate';

const isSSO = import.meta.env.VITE_AUTH_MODE === 'sso';

// ---------------------------------------------------------------------------
// Lazy-loaded page components (route-based code splitting)
// ---------------------------------------------------------------------------

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const SupplyPage = lazy(() => import('@/pages/SupplyPage'));
const EquipmentPage = lazy(() => import('@/pages/EquipmentPage'));
const EquipmentDetailPage = lazy(() => import('@/pages/EquipmentDetailPage'));
const TransportationPage = lazy(() => import('@/pages/TransportationPage'));
const IngestionPage = lazy(() => import('@/pages/IngestionPage'));
const DataSourcesPage = lazy(() => import('@/pages/DataSourcesPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const DocsPage = lazy(() => import('@/pages/DocsPage'));
const ReadinessPage = lazy(() => import('@/pages/ReadinessPage'));
const MaintenanceDashboardPage = lazy(() => import('@/pages/MaintenanceDashboardPage'));
const RequisitionsPage = lazy(() => import('@/pages/RequisitionsPage'));
const PersonnelPage = lazy(() => import('@/pages/PersonnelPage'));
const MedicalPage = lazy(() => import('@/pages/MedicalPage'));
const FuelPage = lazy(() => import('@/pages/FuelPage'));
const CustodyPage = lazy(() => import('@/pages/CustodyPage'));
const AuditPage = lazy(() => import('@/pages/AuditPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// ---------------------------------------------------------------------------
// Suspense wrapper for lazy routes
// ---------------------------------------------------------------------------

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

// ---------------------------------------------------------------------------
// Protected route with permission checking
// ---------------------------------------------------------------------------

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
          className="flex flex-col items-center justify-center h-full p-10 font-[var(--font-mono)] text-[var(--color-text-muted)]"
        >
          <div
            className="text-[48px] font-bold text-[var(--color-danger)] mb-4"
          >
            403
          </div>
          <div
            className="text-sm font-semibold text-[var(--color-text-bright)] mb-2 tracking-[1px]"
          >
            ACCESS DENIED
          </div>
          <div className="text-xs text-center max-w-[400px]">
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
  const routes = (
    <ErrorBoundary>
    <Routes>
      {/* In SSO mode, /login redirects to home since auth is handled by OAuth2 Proxy */}
      {isSSO ? (
        <Route path="/login" element={<Navigate to="/" replace />} />
      ) : (
        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
      )}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard:view"><Lazy><DashboardPage /></Lazy></ProtectedRoute>} />
        <Route path="map" element={<ProtectedRoute requiredPermission="map:view"><Lazy><MapPage /></Lazy></ProtectedRoute>} />
        <Route path="supply" element={<ProtectedRoute requiredPermission="supply:view"><Lazy><SupplyPage /></Lazy></ProtectedRoute>} />
        <Route path="equipment" element={<ProtectedRoute requiredPermission="equipment:view"><Lazy><EquipmentPage /></Lazy></ProtectedRoute>} />
        <Route path="maintenance" element={<ProtectedRoute requiredPermission="maintenance:view"><Lazy><MaintenanceDashboardPage /></Lazy></ProtectedRoute>} />
        <Route path="requisitions" element={<ProtectedRoute requiredPermission="requisitions:view"><Lazy><RequisitionsPage /></Lazy></ProtectedRoute>} />
        <Route path="personnel" element={<ProtectedRoute requiredPermission="personnel:view"><Lazy><PersonnelPage /></Lazy></ProtectedRoute>} />
        <Route path="medical" element={<ProtectedRoute requiredPermission="medical:view"><Lazy><MedicalPage /></Lazy></ProtectedRoute>} />
        <Route path="fuel" element={<ProtectedRoute requiredPermission="fuel:view"><Lazy><FuelPage /></Lazy></ProtectedRoute>} />
        <Route path="custody" element={<ProtectedRoute requiredPermission="custody:view"><Lazy><CustodyPage /></Lazy></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute requiredPermission="audit:view"><Lazy><AuditPage /></Lazy></ProtectedRoute>} />
        <Route path="equipment/:id" element={<ProtectedRoute requiredPermission="equipment:view"><Lazy><EquipmentDetailPage /></Lazy></ProtectedRoute>} />
        <Route path="transportation" element={<ProtectedRoute requiredPermission="transportation:view"><Lazy><TransportationPage /></Lazy></ProtectedRoute>} />
        <Route
          path="ingestion"
          element={
            <ProtectedRoute requiredPermission="ingestion:upload">
              <Lazy><IngestionPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="data-sources"
          element={
            <ProtectedRoute requiredPermission="data_sources:view">
              <Lazy><DataSourcesPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route path="reports" element={<ProtectedRoute requiredPermission="reports:view"><Lazy><ReportsPage /></Lazy></ProtectedRoute>} />
        <Route path="alerts" element={<ProtectedRoute requiredPermission="alerts:view"><Lazy><AlertsPage /></Lazy></ProtectedRoute>} />
        <Route path="readiness" element={<ProtectedRoute requiredPermission="readiness:view"><Lazy><ReadinessPage /></Lazy></ProtectedRoute>} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredPermission={['admin:users', 'admin:settings', 'admin:roles']}>
              <Lazy><AdminPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="docs" element={<Lazy><DocsPage /></Lazy>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );

  return isSSO ? <SSOGate>{routes}</SSOGate> : routes;
}
