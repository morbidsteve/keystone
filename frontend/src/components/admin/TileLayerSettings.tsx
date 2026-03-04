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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 40,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          LOADING TILE LAYERS...
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="MAP TILE LAYERS"
      headerRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addLayer} style={addButtonStyle}>
            <Plus size={10} /> ADD LAYER
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Info banner */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(77, 171, 247, 0.08)',
            border: '1px solid rgba(77, 171, 247, 0.2)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          <Layers
            size={12}
            style={{
              display: 'inline',
              verticalAlign: 'middle',
              marginRight: 6,
              color: 'var(--color-accent)',
            }}
          />
          Configure map tile layers served through the nginx proxy. URL templates use{' '}
          <code
            style={{
              backgroundColor: 'var(--color-bg)',
              padding: '1px 4px',
              borderRadius: 2,
              fontSize: 10,
            }}
          >
            {'{z}/{x}/{y}'}
          </code>{' '}
          placeholders. Layers are displayed in the order listed below.
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 107, 107, 0.08)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#ff6b6b',
            }}
          >
            {error}
          </div>
        )}

        {/* Layer list */}
        {layers.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
          >
            No tile layers configured. Click ADD LAYER to create one.
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={`${layer.name}-${index}`}
              style={{
                padding: 14,
                backgroundColor: layer.enabled
                  ? 'var(--color-bg)'
                  : 'rgba(134, 142, 150, 0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                opacity: layer.enabled ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Layer header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {/* Order badge */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                {/* Layer label display */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-bright)',
                    letterSpacing: '0.5px',
                    flex: 1,
                  }}
                >
                  {layer.label || layer.name}
                </span>

                {/* Enabled toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    color: layer.enabled ? '#40c057' : 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => updateLayer(index, 'enabled', e.target.checked)}
                    style={{ cursor: 'pointer' }}
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
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 140px 1fr',
                  gap: 10,
                  marginBottom: 10,
                }}
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
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px',
                  gap: 10,
                }}
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              backgroundColor: saving ? 'var(--color-muted)' : 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background-color var(--transition)',
            }}
          >
            <Save size={12} />
            {saving ? 'SAVING...' : 'SAVE TILE LAYERS'}
          </button>

          <button
            onClick={loadLayers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            RELOAD
          </button>

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#40c057',
                letterSpacing: '1px',
              }}
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
