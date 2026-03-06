import { Trash2, Plus, Truck } from 'lucide-react';
import type { VehicleAllocation, EquipmentRecord } from './types';
import { inputStyle, smallBtnStyle, addBtnStyle, labelStyle } from './types';
import { SectionHeader } from './RouteForm';

// ---------------------------------------------------------------------------
// VehicleSection Props
// ---------------------------------------------------------------------------

interface VehicleSectionProps {
  expanded: boolean;
  onToggle: () => void;
  vehicleAllocations: VehicleAllocation[];
  originEquipment: EquipmentRecord[];
  onSetVehicleAllocations: React.Dispatch<React.SetStateAction<VehicleAllocation[]>>;
}

export function VehicleSection({
  expanded,
  onToggle,
  vehicleAllocations,
  originEquipment,
  onSetVehicleAllocations,
}: VehicleSectionProps) {
  return (
    <div>
      <SectionHeader
        title="VEHICLES"
        expanded={expanded}
        onToggle={onToggle}
        count={vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0)}
      />
      {expanded && (
        <div className="pt-2">
          {vehicleAllocations.map((v, idx) => (
            <div
              key={idx}
              className="grid gap-1 items-center mb-1" style={{ gridTemplateColumns: '1fr 60px 80px 24px' }}
            >
              <select
                value={v.type}
                onChange={e => {
                  const eq = originEquipment.find(eq => eq.type === e.target.value);
                  const next = [...vehicleAllocations];
                  next[idx] = {
                    ...next[idx],
                    type: e.target.value,
                    tamcn: eq?.tamcn || v.tamcn,
                    available: eq?.missionCapable || 0,
                  };
                  onSetVehicleAllocations(next);
                }}
                className="text-[10px]"
              >
                <option value="">-- Select --</option>
                {originEquipment
                  .filter(
                    eq =>
                      eq.type.includes('HMMWV') ||
                      eq.type.includes('MTVR') ||
                      eq.type.includes('JLTV') ||
                      eq.type.includes('Growler') ||
                      eq.type.includes('LAV'),
                  )
                  .map(eq => (
                    <option key={eq.id} value={eq.type}>
                      {eq.type} ({eq.missionCapable} MC / {eq.onHand} OH)
                    </option>
                  ))}
                {v.type && !originEquipment.find(eq => eq.type === v.type) && (
                  <option value={v.type}>{v.type}</option>
                )}
              </select>
              <input
                type="number"
                min={0}
                value={v.quantity}
                onChange={e => {
                  const next = [...vehicleAllocations];
                  next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 0 };
                  onSetVehicleAllocations(next);
                }}
                placeholder="Qty"
                className="text-[10px]"
              />
              <span
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
              >
                {v.available} MC AVAIL
              </span>
              <button
                onClick={() =>
                  onSetVehicleAllocations(prev => prev.filter((_, i) => i !== idx))
                }
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onSetVehicleAllocations(prev => [
                ...prev,
                { type: '', tamcn: '', quantity: 0, available: 0 },
              ])
            }
            style={addBtnStyle}
          >
            <Plus size={11} /> ADD VEHICLE
          </button>
          <div
            className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1"
          >
            <Truck size={10} className="align-middle mr-1" />
            TOTAL: {vehicleAllocations.reduce((sum, v) => sum + v.quantity, 0)} VEHICLES
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailsSection Props
// ---------------------------------------------------------------------------

interface DetailsSectionProps {
  expanded: boolean;
  onToggle: () => void;
  priority: string;
  avgSpeed: number;
  departureTime: string;
  notes: string;
  onSetPriority: (v: string) => void;
  onSetAvgSpeed: (v: number) => void;
  onSetDepartureTime: (v: string) => void;
  onSetNotes: (v: string) => void;
}

export function DetailsSection({
  expanded,
  onToggle,
  priority,
  avgSpeed,
  departureTime,
  notes,
  onSetPriority,
  onSetAvgSpeed,
  onSetDepartureTime,
  onSetNotes,
}: DetailsSectionProps) {
  return (
    <div>
      <SectionHeader title="DETAILS" expanded={expanded} onToggle={onToggle} />
      {expanded && (
        <div className="pt-2">
          {/* Priority */}
          <div className="mb-2">
            <div style={labelStyle}>PRIORITY</div>
            <select
              value={priority}
              onChange={e => onSetPriority(e.target.value)}
              style={inputStyle}
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="URGENT">URGENT</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
            </select>
          </div>

          {/* Avg Speed & Departure */}
          <div className="grid gap-2 mb-2 grid-cols-2">
            <div>
              <div style={labelStyle}>AVG SPEED (KPH)</div>
              <input
                type="number"
                min={1}
                value={avgSpeed}
                onChange={e => onSetAvgSpeed(parseInt(e.target.value) || 40)}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>DEPARTURE TIME</div>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={e => onSetDepartureTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={labelStyle}>NOTES</div>
            <textarea
              value={notes}
              onChange={e => onSetNotes(e.target.value)}
              placeholder="Additional movement notes..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
