import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit3, Trash2, X, Save, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { Permission, CustomRole } from '@/lib/types';
import { fetchPermissions, fetchRoles, createRole, updateRole, deleteRole } from '@/api/rbac';

// ---------------------------------------------------------------------------
// Shared styles (matching AdminPage patterns)
// ---------------------------------------------------------------------------

const tableHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  padding: '8px 12px',
  textAlign: 'left',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border)',
};

const tableCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  outline: 'none',
};

const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  backgroundColor: 'var(--color-accent)',
  color: '#000',
  border: 'none',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 500,
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
};

const btnDangerStyle: React.CSSProperties = {
  ...btnSecondaryStyle,
  color: 'var(--color-danger)',
  borderColor: 'var(--color-danger)',
};

// ---------------------------------------------------------------------------
// Permission category component
// ---------------------------------------------------------------------------

function PermissionCategory({
  category,
  permissions,
  selectedIds,
  onToggle,
  disabled,
}: {
  category: string;
  permissions: Permission[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const allSelected = permissions.every((p) => selectedIds.has(p.id));
  const someSelected = permissions.some((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (disabled) return;
    permissions.forEach((p) => {
      if (allSelected) {
        if (selectedIds.has(p.id)) onToggle(p.id);
      } else {
        if (!selectedIds.has(p.id)) onToggle(p.id);
      }
    });
  };

  return (
    <div
      className="border border-[var(--color-border)] rounded-[var(--radius)] mb-2 overflow-hidden"
    >
      <div
        className="flex items-center gap-2 py-2 px-3 bg-[var(--color-bg)] cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={toggleAll}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="accent-[var(--color-accent)]"
        />
        <span
          className="font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase text-[var(--color-text-bright)]"
        >
          {category}
        </span>
        <span
          className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] ml-auto"
        >
          {permissions.filter((p) => selectedIds.has(p.id)).length}/{permissions.length}
        </span>
      </div>
      {expanded && (
        <div style={{ padding: '4px 12px 8px 36px' }}>
          {permissions.map((perm) => (
            <label
              key={perm.id}
              className="flex items-center gap-2 py-1 px-0" style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(perm.id)}
                onChange={() => onToggle(perm.id)}
                disabled={disabled}
                className="accent-[var(--color-accent)]"
              />
              <span
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
              >
                {perm.display_name}
              </span>
              <span
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] ml-auto"
              >
                {perm.code}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoleManager component
// ---------------------------------------------------------------------------

export default function RoleManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  // Form state for create/edit
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissionIds, setFormPermissionIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Group permissions by category
  const permsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.category]) grouped[perm.category] = [];
      grouped[perm.category].push(perm);
    }
    return grouped;
  }, [permissions]);

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [perms, roleList] = await Promise.all([fetchPermissions(), fetchRoles()]);
        if (!cancelled) {
          setPermissions(perms);
          setRoles(roleList);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const togglePermission = useCallback((id: number) => {
    setFormPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Open create form
  const openCreate = () => {
    setSelectedRole(null);
    setFormMode('create');
    setFormName('');
    setFormDescription('');
    setFormPermissionIds(new Set());
    setFormOpen(true);
  };

  // Open view/edit form
  const openRole = (role: CustomRole) => {
    setSelectedRole(role);
    setFormMode(role.is_system ? 'view' : 'edit');
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormPermissionIds(new Set(role.permissions.map((p) => p.id)));
    setFormOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (formMode === 'create') {
        const created = await createRole({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          permission_ids: Array.from(formPermissionIds),
        });
        setRoles((prev) => [...prev, created]);
      } else if (formMode === 'edit' && selectedRole) {
        const updated = await updateRole(selectedRole.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          permission_ids: Array.from(formPermissionIds),
        });
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedRole(updated);
      }
      setFormOpen(false);
    } catch (err) {
      console.error('Failed to save role:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      if (selectedRole?.id === id) {
        setSelectedRole(null);
        setFormOpen(false);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  if (loading) {
    return (
      <Card title="ROLES & PERMISSIONS">
        <div
          className="p-10 text-center font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]"
        >
          Loading roles...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Role list */}
      <Card
        title="ROLES"
        headerRight={
          <button style={btnPrimaryStyle} onClick={openCreate}>
            <Plus size={12} /> CREATE ROLE
          </button>
        }
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={tableHeaderStyle}>ROLE</th>
              <th style={tableHeaderStyle}>DESCRIPTION</th>
              <th style={tableHeaderStyle}>TYPE</th>
              <th style={tableHeaderStyle}>PERMISSIONS</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.id}
                className="cursor-pointer" style={{ backgroundColor: selectedRole?.id === role.id ? 'var(--color-bg-hover)' : 'transparent' }}
                onClick={() => openRole(role)}
              >
                <td style={tableCellStyle}>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[var(--color-accent)]" />
                    <span className="font-semibold text-[var(--color-text-bright)]">
                      {role.name}
                    </span>
                  </div>
                </td>
                <td className="max-w-[300px]">
                  {role.description || '--'}
                </td>
                <td style={tableCellStyle}>
                  <span
                    className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-0.5 px-2 rounded-[var(--radius)]" style={{ backgroundColor: role.is_system
                        ? 'rgba(77, 171, 247, 0.12)'
                        : 'rgba(64, 192, 87, 0.12)', color: role.is_system ? 'var(--color-accent)' : 'var(--color-success)', border: role.is_system
                        ? '1px solid rgba(77, 171, 247, 0.3)'
                        : '1px solid rgba(64, 192, 87, 0.3)' }}
                  >
                    {role.is_system ? 'SYSTEM' : 'CUSTOM'}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <span className="font-[var(--font-mono)] text-[11px]">
                    {role.permissions.length}
                  </span>
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                  <div
                    className="flex gap-1.5 justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      style={btnSecondaryStyle}
                      onClick={() => openRole(role)}
                      title={role.is_system ? 'View' : 'Edit'}
                    >
                      <Edit3 size={12} />
                    </button>
                    {!role.is_system && (
                      <>
                        {deleteConfirm === role.id ? (
                          <div className="flex gap-1">
                            <button
                              style={btnDangerStyle}
                              onClick={() => handleDelete(role.id)}
                            >
                              CONFIRM
                            </button>
                            <button
                              style={btnSecondaryStyle}
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            style={btnDangerStyle}
                            onClick={() => setDeleteConfirm(role.id)}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Permission editor panel */}
      {formOpen && (
        <Card
          title={
            formMode === 'create'
              ? 'CREATE NEW ROLE'
              : formMode === 'edit'
                ? `EDIT ROLE: ${selectedRole?.name}`
                : `VIEW ROLE: ${selectedRole?.name}`
          }
          headerRight={
            <button
              style={btnSecondaryStyle}
              onClick={() => setFormOpen(false)}
            >
              <X size={12} /> CLOSE
            </button>
          }
        >
          <div className="flex flex-col gap-4 p-1">
            {/* Name + description fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label style={labelStyle}>ROLE NAME</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Supply Clerk"
                  style={inputStyle}
                  disabled={formMode === 'view'}
                />
              </div>
              <div className="flex-[2]">
                <label style={labelStyle}>DESCRIPTION</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this role's responsibilities"
                  style={inputStyle}
                  disabled={formMode === 'view'}
                />
              </div>
            </div>

            {/* Permissions by category */}
            <div>
              <label style={labelStyle}>
                PERMISSIONS ({formPermissionIds.size} / {permissions.length} SELECTED)
              </label>
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {Object.entries(permsByCategory).map(([cat, perms]) => (
                  <PermissionCategory
                    key={cat}
                    category={cat}
                    permissions={perms}
                    selectedIds={formPermissionIds}
                    onToggle={togglePermission}
                    disabled={formMode === 'view'}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            {formMode !== 'view' && (
              <div className="flex gap-2 justify-end">
                <button style={btnSecondaryStyle} onClick={() => setFormOpen(false)}>
                  CANCEL
                </button>
                <button
                  style={{
                    ...btnPrimaryStyle,
                    opacity: saving || !formName.trim() ? 0.5 : 1,
                    cursor: saving || !formName.trim() ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                >
                  <Save size={12} /> {saving ? 'SAVING...' : formMode === 'create' ? 'CREATE' : 'SAVE'}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
