import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportViewer from '@/components/reports/ReportViewer';

export default function ReportsPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <ReportGenerator />
        <ReportViewer />
      </div>
    </div>
  );
}
