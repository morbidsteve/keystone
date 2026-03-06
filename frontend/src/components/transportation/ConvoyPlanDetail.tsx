// =============================================================================
// ConvoyPlanDetail — Full detail view for a selected convoy plan
// =============================================================================

import { useState } from 'react';
import { ArrowLeft, Clock, MapPin, Radio, ShieldAlert, Cross, Users } from 'lucide-react';
import type { ConvoyPlan, ConvoyPlanStatus, RiskAssessmentLevel, ManifestEntry, LocationInventoryItem } from '@/lib/types';
import Card from '@/components/ui/Card';
import OriginInventoryTable from '@/components/transportation/OriginInventoryTable';
import ManifestSummary from '@/components/transportation/ManifestSummary';
import AddToManifestModal from '@/components/transportation/AddToManifestModal';
import PersonnelAssignmentModal from '@/components/transportation/PersonnelAssignmentModal';
import ConvoyManifestView from '@/components/transportation/ConvoyManifestView';

// ---------------------------------------------------------------------------
// Badge helpers (duplicated for isolation; could be shared in a util)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<ConvoyPlanStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
  APPROVED: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.4)' },
  EXECUTING: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
  COMPLETE: { bg: 'rgba(148, 163, 184, 0.10)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' },
  CANCELED: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
};

const RISK_COLORS: Record<RiskAssessmentLevel, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' },
  MEDIUM: { bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15', border: 'rgba(250, 204, 21, 0.4)' },
  HIGH: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.4)' },
  EXTREME: { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.4)' },
};

