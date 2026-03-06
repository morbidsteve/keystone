import { useState } from 'react';
import UploadPanel from '@/components/ingestion/UploadPanel';
import ReviewQueue from '@/components/ingestion/ReviewQueue';
import IngestionStatus from '@/components/ingestion/IngestionStatus';
import TAKManager from '@/components/ingestion/TAKManager';
import SchemaMapper from '@/components/ingestion/SchemaMapper';
import TemplateManager from '@/components/ingestion/TemplateManager';

type IngestionTab = 'files' | 'tak' | 'schema-mapping';

export default function IngestionPage() {
  const [activeTab, setActiveTab] = useState<IngestionTab>('files');

  const tabStyle = (tab: IngestionTab): React.CSSProperties => ({
    padding: '8px 20px',
    backgroundColor: activeTab === tab ? 'var(--color-bg-elevated)' : 'transparent',
    border: activeTab === tab ? '1px solid var(--color-border)' : '1px solid transparent',
    borderBottom: activeTab === tab ? '1px solid var(--color-bg-elevated)' : '1px solid var(--color-border)',
    borderRadius: activeTab === tab ? 'var(--radius) var(--radius) 0 0' : 'var(--radius) var(--radius) 0 0',
    color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'all var(--transition)',
    marginBottom: -1,
    position: 'relative' as const,
    zIndex: activeTab === tab ? 1 : 0,
  });

  return (
    <div className="animate-fade-in flex flex-col gap-0" >
      {/* Tab Bar */}
      <div
        className="flex gap-0 border-b border-b-[var(--color-border)] mb-4"
      >
        <button style={tabStyle('files')} onClick={() => setActiveTab('files')}>
          FILE UPLOAD
        </button>
        <button style={tabStyle('tak')} onClick={() => setActiveTab('tak')}>
          TAK SERVERS
        </button>
        <button style={tabStyle('schema-mapping')} onClick={() => setActiveTab('schema-mapping')}>
          SCHEMA MAPPING
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'files' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <UploadPanel />
            <IngestionStatus />
          </div>
          <ReviewQueue />
        </div>
      )}

      {activeTab === 'tak' && <TAKManager />}

      {activeTab === 'schema-mapping' && (
        <div className="flex flex-col gap-4">
          <SchemaMapper />
          <TemplateManager />
        </div>
      )}
    </div>
  );
}
