import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';
import ExportDestinations from '@/components/reports/ExportDestinations';

export default function ReportsPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-responsive-sidebar-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ReportGenerator />
          <ExportDestinations />
        </div>
        <ReportViewer />
      </div>
    </div>
  );
}
