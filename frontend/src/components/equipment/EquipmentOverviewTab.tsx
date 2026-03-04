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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          fontSize: 12,
          color: 'var(--color-text-bright)',
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function EquipmentOverviewTab({ equipment, currentDriver }: EquipmentOverviewTabProps) {
  const statusColor = getItemStatusColor(equipment.status);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Left Column — Equipment Details */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: 16,
        }}
      >
        {/* Status Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            marginBottom: 16,
            backgroundColor: `${statusColor}10`,
            border: `1px solid ${statusColor}40`,
            borderRadius: 'var(--radius)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              letterSpacing: '1px',
            }}
          >
            {equipment.status}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginLeft: 4,
            }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Current Driver */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 12,
            }}
          >
            CURRENT DRIVER
          </div>
          {currentDriver ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                }}
              >
                <User size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text-bright)',
                    fontWeight: 600,
                  }}
                >
                  {currentDriver.personnelName || currentDriver.personnelId}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {currentDriver.isPrimary ? 'PRIMARY' : 'A-DRIVER'} | Assigned{' '}
                  {formatDate(currentDriver.assignedAt, 'dd MMM yyyy')}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success)',
                  marginLeft: 'auto',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              No driver currently assigned
            </div>
          )}
        </div>

        {/* Notes */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 12,
            }}
          >
            NOTES
          </div>
          <div
            style={{
              fontSize: 12,
              color: equipment.notes ? 'var(--color-text)' : 'var(--color-text-muted)',
              lineHeight: 1.6,
              fontStyle: equipment.notes ? 'normal' : 'italic',
            }}
          >
            {equipment.notes || 'No notes for this equipment.'}
          </div>
        </div>

        {/* Created */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 8,
            }}
          >
            RECORD INFO
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Created: {formatDate(equipment.createdAt, 'dd MMM yyyy')}</span>
            <span>Updated: {formatDate(equipment.updatedAt, 'dd MMM yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
