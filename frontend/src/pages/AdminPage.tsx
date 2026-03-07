import { useState, useEffect } from 'react';
import { Users, Settings, Shield, Layers, Plus, Edit3, Save, Check, X, Trash2, Crosshair, KeyRound, Play, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusDot from '@/components/ui/StatusDot';
import UnitTreeView from '@/components/admin/UnitTreeView';
import TileLayerSettings from '@/components/admin/TileLayerSettings';
import ScenarioManager from '@/components/admin/ScenarioManager';
import RoleManager from '@/components/admin/RoleManager';
import SimulationControls from '@/components/admin/SimulationControls';
import CatalogManager from '@/components/admin/CatalogManager';
import { Role, Echelon, type User, type Unit } from '@/lib/types';
import { ECHELON_ORDER, ECHELON_ALLOWED_CHILDREN } from '@/lib/constants';
import { mockApi } from '@/api/mockClient';
import { useClassificationStore } from '@/stores/classificationStore';
import { useToast } from '@/hooks/useToast';

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

const ROLE_OPTIONS = Object.values(Role);

const initialUsers: User[] = [
  { id: 1, username: 'col.harris', full_name: 'COL Harris, R.J.', role: Role.COMMANDER, unit_id: 3, email: 'harris@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 2, username: 'maj.chen', full_name: 'MAJ Chen, W.', role: Role.S4, unit_id: 3, email: 'chen@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 3, username: 'capt.rodriguez', full_name: 'CAPT Rodriguez, M.A.', role: Role.S3, unit_id: 3, email: 'rodriguez@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 4, username: 'lt.davis', full_name: 'LT Davis, K.P.', role: Role.OPERATOR, unit_id: 4, email: 'davis@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 5, username: 'sgt.jones', full_name: 'SGT Jones, T.L.', role: Role.OPERATOR, unit_id: 4, email: 'jones@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 6, username: 'cpl.smith', full_name: 'CPL Smith, A.B.', role: Role.OPERATOR, unit_id: 5, email: 'smith@keystone.usmc.mil', is_active: true, created_at: '2026-03-01T00:00:00Z' },
  { id: 7, username: 'pvt.wilson', full_name: 'PVT Wilson, D.', role: Role.VIEWER, unit_id: 5, email: 'wilson@keystone.usmc.mil', is_active: false, created_at: '2026-03-01T00:00:00Z' },
];

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

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

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(2px)',
};

const modalBoxStyle: React.CSSProperties = {
  width: 440,
  maxHeight: '80vh',
  overflowY: 'auto',
  backgroundColor: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
  fontFamily: 'var(--font-mono)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '2px',
  color: 'var(--color-text-bright)',
  textTransform: 'uppercase',
};

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
  padding: '8px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const closeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: 'var(--radius)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
};

