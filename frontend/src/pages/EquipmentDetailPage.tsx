import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Users, Wrench, Truck, MapPin, Plus, Check, X } from 'lucide-react';
import type {
  EquipmentItem,
  MaintenanceWorkOrder,
  EquipmentFault,
  EquipmentDriverAssignment,
} from '@/lib/types';
import { FaultSeverity } from '@/lib/types';
import { isDemoMode, mockApi } from '@/api/mockClient';
import { getIndividualEquipmentById, reportFault, updateFault, assignDriver, updateDriverAssignment } from '@/api/equipment';
import EquipmentOverviewTab from '@/components/equipment/EquipmentOverviewTab';
import MaintenanceHistoryTab from '@/components/equipment/MaintenanceHistoryTab';
import { formatDate, formatRelativeTime } from '@/lib/utils';

type TabId = 'overview' | 'maintenance' | 'faults' | 'drivers' | 'convoys';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: <Truck size={12} /> },
  { id: 'maintenance', label: 'MAINTENANCE', icon: <Wrench size={12} /> },
  { id: 'faults', label: 'FAULTS', icon: <AlertTriangle size={12} /> },
  { id: 'drivers', label: 'DRIVERS', icon: <Users size={12} /> },
  { id: 'convoys', label: 'CONVOYS', icon: <MapPin size={12} /> },
];

function getFaultSeverityColor(severity: FaultSeverity): string {
  switch (severity) {
    case FaultSeverity.SAFETY: return 'var(--color-danger)';
    case FaultSeverity.MAJOR: return 'var(--color-warning)';
    case FaultSeverity.MINOR: return 'var(--color-text-muted)';
    case FaultSeverity.COSMETIC: return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
  }
}

function getItemStatusColor(status: string): string {
  switch (status) {
    case 'FMC': return 'var(--color-success)';
    case 'NMC_M': return 'var(--color-warning)';
    case 'NMC_S': return 'var(--color-danger)';
    case 'DEADLINED': return 'var(--color-danger)';
    case 'ADMIN': return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
  }
}

// Shared form styles
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

const formLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 28,
};

