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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
        }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <UploadPanel />
            <IngestionStatus />
          </div>
          <ReviewQueue />
        </div>
      )}

      {activeTab === 'tak' && <TAKManager />}

      {activeTab === 'schema-mapping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SchemaMapper />
          <TemplateManager />
        </div>
      )}
    </div>
  );
}
