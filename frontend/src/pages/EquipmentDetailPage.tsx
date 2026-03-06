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
      <div className="animate-fade-in p-8 text-center">
        <div
          className="font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]"
        >
          Loading equipment data...
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="animate-fade-in p-8 text-center">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          Equipment not found.
        </div>
        <button
          onClick={() => navigate('/equipment')}
          className="font-[var(--font-mono)] text-[11px] py-2 px-4 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] cursor-pointer"
        >
          Back to Equipment
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Header */}
      <div
        className="equipment-detail-header flex items-center gap-4"
        
      >
        <button
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] py-1.5 px-3 border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-pointer transition-all duration-[var(--transition)]"
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

        <div className="equipment-info-line flex items-center gap-3 flex-1" >
          <span
            className="inline-block w-[10px] h-[10px] shrink-0" style={{ borderRadius: '50%', backgroundColor: getItemStatusColor(equipment.status) }}
          />
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="font-[var(--font-mono)] text-base font-semibold text-[var(--color-text-bright)]"
              >
                {equipment.bumperNumber}
              </span>
              <span
                className="font-[var(--font-mono)] text-xs text-[var(--color-text)]"
              >
                {equipment.equipmentType}
              </span>
              <span
                className="font-[var(--font-mono)] text-[9px] py-0.5 px-2 rounded-[2px] tracking-[1px] font-medium" style={{ border: `1px solid ${getItemStatusColor(equipment.status)}`, color: getItemStatusColor(equipment.status), backgroundColor: `${getItemStatusColor(equipment.status)}15` }}
              >
                {equipment.status}
              </span>
            </div>
            <div
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-0.5"
            >
              {equipment.serialNumber} | {equipment.unitName} | TAMCN: {equipment.tamcn}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="responsive-tabs flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
        
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] py-2.5 px-4 border-0 bg-transparent cursor-pointer" style={{ borderBottom: activeTab === tab.id
                ? '2px solid var(--color-text-bright)'
                : '2px solid transparent', color: activeTab === tab.id ? 'var(--color-text-bright)' : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
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
    <div className="flex flex-col gap-2">
      {/* Header with action */}
      <div className="flex justify-between items-center mb-1">
        <span
          className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
        >
          {faults.length} FAULTS RECORDED
        </span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-1 px-2.5 border border-[var(--color-accent)] rounded-[var(--radius)] bg-transparent text-[var(--color-accent)] cursor-pointer uppercase"
          >
            <Plus size={10} />
            REPORT FAULT
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-[var(--color-danger)15] border border-[var(--color-danger)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)]"
        >
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Report Fault Form */}
      {showForm && (
        <form
          onSubmit={handleReportFault}
          className="py-3 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-accent)] rounded-[var(--radius)] flex flex-col gap-2.5"
        >
          <span
            className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-bright)] tracking-[1px] uppercase"
          >
            REPORT NEW FAULT
          </span>
          <div>
            <label style={formLabelStyle}>DESCRIPTION *</label>
            <textarea
              className="resize-y"
              value={faultDesc}
              onChange={(e) => setFaultDesc(e.target.value)}
              placeholder="Describe the fault..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
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
          <div className="flex gap-2 justify-end">
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
          className="p-8 text-center text-[var(--color-text-muted)] text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          No faults reported for this equipment.
        </div>
      )}

      {sorted.map((fault) => (
        <div
          key={fault.id}
          className="flex items-start gap-3 py-3 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ borderLeft: `3px solid ${getFaultSeverityColor(fault.severity)}` }}
        >
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0" style={{ color: getFaultSeverityColor(fault.severity) }}
          />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="font-[var(--font-mono)] text-[9px] py-0.5 px-1.5 rounded-[2px] tracking-[1px] font-semibold" style={{ border: `1px solid ${getFaultSeverityColor(fault.severity)}`, color: getFaultSeverityColor(fault.severity), backgroundColor: `${getFaultSeverityColor(fault.severity)}15` }}
                >
                  {fault.severity}
                </span>
                {fault.resolvedAt && (
                  <span
                    className="font-[var(--font-mono)] text-[9px] text-[var(--color-success)] font-semibold"
                  >
                    RESOLVED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
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
              className="text-[11px] text-[var(--color-text)] mb-1.5 leading-normal"
            >
              {fault.faultDescription}
            </div>
            <div
              className="fault-metadata flex gap-3 font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
              
            >
              <span>Reported by: {fault.reportedBy}</span>
              <span>{formatDate(fault.reportedAt, 'dd MMM yyyy HH:mm')}</span>
              {fault.workOrderId && (
                <span className="text-[var(--color-text)]">
                  WO: {fault.workOrderId.toUpperCase()}
                </span>
              )}
              {fault.resolvedAt && (
                <span className="text-[var(--color-success)]">
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
    <div className="flex flex-col gap-2">
      {/* Header with action */}
      <div className="flex justify-between items-center mb-1">
        <span
          className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)]"
        >
          {drivers.filter((d) => !d.releasedAt).length} ACTIVE / {drivers.length} TOTAL
        </span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] py-1 px-2.5 border border-[var(--color-accent)] rounded-[var(--radius)] bg-transparent text-[var(--color-accent)] cursor-pointer uppercase"
          >
            <Plus size={10} />
            ASSIGN DRIVER
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 py-2 px-3 bg-[var(--color-danger)15] border border-[var(--color-danger)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-danger)]"
        >
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Assign Driver Form */}
      {showForm && (
        <form
          onSubmit={handleAssignDriver}
          className="py-3 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-accent)] rounded-[var(--radius)] flex flex-col gap-2.5"
        >
          <span
            className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-bright)] tracking-[1px] uppercase"
          >
            ASSIGN NEW DRIVER
          </span>
          <div className="grid grid-cols-2 gap-2.5">
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
              className="flex items-center gap-2 py-1 px-0"
            >
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <span
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
              >
                {isPrimary ? 'Primary' : 'A-Driver'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
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
          className="p-8 text-center text-[var(--color-text-muted)] text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          No driver assignments on record.
        </div>
      ) : sorted.length > 0 && (
        <div
          className="responsive-table-wrapper bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
          
        >
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr>
                {['STATUS', 'NAME', 'ROLE', 'ASSIGNED', 'RELEASED', 'ACTIONS'].map((h) => (
                  <th
                    key={h}
                    className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] py-2.5 px-3 text-left border-b border-b-[var(--color-border)]"
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
                      className="py-2 px-3 border-b border-b-[var(--color-border)]"
                    >
                      <span
                        className="inline-block w-[8px] h-[8px]" style={{ borderRadius: '50%', backgroundColor: isCurrent ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                      />
                    </td>
                    <td
                      className="font-[var(--font-mono)] text-xs py-2 px-3 border-b border-b-[var(--color-border)]" style={{ color: isCurrent ? 'var(--color-text-bright)' : 'var(--color-text)', fontWeight: isCurrent ? 600 : 400 }}
                    >
                      {d.personnelName || d.personnelId}
                    </td>
                    <td
                      className="font-[var(--font-mono)] text-[10px] py-2 px-3 text-[var(--color-text-muted)] border-b border-b-[var(--color-border)] uppercase tracking-[0.5px]"
                    >
                      {d.isPrimary ? 'PRIMARY' : 'A-DRIVER'}
                    </td>
                    <td
                      className="font-[var(--font-mono)] text-[10px] py-2 px-3 text-[var(--color-text)] border-b border-b-[var(--color-border)]"
                    >
                      {formatDate(d.assignedAt, 'dd MMM yyyy')}
                    </td>
                    <td
                      className="font-[var(--font-mono)] text-[10px] py-2 px-3 border-b border-b-[var(--color-border)]" style={{ color: d.releasedAt ? 'var(--color-text-muted)' : 'var(--color-success)' }}
                    >
                      {d.releasedAt ? formatDate(d.releasedAt, 'dd MMM yyyy') : 'CURRENT'}
                    </td>
                    <td
                      className="py-2 px-3 border-b border-b-[var(--color-border)]"
                    >
                      {isCurrent && (
                        <button
                          onClick={() => handleRelease(d.id)}
                          disabled={releasingId === d.id}
                          className="py-[3px] px-2.5"
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
      className="p-8 text-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
    >
      <MapPin size={24} className="text-[var(--color-text-muted)] mb-3" />
      <div
        className="font-[var(--font-mono)] text-[10px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2"
      >
        CONVOY ASSIGNMENTS
      </div>
      <div
        className="text-xs text-[var(--color-text-muted)] leading-relaxed"
      >
        Convoy and movement assignment history will be displayed here.
        <br />
        Link equipment to convoy manifests from the Transportation page.
      </div>
    </div>
  );
}
