import { useState, useEffect, useCallback } from 'react';
import {
  FolderSearch,
  Radio,
  FileSpreadsheet,
  Plus,
  Trash2,
  Play,
  Square,
  Zap,
  Settings,
  AlertTriangle,
  Check,
  X,
  Loader,
  Clock,
  Database,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import DataSourceStatusPill from './DataSourceStatusPill';
import DataSourceForm from './DataSourceForm';
import { formatRelativeTime } from '@/lib/utils';
import type { DataSource, DataSourceType, DataSourceCreate } from '@/api/dataSources';
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  startDataSource,
  stopDataSource,
  testDataSource,
} from '@/api/dataSources';

const typeIcons: Record<DataSourceType, typeof FolderSearch> = {
  mirc_directory: FolderSearch,
  irc_server: Radio,
  excel_directory: FileSpreadsheet,
};

const typeLabels: Record<DataSourceType, string> = {
  mirc_directory: 'mIRC Directory',
  irc_server: 'IRC Server',
  excel_directory: 'Excel Directory',
};

type AddFlowStep = 'hidden' | 'select-type' | 'form';

export default function AllSourcesPanel() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [addFlowStep, setAddFlowStep] = useState<AddFlowStep>('hidden');
  const [addSourceType, setAddSourceType] = useState<DataSourceType | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDataSources();
      setSources(data);
    } catch {
      setError('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleCreate = async (data: DataSourceCreate) => {
    try {
      await createDataSource(data);
      setAddFlowStep('hidden');
      setAddSourceType(null);
      await fetchSources();
    } catch {
      setError('Failed to create data source');
    }
  };

  const handleUpdate = async (data: DataSourceCreate) => {
    if (!editingSource) return;
    try {
      await updateDataSource(editingSource.id, { name: data.name, config: data.config });
      setEditingSource(null);
      await fetchSources();
    } catch {
      setError('Failed to update data source');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDataSource(id);
      if (selectedSource === id) setSelectedSource(null);
      await fetchSources();
    } catch {
      setError('Failed to delete data source');
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testDataSource(id);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Test request failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (source: DataSource) => {
    setTogglingId(source.id);
    try {
      if (source.status === 'active' || source.status === 'connected' || source.status === 'connecting') {
        await stopDataSource(source.id);
      } else {
        await startDataSource(source.id);
      }
      await fetchSources();
    } catch {
      setError('Failed to toggle data source');
    } finally {
      setTogglingId(null);
    }
  };

  // Render edit form
  if (editingSource) {
    return (
      <Card title={`EDIT SOURCE: ${editingSource.name}`}>
        <DataSourceForm
          initial={editingSource}
          sourceType={editingSource.source_type}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSource(null)}
        />
      </Card>
    );
  }

  // Render add form
  if (addFlowStep === 'form' && addSourceType) {
    return (
      <Card title={`NEW ${typeLabels[addSourceType].toUpperCase()} SOURCE`}>
        <DataSourceForm
          sourceType={addSourceType}
          onSubmit={handleCreate}
          onCancel={() => {
            setAddFlowStep('hidden');
            setAddSourceType(null);
          }}
        />
      </Card>
    );
  }

  const isActive = (s: DataSource) =>
    s.status === 'active' || s.status === 'connected' || s.status === 'connecting';

  return (
    <div className="flex flex-col gap-4">
      {/* Type selector cards */}
      {addFlowStep === 'select-type' && (
        <Card title="SELECT SOURCE TYPE">
          <div
            className="grid gap-3 grid-cols-3"
          >
            {([
              {
                type: 'mirc_directory' as DataSourceType,
                icon: FolderSearch,
                label: 'mIRC Directory Watcher',
                desc: 'Monitor a directory for mIRC chat log files and parse messages for ingestion.',
              },
              {
                type: 'irc_server' as DataSourceType,
                icon: Radio,
                label: 'IRC Server',
                desc: 'Connect to an IRC server and capture messages from specified channels in real time.',
              },
              {
                type: 'excel_directory' as DataSourceType,
                icon: FileSpreadsheet,
                label: 'Excel Directory Watcher',
                desc: 'Watch a directory for Excel spreadsheets and extract records using schema templates.',
              },
            ]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  setAddSourceType(opt.type);
                  setAddFlowStep('form');
                }}
                className="flex flex-col items-center gap-2.5 py-5 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer text-center transition-all duration-[var(--transition)]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <opt.icon size={28} className="text-[var(--color-accent)]" />
                <span
                  className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] tracking-[1px] uppercase"
                >
                  {opt.label}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-[1.4]"
                >
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => setAddFlowStep('hidden')}
              className="py-1.5 px-3 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] tracking-[1px] uppercase cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </Card>
      )}

      <Card
        title="ALL INGESTION SOURCES"
        headerRight={
          <button
            onClick={() => setAddFlowStep('select-type')}
            className="flex items-center gap-1.5 py-1.5 px-3.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] uppercase cursor-pointer"
          >
            <Plus size={13} />
            ADD SOURCE
          </button>
        }
      >
        {/* Error Banner */}
        {error && (
          <div
            className="flex items-center gap-2 py-2 px-3 bg-[rgba(255,107,107,0.1)] border border-[var(--color-danger)] rounded-[var(--radius)] mb-3"
          >
            <AlertTriangle size={14} className="text-[var(--color-danger)]" />
            <span
              className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] flex-1"
            >
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-0 cursor-pointer text-[var(--color-danger)] p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Test Result Banner */}
        {testResult && (
          <div
            className="flex items-center gap-2 py-2 px-3 rounded-[var(--radius)] mb-3" style={{ backgroundColor: testResult.success
                ? 'rgba(64, 192, 87, 0.1)'
                : 'rgba(255, 107, 107, 0.1)', border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-danger)'}` }}
          >
            {testResult.success ? (
              <Check size={14} className="text-[var(--color-success)]" />
            ) : (
              <AlertTriangle size={14} className="text-[var(--color-danger)]" />
            )}
            <span
              className="font-[var(--font-mono)] text-[11px] flex-1" style={{ color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {testResult.message}
            </span>
            <button
              onClick={() => setTestResult(null)}
              className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="flex items-center justify-center gap-2 p-8 text-[var(--color-text-muted)]"
          >
            <Loader size={16} className="animate-spin" />
            <span className="font-[var(--font-mono)] text-[11px]">LOADING...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && sources.length === 0 && (
          <div className="text-center p-8">
            <Database size={32} className="text-[var(--color-text-muted)] mb-2" />
            <div
              className="font-[var(--font-mono)] text-xs text-[var(--color-text)] mb-1"
            >
              NO DATA SOURCES CONFIGURED
            </div>
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-4"
            >
              Add an ingestion source to begin automatically importing data
            </div>
            <button
              onClick={() => setAddFlowStep('select-type')}
              className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
            >
              <Plus size={14} />
              ADD YOUR FIRST SOURCE
            </button>
          </div>
        )}

        {/* Source List */}
        {!loading && sources.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {sources.map((source) => {
              const TypeIcon = typeIcons[source.source_type];
              const isSelected = selectedSource === source.id;

              return (
                <div
                  key={source.id}
                  className="py-2.5 px-3 rounded-[var(--radius)] cursor-pointer" style={{ backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)', border: isSelected
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
                  onClick={() => setSelectedSource(isSelected ? null : source.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2.5">
                    <TypeIcon size={14} className="text-[var(--color-accent)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)]"
                      >
                        {source.name}
                      </div>
                      <div
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-0.5 flex gap-3"
                      >
                        <span>{typeLabels[source.source_type]}</span>
                        <span>{source.files_processed} files</span>
                        <span>{source.records_ingested.toLocaleString()} records</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {source.last_run && (
                        <span
                          className="flex items-center gap-1 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                        >
                          <Clock size={10} />
                          {formatRelativeTime(source.last_run)}
                        </span>
                      )}
                      <DataSourceStatusPill status={source.status} />
                    </div>
                  </div>

                  {/* Actions row (visible when selected) */}
                  {isSelected && (
                    <div
                      className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-t-[var(--color-border)]"
                    >
                      {/* Test */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTest(source.id); }}
                        disabled={testingId === source.id}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ opacity: testingId === source.id ? 0.5 : 1 }}
                      >
                        {testingId === source.id ? (
                          <Loader size={10} className="animate-spin" />
                        ) : (
                          <Zap size={10} />
                        )}
                        TEST
                      </button>

                      {/* Start/Stop */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(source); }}
                        disabled={togglingId === source.id}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] cursor-pointer" style={{ border: `1px solid ${isActive(source) ? 'var(--color-danger)' : 'var(--color-success)'}`, color: isActive(source) ? 'var(--color-danger)' : 'var(--color-success)', opacity: togglingId === source.id ? 0.5 : 1 }}
                      >
                        {togglingId === source.id ? (
                          <Loader size={10} className="animate-spin" />
                        ) : isActive(source) ? (
                          <Square size={10} />
                        ) : (
                          <Play size={10} />
                        )}
                        {isActive(source) ? 'STOP' : 'START'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSource(source); }}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                      >
                        <Settings size={10} />
                        EDIT
                      </button>

                      <div className="flex-1" />

                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(source.id); }}
                        className="flex items-center gap-1 py-1 px-2 bg-transparent border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[10px] cursor-pointer"
                      >
                        <Trash2 size={10} />
                        DELETE
                      </button>
                    </div>
                  )}

                  {/* Error display */}
                  {source.last_error && isSelected && (
                    <div
                      className="flex items-start gap-1.5 mt-2 py-1.5 px-2 bg-[rgba(255,107,107,0.08)] rounded-[var(--radius)]"
                    >
                      <AlertTriangle
                        size={11}
                        className="text-[var(--color-warning)] shrink-0 mt-px"
                      />
                      <span
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-warning)] break-words"
                      >
                        {source.last_error}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
