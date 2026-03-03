import { useState } from 'react';
import { Users, Settings, Shield, Plus, Edit3, Save, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusDot from '@/components/ui/StatusDot';
import { Role, type User } from '@/lib/types';
import { useClassificationStore } from '@/stores/classificationStore';

const CLASSIFICATION_OPTIONS = [
  { level: 'UNCLASSIFIED', color: 'green', label: 'UNCLASSIFIED' },
  { level: 'CUI', color: 'amber', label: 'CONTROLLED UNCLASSIFIED INFORMATION' },
  { level: 'CONFIDENTIAL', color: 'blue', label: 'CONFIDENTIAL' },
  { level: 'SECRET', color: 'red', label: 'SECRET' },
  { level: 'TOP SECRET', color: 'orange', label: 'TOP SECRET' },
  { level: 'TOP SECRET//SCI', color: 'yellow_on_red', label: 'TOP SECRET//SCI' },
];

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: '#40c057', text: '#000' },
  amber: { bg: '#fab005', text: '#000' },
  blue: { bg: '#4dabf7', text: '#000' },
  red: { bg: '#c92a2a', text: '#fff' },
  orange: { bg: '#e8590c', text: '#000' },
  yellow_on_red: { bg: '#c92a2a', text: '#ffd43b' },
};

const demoUsers: User[] = [
  { id: 1, username: 'col.harris', full_name: 'COL Harris, R.J.', role: Role.COMMANDER, unit_id: 3, email: 'harris@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 2, username: 'maj.chen', full_name: 'MAJ Chen, W.', role: Role.S4, unit_id: 3, email: 'chen@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 3, username: 'capt.rodriguez', full_name: 'CAPT Rodriguez, M.A.', role: Role.S3, unit_id: 3, email: 'rodriguez@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 4, username: 'lt.davis', full_name: 'LT Davis, K.P.', role: Role.OPERATOR, unit_id: 4, email: 'davis@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 5, username: 'sgt.jones', full_name: 'SGT Jones, T.L.', role: Role.OPERATOR, unit_id: 4, email: 'jones@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 6, username: 'cpl.smith', full_name: 'CPL Smith, A.B.', role: Role.OPERATOR, unit_id: 5, email: 'smith@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 7, username: 'pvt.wilson', full_name: 'PVT Wilson, D.', role: Role.VIEWER, unit_id: 5, email: 'wilson@keystone.usmc.mil', is_active: false, created_at: '2026-03-01T00:00:00Z' },
];

const demoUnits = [
  { id: '1mef', name: 'I MEF', echelon: 'MEF', uic: 'M00001', children: 2 },
  { id: '1mardiv', name: '1ST MARDIV', echelon: 'DIVISION', uic: 'M10001', children: 3 },
  { id: '1mar', name: '1ST MARINES', echelon: 'REGIMENT', uic: 'M11001', children: 4 },
  { id: '1-1', name: '1/1 BN', echelon: 'BATTALION', uic: 'M11101', children: 4 },
  { id: '2-1', name: '2/1 BN', echelon: 'BATTALION', uic: 'M11201', children: 4 },
  { id: '3-1', name: '3/1 BN', echelon: 'BATTALION', uic: 'M11301', children: 3 },
];

const tableHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const tableCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'units' | 'classification'>('users');
  const { classification, updateClassification } = useClassificationStore();

  // Local state for the classification editor
  const [selectedLevel, setSelectedLevel] = useState(classification.level);
  const [customBannerText, setCustomBannerText] = useState(classification.banner_text);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derive the color from the selected level
  const selectedOption = CLASSIFICATION_OPTIONS.find((o) => o.level === selectedLevel);
  const selectedColor = selectedOption?.color || 'green';
  const previewColors = CLASSIFICATION_COLORS[selectedColor] || CLASSIFICATION_COLORS.green;

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    const option = CLASSIFICATION_OPTIONS.find((o) => o.level === level);
    if (option) {
      setCustomBannerText(option.label);
    }
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateClassification({
        level: selectedLevel,
        banner_text: customBannerText,
        color: selectedColor,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)' }}>
        {[
          { key: 'users' as const, label: 'USER MANAGEMENT', icon: Users },
          { key: 'units' as const, label: 'UNIT CONFIGURATION', icon: Settings },
          { key: 'classification' as const, label: 'CLASSIFICATION', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeTab === tab.key ? 600 : 400,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card
          title="SYSTEM USERS"
          headerRight={
            <button
              style={{
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
              }}
            >
              <Plus size={10} /> ADD USER
            </button>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>STATUS</th>
                  <th style={tableHeaderStyle}>USERNAME</th>
                  <th style={tableHeaderStyle}>NAME</th>
                  <th style={tableHeaderStyle}>ROLE</th>
                  <th style={tableHeaderStyle}>UNIT</th>
                  <th style={tableHeaderStyle}>LAST LOGIN</th>
                  <th style={tableHeaderStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {demoUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{ transition: 'background-color var(--transition)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={tableCellStyle}>
                      <StatusDot status={user.is_active ? 'GREEN' : 'RED'} />
                    </td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-bright)' }}>
                      {user.username}
                    </td>
                    <td style={tableCellStyle}>{user.full_name}</td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 2,
                          border: '1px solid var(--color-border-strong)',
                          color:
                            user.role === Role.ADMIN || user.role === Role.COMMANDER
                              ? 'var(--color-accent)'
                              : 'var(--color-text-muted)',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{user.unit_id ?? '—'}</td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-muted)' }}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={9} /> EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Units Tab */}
      {activeTab === 'units' && (
        <Card title="UNIT HIERARCHY">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>UIC</th>
                  <th style={tableHeaderStyle}>UNIT NAME</th>
                  <th style={tableHeaderStyle}>ECHELON</th>
                  <th style={tableHeaderStyle}>SUB-UNITS</th>
                  <th style={tableHeaderStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {demoUnits.map((unit) => (
                  <tr
                    key={unit.id}
                    style={{ transition: 'background-color var(--transition)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-muted)' }}>
                      {unit.uic}
                    </td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                      {unit.name}
                    </td>
                    <td style={tableCellStyle}>
                      <StatusBadge status="GREEN" label={unit.echelon} />
                    </td>
                    <td style={tableCellStyle}>{unit.children}</td>
                    <td style={tableCellStyle}>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 6px',
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          cursor: 'pointer',
                        }}
                      >
                        <Settings size={9} /> CONFIG
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Classification Tab */}
      {activeTab === 'classification' && (
        <Card title="CLASSIFICATION SETTINGS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Preview Banner */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                BANNER PREVIEW
              </label>
              <div
                style={{
                  height: 24,
                  backgroundColor: previewColors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: previewColors.text,
                    letterSpacing: '3px',
                  }}
                >
                  {customBannerText}
                </span>
              </div>
            </div>

            {/* Classification Level Selector */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                CLASSIFICATION LEVEL
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 400,
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                }}
              >
                {CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option.level} value={option.level}>
                    {option.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Banner Text */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                BANNER TEXT (OPTIONAL OVERRIDE)
              </label>
              <input
                type="text"
                value={customBannerText}
                onChange={(e) => {
                  setCustomBannerText(e.target.value);
                  setSaveSuccess(false);
                }}
                style={{
                  width: '100%',
                  maxWidth: 400,
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginTop: 4,
                  letterSpacing: '0.5px',
                }}
              >
                Customize the text displayed on the classification banner. Defaults to the standard label for the selected level.
              </p>
            </div>

            {/* Color Reference Table */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                CLASSIFICATION COLOR REFERENCE
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CLASSIFICATION_OPTIONS.map((option) => {
                  const colors = CLASSIFICATION_COLORS[option.color];
                  return (
                    <div
                      key={option.level}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        border: selectedLevel === option.level
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        backgroundColor: selectedLevel === option.level
                          ? 'rgba(77, 171, 247, 0.08)'
                          : 'transparent',
                      }}
                      onClick={() => handleLevelChange(option.level)}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: colors.bg,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: selectedLevel === option.level
                            ? 'var(--color-accent)'
                            : 'var(--color-text-muted)',
                          fontWeight: selectedLevel === option.level ? 600 : 400,
                          letterSpacing: '1px',
                        }}
                      >
                        {option.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button + Success Message */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  backgroundColor: isSaving ? 'var(--color-muted)' : 'var(--color-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-bg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'background-color var(--transition)',
                }}
              >
                <Save size={12} />
                {isSaving ? 'SAVING...' : 'SAVE CLASSIFICATION'}
              </button>

              {saveSuccess && (
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
                  <Check size={12} />
                  CLASSIFICATION UPDATED SUCCESSFULLY
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