const actionBtnStyle: React.CSSProperties = {
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
// AdminPage
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'units' | 'classification' | 'tiles' | 'scenarios' | 'roles' | 'simulation' | 'catalog'>('users');
  const { classification, updateClassification } = useClassificationStore();
  const toast = useToast();

  // ── User management state ──
  const [users, setUsers] = useState(initialUsers);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: Role.OPERATOR as string,
    unit_id: '',
    is_active: true,
  });

  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  // ── Unit configuration state ──
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [parentIdForAdd, setParentIdForAdd] = useState('');
  const [parentEchelonForAdd, setParentEchelonForAdd] = useState<Echelon | null>(null);
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState<Unit | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [unitForm, setUnitForm] = useState({
    name: '',
    abbreviation: '',
    echelon: 'BATTALION' as string,
    uic: '',
    parentId: '',
    customEchelonName: '',
  });

  // ── Classification state ──
  const [selectedLevel, setSelectedLevel] = useState(classification.level);
  const [customBannerText, setCustomBannerText] = useState(classification.banner_text);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedOption = CLASSIFICATION_OPTIONS.find((o) => o.level === selectedLevel);
  const selectedColor = selectedOption?.color || 'green';
  const previewColors = CLASSIFICATION_COLORS[selectedColor] || CLASSIFICATION_COLORS.green;

  // ── Load units on mount ──
  useEffect(() => {
    mockApi.getUnits().then(setUnits).catch(console.error);
  }, []);

  // ── User modal handlers ──

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', full_name: '', email: '', role: Role.OPERATOR, unit_id: '', is_active: true });
    setUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: typeof user.role === 'string' ? user.role : user.role,
      unit_id: user.unit_id?.toString() ?? '',
      is_active: user.is_active,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.username.trim() || !userForm.full_name.trim()) return;
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                username: userForm.username,
                full_name: userForm.full_name,
                email: userForm.email,
                role: userForm.role as Role,
                unit_id: userForm.unit_id ? Number(userForm.unit_id) : null,
                is_active: userForm.is_active,
              }
            : u,
        ),
      );
    } else {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        username: userForm.username,
        full_name: userForm.full_name,
        email: userForm.email,
        role: userForm.role as Role,
        unit_id: userForm.unit_id ? Number(userForm.unit_id) : null,
        is_active: userForm.is_active,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setUserModalOpen(false);
    toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
  };

  const handleToggleActive = () => {
    if (!deactivateTarget) return;
    const newActive = !deactivateTarget.is_active;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === deactivateTarget.id ? { ...u, is_active: newActive } : u,
      ),
    );
    toast.success(newActive ? 'User reactivated' : 'User deactivated');
    setDeactivateTarget(null);
  };

  // ── Unit modal handlers ──

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim()) return;
    try {
      if (editingUnit) {
        await mockApi.updateUnit(editingUnit.id, {
          name: unitForm.name,
          abbreviation: unitForm.abbreviation || undefined,
          echelon: unitForm.echelon as Echelon,
          uic: unitForm.uic,
          parentId: unitForm.parentId || undefined,
          customEchelonName:
            unitForm.echelon === 'CUSTOM' ? unitForm.customEchelonName : undefined,
        });
      } else {
        await mockApi.createUnit({
          name: unitForm.name,
          abbreviation: unitForm.abbreviation || undefined,
          echelon: unitForm.echelon as Echelon,
          uic: unitForm.uic,
          parentId: unitForm.parentId || undefined,
          customEchelonName:
            unitForm.echelon === 'CUSTOM' ? unitForm.customEchelonName : undefined,
        });
      }
      const updated = await mockApi.getUnits();
      setUnits(updated);
      toast.success(editingUnit ? 'Unit updated successfully' : 'Unit created successfully');
    } catch (err) {
      console.error('Save unit failed:', err);
      toast.danger('Failed to save unit');
    }
    setUnitModalOpen(false);
  };

  // ── Delete unit handler ──

  const handleDeleteUnit = async () => {
    if (!deleteConfirmUnit) return;
    setDeleteError('');
    try {
      await mockApi.deleteUnit(deleteConfirmUnit.id);
      const updated = await mockApi.getUnits();
      setUnits(updated);
      setDeleteConfirmUnit(null);
      toast.success('Unit deleted successfully');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
      toast.danger('Failed to delete unit');
    }
  };

  // ── Classification handlers ──

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
      toast.success('Classification settings saved');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast.danger('Failed to save classification settings');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived: allowed echelons for modal dropdown ──
  const echelonOptionsForModal: Echelon[] = parentEchelonForAdd
    ? (ECHELON_ALLOWED_CHILDREN[parentEchelonForAdd] ?? ECHELON_ORDER)
    : ECHELON_ORDER;

  // ── Derived: does deleteConfirmUnit have children? ──
  const deleteTargetHasChildren =
    deleteConfirmUnit != null &&
    units.some((u) => u.parentId === deleteConfirmUnit.id);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Tab Selector */}
      <div className="flex gap-0.5 border-b border-b-[var(--color-border)]">
        {[
          { key: 'users' as const, label: 'USER MANAGEMENT', icon: Users },
          { key: 'units' as const, label: 'UNIT CONFIGURATION', icon: Settings },
          { key: 'classification' as const, label: 'CLASSIFICATION', icon: Shield },
          { key: 'tiles' as const, label: 'MAP TILES', icon: Layers },
          { key: 'scenarios' as const, label: 'SCENARIOS', icon: Crosshair },
          { key: 'roles' as const, label: 'ROLES & PERMISSIONS', icon: KeyRound },
          { key: 'simulation' as const, label: 'SIMULATION', icon: Play },
          { key: 'catalog' as const, label: 'ITEM CATALOG', icon: Package },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px]" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <Card
          title="SYSTEM USERS"
          headerRight={
            <button onClick={openAddUser} style={addButtonStyle}>
              <Plus size={10} /> ADD USER
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={tableHeaderStyle} title="GREEN = Active, RED = Disabled/Locked">
                    <span className="flex items-center gap-1">
                      STATUS
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-normal tracking-normal text-[var(--color-text-muted)]">
                        (<span className="inline-block w-[6px] h-[6px] rounded-full bg-[#40c057]" />Active
                        <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#ff6b6b] ml-0.5" />Locked)
                      </span>
                    </span>
                  </th>
                  <th style={tableHeaderStyle}>USERNAME</th>
                  <th style={tableHeaderStyle}>NAME</th>
                  <th style={tableHeaderStyle}>ROLE</th>
                  <th style={tableHeaderStyle}>UNIT</th>
                  <th style={tableHeaderStyle}>LAST LOGIN</th>
                  <th style={tableHeaderStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors duration-[var(--transition)]"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={tableCellStyle} title={user.is_active ? 'Active' : 'Disabled / Locked'}>
                      <StatusDot status={user.is_active ? 'GREEN' : 'RED'} />
                    </td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-bright)' }}>
                      {user.username}
                    </td>
                    <td style={tableCellStyle}>{user.full_name}</td>
                    <td style={tableCellStyle}>
                      <span
                        className="font-[var(--font-mono)] text-[10px] py-0.5 px-1.5 rounded-[2px] border border-[var(--color-border-strong)]" style={{ color: user.role === Role.ADMIN || user.role === Role.COMMANDER
                              ? 'var(--color-accent)'
                              : 'var(--color-text-muted)' }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {user.unit_id != null
                        ? (() => {
                            const unit = units.find((u) => u.id === String(user.unit_id));
                            return unit
                              ? <span title={unit.name}>{unit.abbreviation || unit.name}</span>
                              : String(user.unit_id);
                          })()
                        : '—'}
                    </td>
                    <td style={{ ...tableCellStyle, color: 'var(--color-text-muted)' }}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={tableCellStyle}>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditUser(user)} style={actionBtnStyle}>
                          <Edit3 size={9} /> EDIT
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(user)}
                          style={{
                            ...actionBtnStyle,
                            color: user.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                            borderColor: user.is_active ? 'rgba(255,107,107,0.3)' : 'rgba(34,197,94,0.3)',
                          }}
                        >
                          {user.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Units Tab ── */}
      {activeTab === 'units' && (
        <Card
          title="UNIT HIERARCHY"
          headerRight={
            <button
              onClick={() => {
                setEditingUnit(null);
                setParentIdForAdd('');
                setParentEchelonForAdd(null);
                setUnitForm({
                  name: '',
                  abbreviation: '',
                  echelon: 'BATTALION',
                  uic: '',
                  parentId: '',
                  customEchelonName: '',
                });
                setUnitModalOpen(true);
              }}
              style={addButtonStyle}
            >
              <Plus size={10} /> ADD UNIT
            </button>
          }
        >
          {units.length === 0 ? (
            <div
              className="p-6 text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px]"
            >
              Loading units...
            </div>
          ) : (
            <UnitTreeView
              units={units}
              onAddChild={(parentId, parentEchelon) => {
                setEditingUnit(null);
                setParentIdForAdd(parentId);
                setParentEchelonForAdd(parentEchelon);
                const allowedChildren = ECHELON_ALLOWED_CHILDREN[parentEchelon] || [];
                const defaultEchelon =
                  allowedChildren.length > 0 ? allowedChildren[0] : Echelon.COMPANY;
                setUnitForm({
                  name: '',
                  abbreviation: '',
                  echelon: defaultEchelon,
                  uic: '',
                  parentId,
                  customEchelonName: '',
                });
                setUnitModalOpen(true);
              }}
              onEdit={(unit) => {
                setEditingUnit(unit);
                setParentIdForAdd('');
                setParentEchelonForAdd(null);
                setUnitForm({
                  name: unit.name,
                  abbreviation: unit.abbreviation || '',
                  echelon: unit.echelon,
                  uic: unit.uic,
                  parentId: unit.parentId || '',
                  customEchelonName: unit.customEchelonName || '',
                });
                setUnitModalOpen(true);
              }}
              onDelete={(unit) => {
                setDeleteError('');
                setDeleteConfirmUnit(unit);
              }}
            />
          )}
        </Card>
      )}

      {/* ── Classification Tab ── */}
      {activeTab === 'classification' && (
        <Card title="CLASSIFICATION SETTINGS">
          <div className="flex flex-col gap-6">
            {/* Preview Banner */}
            <div>
              <label style={labelStyle}>BANNER PREVIEW</label>
              <div
                className="h-[24px] flex items-center justify-center rounded-[var(--radius)]" style={{ backgroundColor: previewColors.bg }}
              >
                <span
                  className="font-[var(--font-mono)] text-[11px] font-bold tracking-[3px]" style={{ color: previewColors.text }}
                >
                  {customBannerText}
                </span>
              </div>
            </div>

            {/* Classification Level Selector */}
            <div>
              <label style={labelStyle}>CLASSIFICATION LEVEL</label>
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                style={{ ...selectStyle, maxWidth: 400 }}
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
              <label style={labelStyle}>BANNER TEXT (OPTIONAL OVERRIDE)</label>
              <input
                type="text"
                value={customBannerText}
                onChange={(e) => {
                  setCustomBannerText(e.target.value);
                  setSaveSuccess(false);
                }}
                style={{ ...inputStyle, maxWidth: 400 }}
              />
              <p
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1 tracking-[0.5px]"
              >
                Customize the text displayed on the classification banner. Defaults to the
                standard label for the selected level.
              </p>
            </div>

            {/* Color Reference Table */}
            <div>
              <label style={labelStyle}>CLASSIFICATION COLOR REFERENCE</label>
              <div className="flex flex-wrap gap-2">
                {CLASSIFICATION_OPTIONS.map((option) => {
                  const colors = CLASSIFICATION_COLORS[option.color];
                  return (
                    <div
                      key={option.level}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-[var(--radius)] cursor-pointer" style={{ border: selectedLevel === option.level
                            ? '1px solid var(--color-accent)'
                            : '1px solid var(--color-border)', backgroundColor: selectedLevel === option.level
                            ? 'rgba(77, 171, 247, 0.08)'
                            : 'transparent' }}
                      onClick={() => handleLevelChange(option.level)}
                    >
                      <div
                        className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: colors.bg, border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <span
                        className="font-[var(--font-mono)] text-[10px] tracking-[1px]" style={{ color: selectedLevel === option.level
                              ? 'var(--color-accent)'
                              : 'var(--color-text-muted)', fontWeight: selectedLevel === option.level ? 600 : 400 }}
                      >
                        {option.level}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button + Success Message */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 py-2 px-5 border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1.5px] uppercase" style={{ backgroundColor: isSaving ? 'var(--color-muted)' : 'var(--color-accent)', cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background-color var(--transition)' }}
              >
                <Save size={12} />
                {isSaving ? 'SAVING...' : 'SAVE CLASSIFICATION'}
              </button>

              {saveSuccess && (
                <div
                  className="flex items-center gap-1 font-[var(--font-mono)] text-[10px] text-[#40c057] tracking-[1px]"
                >
                  <Check size={12} />
                  CLASSIFICATION UPDATED SUCCESSFULLY
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Map Tiles Tab ── */}
      {activeTab === 'tiles' && <TileLayerSettings />}

      {/* ── Scenarios Tab ── */}
      {activeTab === 'scenarios' && <ScenarioManager />}

      {/* ── Roles & Permissions Tab ── */}
      {activeTab === 'roles' && <RoleManager />}

      {/* ── Simulation Tab ── */}
      {activeTab === 'simulation' && (
        <Card>
          <div className="p-4">
            <SimulationControls />
          </div>
        </Card>
      )}

      {/* ── Item Catalog Tab ── */}
      {activeTab === 'catalog' && <CatalogManager />}

      {/* ── User Add/Edit Modal ── */}
      {userModalOpen && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserModalOpen(false);
          }}
        >
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>{editingUser ? 'EDIT USER' : 'ADD USER'}</span>
              <button onClick={() => setUserModalOpen(false)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label style={labelStyle}>USERNAME</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. sgt.miller"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. SGT Miller, J.R."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. miller@keystone.usmc.mil"
                  style={inputStyle}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label style={labelStyle}>ROLE</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                    style={selectStyle}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label style={labelStyle}>UNIT ID</label>
                  <input
                    type="number"
                    value={userForm.unit_id}
                    onChange={(e) => setUserForm((f) => ({ ...f, unit_id: e.target.value }))}
                    placeholder="e.g. 3"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={userForm.is_active}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  id="user-active"
                />
                <label
                  htmlFor="user-active"
                  className="cursor-pointer"
                >
                  ACTIVE
                </label>
              </div>
              <div
                className="flex gap-2 justify-end pt-2 border-t border-t-[var(--color-border)]"
              >
                <button
                  onClick={() => setUserModalOpen(false)}
                  className="py-1.5 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveUser}
                  className="py-1.5 px-4 border border-[var(--color-accent)] rounded-[var(--radius)] bg-[rgba(77,171,247,0.15)] text-[var(--color-accent)] font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] cursor-pointer"
                >
                  {editingUser ? 'SAVE CHANGES' : 'CREATE USER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unit Add/Edit Modal ── */}
      {unitModalOpen && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUnitModalOpen(false);
          }}
        >
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>
                {editingUnit ? 'EDIT UNIT' : 'ADD UNIT'}
              </span>
              <button onClick={() => setUnitModalOpen(false)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Name */}
              <div>
                <label style={labelStyle}>UNIT NAME</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 1ST MARINES"
                  style={inputStyle}
                />
              </div>

              {/* Abbreviation */}
              <div>
                <label style={labelStyle}>ABBREVIATION (OPTIONAL)</label>
                <input
                  type="text"
                  value={unitForm.abbreviation}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, abbreviation: e.target.value }))
                  }
                  placeholder="e.g. 1/1 MAR"
                  style={inputStyle}
                />
              </div>

              {/* Echelon */}
              <div>
                <label style={labelStyle}>ECHELON</label>
                <select
                  value={unitForm.echelon}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, echelon: e.target.value, customEchelonName: '' }))
                  }
                  style={selectStyle}
                >
                  {echelonOptionsForModal.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom echelon name — shown only when CUSTOM */}
              {unitForm.echelon === 'CUSTOM' && (
                <div>
                  <label style={labelStyle}>CUSTOM ECHELON NAME</label>
                  <input
                    type="text"
                    value={unitForm.customEchelonName}
                    onChange={(e) =>
                      setUnitForm((f) => ({ ...f, customEchelonName: e.target.value }))
                    }
                    placeholder="e.g. Task Force"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* UIC */}
              <div>
                <label style={labelStyle}>UIC</label>
                <input
                  type="text"
                  value={unitForm.uic}
                  onChange={(e) => setUnitForm((f) => ({ ...f, uic: e.target.value }))}
                  placeholder="e.g. M11001"
                  style={inputStyle}
                />
              </div>

              {/* Parent Unit */}
              <div>
                <label style={labelStyle}>PARENT UNIT</label>
                <select
                  value={unitForm.parentId}
                  onChange={(e) =>
                    setUnitForm((f) => ({ ...f, parentId: e.target.value }))
                  }
                  style={selectStyle}
                >
                  <option value="">— None (Root Unit) —</option>
                  {units
                    .filter((u) => !editingUnit || u.id !== editingUnit.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.echelon})
                      </option>
                    ))}
                </select>
              </div>

              {/* Footer buttons */}
              <div
                className="flex gap-2 justify-end pt-2 border-t border-t-[var(--color-border)]"
              >
                <button
                  onClick={() => setUnitModalOpen(false)}
                  className="py-1.5 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveUnit}
                  className="py-1.5 px-4 border border-[var(--color-accent)] rounded-[var(--radius)] bg-[rgba(77,171,247,0.15)] text-[var(--color-accent)] font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] cursor-pointer"
                >
                  {editingUnit ? 'SAVE CHANGES' : 'CREATE UNIT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmUnit && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmUnit(null);
          }}
        >
          <div style={{ ...modalBoxStyle, width: 400 }}>
            <div style={modalHeaderStyle}>
              <span style={{ ...modalTitleStyle, color: 'var(--color-danger)' }}>
                DELETE UNIT
              </span>
              <button onClick={() => setDeleteConfirmUnit(null)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p
                className="font-[var(--font-mono)] text-xs text-[var(--color-text)] m-0"
              >
                Delete{' '}
                <strong className="text-[var(--color-text-bright)]">
                  {deleteConfirmUnit.name}
                </strong>
                ?
              </p>

              {deleteTargetHasChildren ? (
                <p
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] m-0 py-2 px-2.5 border border-[var(--color-danger)] rounded-[var(--radius)] bg-[rgba(255,107,107,0.08)]"
                >
                  Cannot delete unit with sub-units. Remove or reassign sub-units first.
                </p>
              ) : (
                <p
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] m-0"
                >
                  This action cannot be undone.
                </p>
              )}

              {deleteError && (
                <p
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger)] m-0"
                >
                  {deleteError}
                </p>
              )}

              <div
                className="flex gap-2 justify-end pt-2 border-t border-t-[var(--color-border)]"
              >
                <button
                  onClick={() => setDeleteConfirmUnit(null)}
                  className="py-1.5 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-transparent text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] cursor-pointer"
                >
                  {deleteTargetHasChildren ? 'CLOSE' : 'CANCEL'}
                </button>
                {!deleteTargetHasChildren && (
                  <button
                    onClick={handleDeleteUnit}
                    className="flex items-center gap-1 py-1.5 px-4 border border-[var(--color-danger)] rounded-[var(--radius)] bg-[rgba(255,107,107,0.15)] text-[var(--color-danger)] font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] cursor-pointer"
                  >
                    <Trash2 size={10} /> DELETE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Deactivate/Activate Confirmation ── */}
      <ConfirmDialog
        isOpen={deactivateTarget !== null}
        title={deactivateTarget?.is_active ? 'DEACTIVATE USER' : 'ACTIVATE USER'}
        message={
          deactivateTarget
            ? deactivateTarget.is_active
              ? `Deactivate ${deactivateTarget.full_name}? They will lose access to the system.`
              : `Reactivate ${deactivateTarget.full_name}? They will regain access to the system.`
            : ''
        }
        confirmLabel={deactivateTarget?.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
        variant={deactivateTarget?.is_active ? 'danger' : 'default'}
        onConfirm={handleToggleActive}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