const actionBtnStyle = (
  bg: string,
  fg: string,
  disabled?: boolean,
): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  padding: '6px 14px',
  border: 'none',
  borderRadius: 'var(--radius)',
  backgroundColor: disabled ? 'var(--color-text-muted)' : bg,
  color: fg,
  cursor: disabled ? 'not-allowed' : 'pointer',
  textTransform: 'uppercase',
  opacity: disabled ? 0.6 : 1,
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
});

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [equipment, setEquipment] = useState<EquipmentItem | null>(null);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [faults, setFaults] = useState<EquipmentFault[]>([]);
  const [drivers, setDrivers] = useState<EquipmentDriverAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const eq = await getIndividualEquipmentById(id);
      setEquipment(eq);

      if (isDemoMode) {
        const [wos, fs, ds] = await Promise.all([
          mockApi.getEquipmentHistory(id),
          mockApi.getEquipmentFaults(id),
          mockApi.getEquipmentDrivers(id),
        ]);
        setWorkOrders(wos);
        setFaults(fs);
        setDrivers(ds);
      }
    } catch (err) {
      console.error('Failed to load equipment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshMaintenance = useCallback(async () => {
    if (!id || !isDemoMode) return;
    try {
      const wos = await mockApi.getEquipmentHistory(id);
      setWorkOrders(wos);
    } catch (err) {
      console.error('Failed to refresh maintenance data:', err);
    }
  }, [id]);

  const currentDriver = drivers.find((d) => d.isPrimary && !d.releasedAt);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: 32, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          Loading equipment data...
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="animate-fade-in" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Equipment not found.
        </div>
        <button
          onClick={() => navigate('/equipment')}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          Back to Equipment
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        className="equipment-detail-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          onClick={() => navigate('/equipment')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '6px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            e.currentTarget.style.color = 'var(--color-text-bright)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <ArrowLeft size={12} />
          EQUIPMENT
        </button>

        <div className="equipment-info-line" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: getItemStatusColor(equipment.status),
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-text-bright)',
                }}
              >
                {equipment.bumperNumber}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
              >
                {equipment.equipmentType}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  padding: '2px 8px',
                  borderRadius: 2,
                  border: `1px solid ${getItemStatusColor(equipment.status)}`,
                  color: getItemStatusColor(equipment.status),
                  backgroundColor: `${getItemStatusColor(equipment.status)}15`,
                  letterSpacing: '1px',
                  fontWeight: 500,
                }}
              >
                {equipment.status}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                marginTop: 2,
              }}
            >
              {equipment.serialNumber} | {equipment.unitName} | TAMCN: {equipment.tamcn}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="responsive-tabs"
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--color-text-bright)'
                : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--color-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <EquipmentOverviewTab equipment={equipment} currentDriver={currentDriver} />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceHistoryTab
            workOrders={workOrders}
            equipmentId={id}
            onRefresh={refreshMaintenance}
          />
        )}

        {activeTab === 'faults' && (
          <FaultsTab faults={faults} equipmentId={id!} onFaultsChange={setFaults} />
        )}

        {activeTab === 'drivers' && (
          <DriversTab drivers={drivers} equipmentId={id!} onDriversChange={setDrivers} />
        )}

        {activeTab === 'convoys' && (
          <ConvoysTab />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Faults Tab (inline)
// ---------------------------------------------------------------------------

function FaultsTab({
  faults,
  equipmentId,
  onFaultsChange,
}: {
  faults: EquipmentFault[];
  equipmentId: string;
  onFaultsChange: (faults: EquipmentFault[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [faultDesc, setFaultDesc] = useState('');
  const [faultSeverity, setFaultSeverity] = useState<FaultSeverity>(FaultSeverity.MINOR);
  const [faultReportedBy, setFaultReportedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...faults].sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
  );

  const handleReportFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultDesc.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newFault = await reportFault(equipmentId, {
        faultDescription: faultDesc.trim(),
        severity: faultSeverity,
        reportedBy: faultReportedBy.trim() || 'System',
      });
      onFaultsChange([...faults, newFault]);
      setFaultDesc('');
      setFaultSeverity(FaultSeverity.MINOR);
      setFaultReportedBy('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report fault.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveFault = async (faultId: string) => {
    setResolvingId(faultId);
    setError(null);
    try {
      const updated = await updateFault(equipmentId, faultId, {
        resolvedAt: new Date().toISOString(),
      });
      onFaultsChange(faults.map((f) => (f.id === faultId ? updated : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve fault.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header with action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
          }}
        >
          {faults.length} FAULTS RECORDED
        </span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '4px 10px',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <Plus size={10} />
            REPORT FAULT
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: 'var(--color-danger)15',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-danger)',
          }}
        >
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Report Fault Form */}
      {showForm && (
        <form
          onSubmit={handleReportFault}
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            REPORT NEW FAULT
          </span>
          <div>
            <label style={formLabelStyle}>DESCRIPTION *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }}
              value={faultDesc}
              onChange={(e) => setFaultDesc(e.target.value)}
              placeholder="Describe the fault..."
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={formLabelStyle}>SEVERITY</label>
              <select
                style={selectStyle}
                value={faultSeverity}
                onChange={(e) => setFaultSeverity(e.target.value as FaultSeverity)}
              >
                {Object.values(FaultSeverity).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={formLabelStyle}>REPORTED BY</label>
              <input
                style={inputStyle}
                value={faultReportedBy}
                onChange={(e) => setFaultReportedBy(e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              style={actionBtnStyle('transparent', 'var(--color-text-muted)')}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={actionBtnStyle('var(--color-accent)', 'var(--color-bg)', isSubmitting)}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FAULT'}
            </button>
          </div>
        </form>
      )}

      {/* Fault List */}
      {sorted.length === 0 && !showForm && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          No faults reported for this equipment.
        </div>
      )}

      {sorted.map((fault) => (
        <div
          key={fault.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${getFaultSeverityColor(fault.severity)}`,
            borderRadius: 'var(--radius)',
          }}
        >
          <AlertTriangle
            size={14}
            style={{
              color: getFaultSeverityColor(fault.severity),
              marginTop: 2,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 2,
                    border: `1px solid ${getFaultSeverityColor(fault.severity)}`,
                    color: getFaultSeverityColor(fault.severity),
                    backgroundColor: `${getFaultSeverityColor(fault.severity)}15`,
                    letterSpacing: '1px',
                    fontWeight: 600,
                  }}
                >
                  {fault.severity}
                </span>
                {fault.resolvedAt && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-success)',
                      fontWeight: 600,
                    }}
                  >
                    RESOLVED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatRelativeTime(fault.reportedAt)}
                </span>
                {!fault.resolvedAt && (
                  <button
                    onClick={() => handleResolveFault(fault.id)}
                    disabled={resolvingId === fault.id}
                    style={{
                      ...actionBtnStyle(
                        'var(--color-success)',
                        '#fff',
                        resolvingId === fault.id,
                      ),
                      padding: '3px 10px',
                    }}
                  >
                    <Check size={9} />
                    {resolvingId === fault.id ? 'RESOLVING...' : 'RESOLVE'}
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text)',
                marginBottom: 6,
                lineHeight: 1.5,
              }}
            >
              {fault.faultDescription}
            </div>
            <div
              className="fault-metadata"
              style={{
                display: 'flex',
                gap: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-text-muted)',
              }}
            >
              <span>Reported by: {fault.reportedBy}</span>
              <span>{formatDate(fault.reportedAt, 'dd MMM yyyy HH:mm')}</span>
              {fault.workOrderId && (
                <span style={{ color: 'var(--color-text)' }}>
                  WO: {fault.workOrderId.toUpperCase()}
                </span>
              )}
              {fault.resolvedAt && (
                <span style={{ color: 'var(--color-success)' }}>
                  Resolved: {formatDate(fault.resolvedAt, 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drivers Tab (inline)
// ---------------------------------------------------------------------------

function DriversTab({
  drivers,
  equipmentId,
  onDriversChange,
}: {
  drivers: EquipmentDriverAssignment[];
  equipmentId: string;
  onDriversChange: (drivers: EquipmentDriverAssignment[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [personnelId, setPersonnelId] = useState('');
  const [personnelName, setPersonnelName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...drivers].sort((a, b) => {
    // Current (no releasedAt) first, then by assignedAt desc
    if (!a.releasedAt && b.releasedAt) return -1;
    if (a.releasedAt && !b.releasedAt) return 1;
    return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
  });

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newAssignment = await assignDriver(equipmentId, {
        personnelId: personnelId.trim(),
        personnelName: personnelName.trim() || undefined,
        isPrimary,
      });
      onDriversChange([...drivers, newAssignment]);
      setPersonnelId('');
      setPersonnelName('');
      setIsPrimary(false);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign driver.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async (assignmentId: string) => {
    setReleasingId(assignmentId);
    setError(null);
    try {
      const updated = await updateDriverAssignment(equipmentId, assignmentId, {
        releasedAt: new Date().toISOString(),
      });
      onDriversChange(drivers.map((d) => (d.id === assignmentId ? updated : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release driver.');
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header with action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
          }}
        >
          {drivers.filter((d) => !d.releasedAt).length} ACTIVE / {drivers.length} TOTAL
        </span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '4px 10px',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <Plus size={10} />
            ASSIGN DRIVER
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: 'var(--color-danger)15',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-danger)',
          }}
        >
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Assign Driver Form */}
      {showForm && (
        <form
          onSubmit={handleAssignDriver}
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            ASSIGN NEW DRIVER
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={formLabelStyle}>PERSONNEL ID *</label>
              <input
                style={inputStyle}
                value={personnelId}
                onChange={(e) => setPersonnelId(e.target.value)}
                placeholder="e.g., 1234567890"
                required
              />
            </div>
            <div>
              <label style={formLabelStyle}>NAME</label>
              <input
                style={inputStyle}
                value={personnelName}
                onChange={(e) => setPersonnelName(e.target.value)}
                placeholder="Full name"
              />
            </div>
          </div>
          <div>
            <label style={formLabelStyle}>PRIMARY DRIVER</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
              }}
            >
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                }}
              >
                {isPrimary ? 'Primary' : 'A-Driver'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
              style={actionBtnStyle('transparent', 'var(--color-text-muted)')}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={actionBtnStyle('var(--color-accent)', 'var(--color-bg)', isSubmitting)}
            >
              {isSubmitting ? 'ASSIGNING...' : 'ASSIGN'}
            </button>
          </div>
        </form>
      )}

      {/* Drivers Table */}
      {sorted.length === 0 && !showForm ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          No driver assignments on record.
        </div>
      ) : sorted.length > 0 && (
        <div
          className="responsive-table-wrapper"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                {['STATUS', 'NAME', 'ROLE', 'ASSIGNED', 'RELEASED', 'ACTIONS'].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--color-text-muted)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const isCurrent = !d.releasedAt;
                return (
                  <tr
                    key={d.id}
                    style={{
                      backgroundColor: isCurrent ? 'var(--color-success)08' : 'transparent',
                      transition: 'background-color var(--transition)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isCurrent ? 'var(--color-success)08' : 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isCurrent ? 'var(--color-success)' : 'var(--color-text-muted)',
                        }}
                      />
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        padding: '8px 12px',
                        color: isCurrent ? 'var(--color-text-bright)' : 'var(--color-text)',
                        fontWeight: isCurrent ? 600 : 400,
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {d.personnelName || d.personnelId}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        padding: '8px 12px',
                        color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {d.isPrimary ? 'PRIMARY' : 'A-DRIVER'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        padding: '8px 12px',
                        color: 'var(--color-text)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {formatDate(d.assignedAt, 'dd MMM yyyy')}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        padding: '8px 12px',
                        color: d.releasedAt ? 'var(--color-text-muted)' : 'var(--color-success)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {d.releasedAt ? formatDate(d.releasedAt, 'dd MMM yyyy') : 'CURRENT'}
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {isCurrent && (
                        <button
                          onClick={() => handleRelease(d.id)}
                          disabled={releasingId === d.id}
                          style={{
                            ...actionBtnStyle(
                              'transparent',
                              'var(--color-warning)',
                              releasingId === d.id,
                            ),
                            border: '1px solid var(--color-warning)',
                            padding: '3px 10px',
                          }}
                        >
                          <X size={9} />
                          {releasingId === d.id ? 'RELEASING...' : 'RELEASE'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convoys Tab (placeholder)
// ---------------------------------------------------------------------------

function ConvoysTab() {
  return (
    <div
      style={{
        padding: 32,
        textAlign: 'center',
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
      }}
    >
      <MapPin size={24} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--color-text-muted)',
          marginBottom: 8,
        }}
      >
        CONVOY ASSIGNMENTS
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        Convoy and movement assignment history will be displayed here.
        <br />
        Link equipment to convoy manifests from the Transportation page.
      </div>
    </div>
  );
}
