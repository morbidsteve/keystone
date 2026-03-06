import { Truck, Hash, MapPin, FileText, Gauge, User, Shield } from 'lucide-react';
import type { EquipmentItem, EquipmentDriverAssignment } from '@/lib/types';
import { EquipmentItemStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface EquipmentOverviewTabProps {
  equipment: EquipmentItem;
  currentDriver?: EquipmentDriverAssignment;
}

function getItemStatusColor(status: EquipmentItemStatus): string {
  switch (status) {
    case EquipmentItemStatus.FMC:
      return 'var(--color-success)';
    case EquipmentItemStatus.NMC_M:
      return 'var(--color-warning)';
    case EquipmentItemStatus.NMC_S:
      return 'var(--color-danger)';
    case EquipmentItemStatus.DEADLINED:
      return 'var(--color-danger)';
    case EquipmentItemStatus.ADMIN:
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-muted)';
  }
}

function getStatusLabel(status: EquipmentItemStatus): string {
  switch (status) {
    case EquipmentItemStatus.FMC:
      return 'FULLY MISSION CAPABLE';
    case EquipmentItemStatus.NMC_M:
      return 'NOT MISSION CAPABLE — MAINTENANCE';
    case EquipmentItemStatus.NMC_S:
      return 'NOT MISSION CAPABLE — SUPPLY';
    case EquipmentItemStatus.DEADLINED:
      return 'DEADLINED';
    case EquipmentItemStatus.ADMIN:
      return 'ADMINISTRATIVE';
    default:
      return status;
  }
}

function DetailRow({ icon, label, value, mono = true }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-0 border-b border-b-[var(--color-border)]"
    >
      <span className="text-[var(--color-text-muted)] shrink-0">{icon}</span>
      <span
        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] uppercase tracking-[1px] min-w-[120px] shrink-0"
      >
        {label}
      </span>
      <span
        className="text-xs text-[var(--color-text-bright)] font-medium" style={{ fontFamily: mono ? 'var(--font-mono)' : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

export default function EquipmentOverviewTab({ equipment, currentDriver }: EquipmentOverviewTabProps) {
  const statusColor = getItemStatusColor(equipment.status);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left Column — Equipment Details */}
      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4"
      >
        {/* Status Banner */}
        <div
          className="flex items-center gap-2.5 py-3 px-4 mb-4 rounded-[var(--radius)]" style={{ backgroundColor: `${statusColor}10`, border: `1px solid ${statusColor}40` }}
        >
          <span
            className="inline-block w-[10px] h-[10px] shrink-0" style={{ borderRadius: '50%', backgroundColor: statusColor }}
          />
          <span
            className="font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px]" style={{ color: statusColor }}
          >
            {equipment.status}
          </span>
          <span
            className="text-[10px] text-[var(--color-text-muted)] ml-1"
          >
            {getStatusLabel(equipment.status)}
          </span>
        </div>

        <DetailRow icon={<Truck size={14} />} label="Type" value={equipment.equipmentType} />
        <DetailRow icon={<FileText size={14} />} label="Nomenclature" value={equipment.nomenclature} />
        <DetailRow icon={<Hash size={14} />} label="TAMCN" value={equipment.tamcn} />
        <DetailRow icon={<Hash size={14} />} label="Bumper #" value={equipment.bumperNumber} />
        <DetailRow icon={<Hash size={14} />} label="Serial #" value={equipment.serialNumber} />
        <DetailRow icon={<Shield size={14} />} label="USMC ID" value={equipment.usmcId} />
        <DetailRow icon={<MapPin size={14} />} label="Unit" value={`${equipment.unitName} (${equipment.unitId})`} />
        {equipment.odometerMiles !== undefined && (
          <DetailRow
            icon={<Gauge size={14} />}
            label="Odometer"
            value={`${equipment.odometerMiles.toLocaleString()} mi`}
          />
        )}
        <DetailRow
          icon={<FileText size={14} />}
          label="Last Updated"
          value={formatDate(equipment.updatedAt)}
        />
      </div>

      {/* Right Column — Driver + Notes */}
      <div className="flex flex-col gap-4">
        {/* Current Driver */}
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4"
        >
          <div
            className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-3"
          >
            CURRENT DRIVER
          </div>
          {currentDriver ? (
            <div className="flex items-center gap-3">
              <div
                className="w-[36px] h-[36px] bg-[var(--color-bg-hover)] flex items-center justify-center border border-[var(--color-border)] rounded-full"
              >
                <User size={16} className="text-[var(--color-text-muted)]" />
              </div>
              <div>
                <div
                  className="font-[var(--font-mono)] text-xs text-[var(--color-text-bright)] font-semibold"
                >
                  {currentDriver.personnelName || currentDriver.personnelId}
                </div>
                <div
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-0.5"
                >
                  {currentDriver.isPrimary ? 'PRIMARY' : 'A-DRIVER'} | Assigned{' '}
                  {formatDate(currentDriver.assignedAt, 'dd MMM yyyy')}
                </div>
              </div>
              <span
                className="inline-block w-[8px] h-[8px] bg-[var(--color-success)]" style={{ borderRadius: '50%', marginLeft: 'auto' }}
              />
            </div>
          ) : (
            <div
              className="text-[11px] text-[var(--color-text-muted)] italic"
            >
              No driver currently assigned
            </div>
          )}
        </div>

        {/* Notes */}
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 flex-1"
        >
          <div
            className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-3"
          >
            NOTES
          </div>
          <div
            className="text-xs leading-relaxed" style={{ color: equipment.notes ? 'var(--color-text)' : 'var(--color-text-muted)', fontStyle: equipment.notes ? 'normal' : 'italic' }}
          >
            {equipment.notes || 'No notes for this equipment.'}
          </div>
        </div>

        {/* Created */}
        <div
          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4"
        >
          <div
            className="font-[var(--font-mono)] text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2"
          >
            RECORD INFO
          </div>
          <div
            className="flex gap-6 font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
          >
            <span>Created: {formatDate(equipment.createdAt, 'dd MMM yyyy')}</span>
            <span>Updated: {formatDate(equipment.updatedAt, 'dd MMM yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