function Badge({ label, colorSet }: { label: string; colorSet: { bg: string; text: string; border: string } }) {
  return (
    <span
      className="inline-block py-[3px] px-2.5 rounded-[2px] font-[var(--font-mono)] text-[10px] font-bold tracking-[0.5px]" style={{ color: colorSet.text, backgroundColor: colorSet.bg, border: `1px solid ${colorSet.border}` }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvoyPlanDetailProps {
  plan: ConvoyPlan;
  onBack: () => void;
  onOpenMarchTable: (planId: number) => void;
  onApprovePlan: (planId: number) => void;
  onExecutePlan: (planId: number) => void;
  onCancelPlan: (planId: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConvoyPlanDetail({
  plan,
  onBack,
  onOpenMarchTable,
  onApprovePlan,
  onExecutePlan,
  onCancelPlan,
}: ConvoyPlanDetailProps) {
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<LocationInventoryItem | null>(null);
  const [editingEntry, setEditingEntry] = useState<ManifestEntry | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignVehicle, setAssignVehicle] = useState<{id: number; tamcn: string; vehicleType: string; bumperNumber: string} | null>(null);

  const handleAddToManifest = (entry: ManifestEntry) => {
    setManifest(prev => {
      const existing = prev.findIndex(e => e.item_id === entry.item_id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
    setSelectedItem(null);
    setEditingEntry(null);
  };

  const handleRemoveFromManifest = (itemId: string) => {
    setManifest(prev => prev.filter(e => e.item_id !== itemId));
  };

  const handleEditManifestEntry = (entry: ManifestEntry) => {
    setEditingEntry(entry);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
    marginBottom: 2,
  };

  const fieldValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    lineHeight: 1.4,
  };

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    backgroundColor: 'var(--color-bg-elevated)',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 py-1 px-2 font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-text-muted)] bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer"
          >
            <ArrowLeft size={12} /> BACK
          </button>
          <span
            className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)] tracking-[1px]"
          >
            {plan.name}
          </span>
          <Badge label={plan.status} colorSet={STATUS_COLORS[plan.status]} />
          {plan.risk_assessment_level && (
            <Badge label={`RISK: ${plan.risk_assessment_level}`} colorSet={RISK_COLORS[plan.risk_assessment_level]} />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onOpenMarchTable(plan.id)}
            className="py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
          >
            MARCH TABLE
          </button>
          <button
            onClick={() => {
              setAssignVehicle({ id: 1, tamcn: 'D1100', vehicleType: 'HMMWV M1151', bumperNumber: 'S1-V1' });
              setAssignModalOpen(true);
            }}
            className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[var(--color-accent)] bg-[rgba(77,171,247,0.1)] border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer"
          >
            <Users size={11} /> ASSIGN CREW
          </button>
          {plan.status === 'DRAFT' && (
            <button
              onClick={() => onApprovePlan(plan.id)}
              className="py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold text-[#60a5fa] bg-[rgba(96,165,250,0.1)] rounded-[var(--radius)] cursor-pointer" style={{ border: '1px solid rgba(96, 165, 250, 0.4)' }}
            >
              APPROVE
            </button>
          )}
          {plan.status === 'APPROVED' && (
            <button
              onClick={() => onExecutePlan(plan.id)}
              className="py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold text-[#4ade80] bg-[rgba(74,222,128,0.1)] rounded-[var(--radius)] cursor-pointer border border-[rgba(74,222,128,0.4)]"
            >
              EXECUTE
            </button>
          )}
          {(plan.status === 'DRAFT' || plan.status === 'APPROVED') && (
            <button
              onClick={() => onCancelPlan(plan.id)}
              className="py-1.5 px-3 font-[var(--font-mono)] text-[9px] font-semibold text-[#f87171] bg-[rgba(248,113,113,0.1)] rounded-[var(--radius)] cursor-pointer border border-[rgba(248,113,113,0.4)]"
            >
              CANCEL
            </button>
          )}
        </div>
      </div>

      {/* Route Info */}
      <Card title="ROUTE INFORMATION">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div style={fieldLabelStyle}>ROUTE NAME</div>
            <div style={fieldValueStyle}>{plan.route_name ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>MCN</div>
            <div style={fieldValueStyle}>{plan.movement_credit_number ?? 'Not assigned'}</div>
          </div>
          <div className="col-span-full">
            <div style={fieldLabelStyle}>DESCRIPTION</div>
            <div style={fieldValueStyle}>{plan.route_description ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>PRIMARY ROUTE</div>
            <div style={fieldValueStyle}>{plan.route_primary ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>ALTERNATE ROUTE</div>
            <div style={fieldValueStyle}>{plan.route_alternate ?? '--'}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>TOTAL DISTANCE</div>
            <div className="text-[var(--color-text-bright)]">
              {plan.total_distance_km ? `${plan.total_distance_km} km` : '--'}
            </div>
          </div>
          <div>
            <div style={fieldLabelStyle}>ESTIMATED DURATION</div>
            <div className="text-[var(--color-text-bright)]">
              {plan.estimated_duration_hours ? `${plan.estimated_duration_hours} hours` : '--'}
            </div>
          </div>
        </div>
      </Card>

      {/* Timing Section */}
      <Card title="TIMING">
        <div className="flex gap-0 overflow-auto">
          {[
            { label: 'BRIEF', time: plan.brief_time, icon: Clock },
            { label: 'REHEARSAL', time: plan.rehearsal_time, icon: MapPin },
            { label: 'DEPARTURE', time: plan.departure_time_planned, icon: Clock },
            { label: 'SP TIME', time: plan.sp_time, icon: MapPin },
            { label: 'RP TIME', time: plan.rp_time, icon: MapPin },
          ].map((item, idx) => (
            <div
              key={item.label}
              className="py-3 px-3.5 text-center" style={{ flex: '1 1 0', borderRight: idx < 4 ? '1px solid var(--color-border)' : 'none' }}
            >
              <item.icon
                size={14}
                className="text-[var(--color-accent)] mb-1.5"
              />
              <div style={fieldLabelStyle}>{item.label}</div>
              <div className="font-semibold">
                {formatDate(item.time)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Serials Table */}
      <Card title="SERIALS">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={headerCellStyle}>Serial #</th>
                <th style={headerCellStyle}>Commander</th>
                <th style={headerCellStyle}>Vehicles</th>
                <th style={headerCellStyle}>PAX</th>
                <th style={headerCellStyle}>March Order</th>
                <th style={headerCellStyle}>Speed (kph)</th>
                <th style={headerCellStyle}>Interval (m)</th>
              </tr>
            </thead>
            <tbody>
              {plan.serials.map((serial) => (
                <tr key={serial.id}>
                  <td className="text-[var(--color-text-bright)]">
                    {serial.serial_number}
                  </td>
                  <td style={cellStyle}>{serial.serial_commander_name ?? '--'}</td>
                  <td style={cellStyle}>{serial.vehicle_count}</td>
                  <td style={cellStyle}>{serial.pax_count}</td>
                  <td style={cellStyle}>{serial.march_order}</td>
                  <td style={cellStyle}>{serial.march_speed_kph}</td>
                  <td style={cellStyle}>{serial.interval_meters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="mt-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
        >
          Total: {plan.serials.reduce((a, s) => a + s.vehicle_count, 0)} vehicles,{' '}
          {plan.serials.reduce((a, s) => a + s.pax_count, 0)} PAX
        </div>
      </Card>

      {/* Manifest */}
      <Card title="MANIFEST">
        <ConvoyManifestView movementId={plan.movement_id ?? 0} />
      </Card>

      {/* Contingencies */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <div style={sectionLabelStyle}>
            <Radio size={12} /> COMM PLAN
          </div>
          <div style={fieldValueStyle}>{plan.comm_plan ?? 'No comm plan specified'}</div>
        </Card>
        <Card>
          <div style={sectionLabelStyle}>
            <ShieldAlert size={12} /> RECOVERY PLAN
          </div>
          <div style={fieldValueStyle}>{plan.recovery_plan ?? 'No recovery plan specified'}</div>
        </Card>
        <Card>
          <div style={sectionLabelStyle}>
            <Cross size={12} /> MEDEVAC PLAN
          </div>
          <div style={fieldValueStyle}>{plan.medevac_plan ?? 'No MEDEVAC plan specified'}</div>
        </Card>
      </div>

      {/* Origin Inventory */}
      <Card title="ORIGIN INVENTORY">
        <OriginInventoryTable
          location={plan.route_primary ?? 'default'}
          onItemClick={(item) => setSelectedItem(item)}
        />
      </Card>

      {/* Cargo Manifest */}
      <Card title="CARGO MANIFEST">
        <ManifestSummary
          entries={manifest}
          onEdit={handleEditManifestEntry}
          onRemove={handleRemoveFromManifest}
        />
      </Card>

      {/* Add to Manifest Modal */}
      <AddToManifestModal
        isOpen={selectedItem != null || editingEntry != null}
        item={selectedItem ? selectedItem : editingEntry ? {
          item_id: editingEntry.item_id,
          item_type: 'equipment',
          nomenclature: editingEntry.nomenclature,
          category: editingEntry.category,
          available_qty: 999,
          weight_lbs: editingEntry.weight_lbs ? editingEntry.weight_lbs / editingEntry.quantity : undefined,
          status: 'SERVICEABLE',
        } : null}
        existingEntry={editingEntry}
        onClose={() => { setSelectedItem(null); setEditingEntry(null); }}
        onAdd={handleAddToManifest}
      />

      {/* Personnel Assignment Modal */}
      <PersonnelAssignmentModal
        isOpen={assignModalOpen && assignVehicle != null}
        onClose={() => { setAssignModalOpen(false); setAssignVehicle(null); }}
        vehicleId={assignVehicle?.id ?? 0}
        vehicleTamcn={assignVehicle?.tamcn ?? 'D1100'}
        vehicleType={assignVehicle?.vehicleType ?? 'HMMWV'}
        bumperNumber={assignVehicle?.bumperNumber ?? ''}
        movementId={plan.movement_id ?? 0}
        onSave={(assignments) => {
          console.log('Personnel assignments saved:', assignments);
        }}
      />
    </div>
  );
}
