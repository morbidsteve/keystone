import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Globe, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ExportDestination, ExportDestinationCreate } from '@/lib/types';
import {
  getExportDestinations,
  createExportDestination,
  updateExportDestination,
  deleteExportDestination,
} from '@/api/reports';

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
] as const;

export default function ExportDestinations() {
  const [destinations, setDestinations] = useState<ExportDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAuthType, setFormAuthType] = useState<'none' | 'bearer' | 'api_key' | 'basic'>('none');
  const [formAuthValue, setFormAuthValue] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const dests = await getExportDestinations();
      setDestinations(dests);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormAuthType('none');
    setFormAuthValue('');
    setFormActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (dest: ExportDestination) => {
    setFormName(dest.name);
    setFormUrl(dest.url);
    setFormAuthType(dest.auth_type);
    setFormAuthValue(dest.auth_value || '');
    setFormActive(dest.is_active);
    setEditingId(dest.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || !formUrl) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateExportDestination(editingId, {
          name: formName,
          url: formUrl,
          auth_type: formAuthType,
          auth_value: formAuthValue || undefined,
          is_active: formActive,
        });
        setDestinations((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      } else {
        const data: ExportDestinationCreate = {
          name: formName,
          url: formUrl,
          auth_type: formAuthType,
          auth_value: formAuthValue || undefined,
          is_active: formActive,
        };
        const created = await createExportDestination(data);
        setDestinations((prev) => [...prev, created]);
      }
      resetForm();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExportDestination(id);
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: 3,
  };

  const smallBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px',
    backgroundColor: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
  };

  return (
    <Card
      title="EXPORT DESTINATIONS"
      headerRight={
        !showForm ? (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              backgroundColor: 'var(--color-accent)', border: 'none',
              borderRadius: 'var(--radius)', color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px', cursor: 'pointer',
            }}
          >
            <Plus size={10} /> ADD
          </button>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Add/Edit Form */}
        {showForm && (
          <div style={{
            padding: 12, backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-accent)', borderRadius: 'var(--radius)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '1px' }}>
              {editingId ? 'EDIT DESTINATION' : 'NEW DESTINATION'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>NAME</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="GCSS-MC API" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>AUTH TYPE</label>
                <select value={formAuthType} onChange={(e) => setFormAuthType(e.target.value as typeof formAuthType)} style={inputStyle}>
                  {AUTH_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>URL</label>
              <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://api.example.mil/reports" style={inputStyle} />
            </div>

            {formAuthType !== 'none' && (
              <div>
                <label style={labelStyle}>AUTH VALUE ({formAuthType === 'bearer' ? 'Token' : formAuthType === 'api_key' ? 'API Key' : 'Credentials'})</label>
                <input
                  type="password"
                  value={formAuthValue}
                  onChange={(e) => setFormAuthValue(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text)' }}>Active</span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleSave}
                disabled={saving || !formName || !formUrl}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                  backgroundColor: (!formName || !formUrl || saving) ? 'var(--color-bg-surface)' : 'var(--color-accent)',
                  border: (!formName || !formUrl || saving) ? '1px solid var(--color-border)' : 'none',
                  borderRadius: 'var(--radius)',
                  color: (!formName || !formUrl || saving) ? 'var(--color-text-muted)' : 'var(--color-bg)',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px',
                  cursor: (!formName || !formUrl || saving) ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
                {saving ? 'SAVING...' : 'SAVE'}
              </button>
              <button onClick={resetForm} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                backgroundColor: 'transparent', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px', cursor: 'pointer',
              }}>
                <X size={10} /> CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Destination List */}
        {loading ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', padding: 16, textAlign: 'center' }}>
            Loading destinations...
          </div>
        ) : destinations.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', padding: 16, textAlign: 'center' }}>
            No export destinations configured yet.
          </div>
        ) : (
          destinations.map((d) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            }}>
              <Globe size={14} style={{ color: d.is_active ? 'var(--color-green, #22c55e)' : 'var(--color-text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, padding: '1px 5px',
                    borderRadius: 'var(--radius)', backgroundColor: d.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    border: d.is_active ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)',
                    color: d.is_active ? 'var(--color-green, #22c55e)' : 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {d.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, padding: '1px 5px',
                    borderRadius: 'var(--radius)', backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {d.auth_type}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.url}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => startEdit(d)} style={smallBtnStyle}>
                  <Edit2 size={9} /> EDIT
                </button>
                <button onClick={() => handleDelete(d.id)} style={{ ...smallBtnStyle, borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-red, #ef4444)' }}>
                  <Trash2 size={9} /> DEL
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
