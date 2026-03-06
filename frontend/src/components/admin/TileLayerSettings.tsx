import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, ChevronUp, ChevronDown, Save, RefreshCw } from 'lucide-react';
import Card from '@/components/ui/Card';
import { getTileLayers, updateTileLayers, type TileLayerConfig } from '@/api/settings';

// ---------------------------------------------------------------------------
// Shared styles (matching AdminPage patterns)
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  boxSizing: 'border-box',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: 0,
};

const addButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  backgroundColor: 'var(--color-accent)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: 'var(--color-bg)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TileLayerSettings() {
  const [layers, setLayers] = useState<TileLayerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadLayers();
  }, []);

  const loadLayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTileLayers();
      setLayers(data);
    } catch {
      setError('Failed to load tile layer settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateTileLayers(layers);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save tile layer settings');
    } finally {
      setSaving(false);
    }
  };

  const addLayer = () => {
    setLayers([
      ...layers,
      {
        name: `layer_${Date.now()}`,
        label: 'New Layer',
        url_template: '/tiles/osm/{z}/{x}/{y}.png',
        attribution: '',
        max_zoom: 19,
        enabled: true,
        order: layers.length,
      },
    ]);
  };

  const removeLayer = (index: number) => {
    if (deleteConfirm === index) {
      setLayers(layers.filter((_, i) => i !== index));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(index);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const updateLayer = (
    index: number,
    field: keyof TileLayerConfig,
    value: string | number | boolean,
  ) => {
    const updated = [...layers];
    updated[index] = { ...updated[index], [field]: value };
    setLayers(updated);
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const updated = [...layers];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((l, i) => {
      l.order = i;
    });
    setLayers(updated);
  };

  if (loading) {
    return (
      <Card title="MAP TILE LAYERS">
        <div
          className="flex items-center justify-center gap-2 p-10 font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
        >
          <RefreshCw size={14} className="animate-spin" />
          LOADING TILE LAYERS...
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="MAP TILE LAYERS"
      headerRight={
        <div className="flex gap-2">
          <button onClick={addLayer} style={addButtonStyle}>
            <Plus size={10} /> ADD LAYER
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Info banner */}
        <div
          className="py-2.5 px-3 bg-[rgba(77,171,247,0.08)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-relaxed" style={{ border: '1px solid rgba(77, 171, 247, 0.2)' }}
        >
          <Layers
            size={12}
            className="inline align-middle mr-1.5 text-[var(--color-accent)]"
          />
          Configure map tile layers served through the nginx proxy. URL templates use{' '}
          <code
            className="bg-[var(--color-bg)] py-px px-1 rounded-[2px] text-[10px]"
          >
            {'{z}/{x}/{y}'}
          </code>{' '}
          placeholders. Layers are displayed in the order listed below.
        </div>

        {/* Error message */}
        {error && (
          <div
            className="py-2 px-3 bg-[rgba(255,107,107,0.08)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[#ff6b6b]" style={{ border: '1px solid rgba(255, 107, 107, 0.3)' }}
          >
            {error}
          </div>
        )}

        {/* Layer list */}
        {layers.length === 0 ? (
          <div
            className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
          >
            No tile layers configured. Click ADD LAYER to create one.
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={`${layer.name}-${index}`}
              className="p-3.5 border border-[var(--color-border)] rounded-[var(--radius)]" style={{ backgroundColor: layer.enabled
                  ? 'var(--color-bg)'
                  : 'rgba(134, 142, 150, 0.05)', opacity: layer.enabled ? 1 : 0.6, transition: 'opacity 0.2s ease' }}
            >
              {/* Layer header row */}
              <div
                className="flex items-center gap-2 mb-3"
              >
                {/* Order badge */}
                <div
                  className="w-[24px] h-[24px] bg-[var(--color-accent)] text-[var(--color-bg)] flex items-center justify-center font-[var(--font-mono)] text-[10px] font-bold shrink-0 rounded-full"
                >
                  {index + 1}
                </div>

                {/* Layer label display */}
                <span
                  className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] tracking-[0.5px] flex-1"
                >
                  {layer.label || layer.name}
                </span>

                {/* Enabled toggle */}
                <label
                  className="flex items-center gap-1.5 cursor-pointer font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] uppercase" style={{ color: layer.enabled ? '#40c057' : 'var(--color-text-muted)' }}
                >
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => updateLayer(index, 'enabled', e.target.checked)}
                    className="cursor-pointer"
                  />
                  {layer.enabled ? 'ENABLED' : 'DISABLED'}
                </label>

                {/* Move up */}
                <button
                  onClick={() => moveLayer(index, -1)}
                  disabled={index === 0}
                  style={{
                    ...actionBtnStyle,
                    opacity: index === 0 ? 0.3 : 1,
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move up"
                >
                  <ChevronUp size={14} />
                </button>

                {/* Move down */}
                <button
                  onClick={() => moveLayer(index, 1)}
                  disabled={index === layers.length - 1}
                  style={{
                    ...actionBtnStyle,
                    opacity: index === layers.length - 1 ? 0.3 : 1,
                    cursor: index === layers.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move down"
                >
                  <ChevronDown size={14} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeLayer(index)}
                  style={{
                    ...actionBtnStyle,
                    borderColor:
                      deleteConfirm === index
                        ? 'var(--color-danger)'
                        : 'var(--color-border)',
                    color:
                      deleteConfirm === index
                        ? 'var(--color-danger)'
                        : 'var(--color-text-muted)',
                  }}
                  title={deleteConfirm === index ? 'Click again to confirm' : 'Delete layer'}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Inline fields */}
              <div
                className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: '140px 140px 1fr' }}
              >
                {/* Name */}
                <div>
                  <label style={labelStyle}>NAME (KEY)</label>
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => updateLayer(index, 'name', e.target.value)}
                    placeholder="e.g. osm"
                    style={inputStyle}
                  />
                </div>

                {/* Label */}
                <div>
                  <label style={labelStyle}>DISPLAY LABEL</label>
                  <input
                    type="text"
                    value={layer.label}
                    onChange={(e) => updateLayer(index, 'label', e.target.value)}
                    placeholder="e.g. OpenStreetMap"
                    style={inputStyle}
                  />
                </div>

                {/* URL Template */}
                <div>
                  <label style={labelStyle}>URL TEMPLATE</label>
                  <input
                    type="text"
                    value={layer.url_template}
                    onChange={(e) => updateLayer(index, 'url_template', e.target.value)}
                    placeholder="/tiles/osm/{z}/{x}/{y}.png"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                className="grid gap-2.5" style={{ gridTemplateColumns: '1fr 100px' }}
              >
                {/* Attribution */}
                <div>
                  <label style={labelStyle}>ATTRIBUTION</label>
                  <input
                    type="text"
                    value={layer.attribution}
                    onChange={(e) => updateLayer(index, 'attribution', e.target.value)}
                    placeholder="e.g. OpenStreetMap contributors"
                    style={inputStyle}
                  />
                </div>

                {/* Max Zoom */}
                <div>
                  <label style={labelStyle}>MAX ZOOM</label>
                  <input
                    type="number"
                    value={layer.max_zoom}
                    onChange={(e) =>
                      updateLayer(index, 'max_zoom', parseInt(e.target.value, 10) || 19)
                    }
                    min={1}
                    max={22}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Save button row */}
        <div
          className="flex items-center gap-3 pt-2 border-t border-t-[var(--color-border)]"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 py-2 px-5 border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ backgroundColor: saving ? 'var(--color-muted)' : 'var(--color-accent)', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background-color var(--transition)' }}
          >
            <Save size={12} />
            {saving ? 'SAVING...' : 'SAVE TILE LAYERS'}
          </button>

          <button
            onClick={loadLayers}
            disabled={loading}
            className="flex items-center gap-1.5 py-2 px-4 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] cursor-pointer"
          >
            <RefreshCw size={12} />
            RELOAD
          </button>

          {success && (
            <div
              className="flex items-center gap-1 font-[var(--font-mono)] text-[10px] text-[#40c057] tracking-[1px]"
            >
              TILE LAYERS SAVED SUCCESSFULLY
            </div>
          )}
        </div>
      </div>

      {/* Spin animation for loading icon */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
}
