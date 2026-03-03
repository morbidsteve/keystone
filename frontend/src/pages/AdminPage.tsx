import { useState } from 'react';
import { Users, Settings, Shield, Plus, Edit3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusDot from '@/components/ui/StatusDot';
import { Role, type User } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'users' | 'units'>('users');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)' }}>
        {[
          { key: 'users' as const, label: 'USER MANAGEMENT', icon: Users },
          { key: 'units' as const, label: 'UNIT CONFIGURATION', icon: Settings },
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
    </div>
  );
}
