import type { ConvoyVehicleDetail } from '@/api/map';

interface VehiclePopupContentProps {
  vehicle: ConvoyVehicleDetail;
  convoyId: string;
  convoyName: string;
}

function statusColor(status: string): string {
  switch (status) {
    case 'MOVING':
    case 'FMC':
      return '#22c55e';
    case 'STOPPED':
      return '#eab308';
    case 'NMC':
    case 'BROKEN_DOWN':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function roleColor(role: string): string {
  switch (role) {
    case 'DRIVER':
      return '#4dabf7';
    case 'TC':
      return '#a78bfa';
    case 'GUNNER':
      return '#ef4444';
    case 'PAX':
      return '#94a3b8';
    default:
      return '#94a3b8';
  }
}

export default function VehiclePopupContent({
  vehicle,
  convoyName,
}: VehiclePopupContentProps) {
  const totalCargoWeight = vehicle.cargo.reduce((sum, c) => sum + c.total_weight_kg, 0);

  return (
    <div
      className="py-2.5 px-3.5 text-[11px] leading-normal text-[#e2e8f0] min-w-[260px] font-mono"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-2 pb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div>
          <div className="font-bold text-[13px] text-[#f1f5f9] tracking-[0.5px]">
            {vehicle.call_sign}
          </div>
          <div className="text-[9px] text-[#94a3b8] tracking-[1px] mt-px">
            {convoyName}
          </div>
        </div>
        <div
          className="py-0.5 px-2 rounded-[3px] text-[9px] font-bold tracking-[1px] text-[#000]" style={{ backgroundColor: statusColor(vehicle.status) }}
        >
          {vehicle.status}
        </div>
      </div>

      {/* Vehicle Info Grid */}
      <div
        className="grid mb-2 text-[10px]" style={{ gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}
      >
        <div>
          <span className="text-[#64748b]">TYPE </span>
          <span className="text-[#e2e8f0] font-semibold">{vehicle.vehicle_type}</span>
        </div>
        <div>
          <span className="text-[#64748b]">TAMCN </span>
          <span className="text-[#e2e8f0] font-semibold">{vehicle.tamcn}</span>
        </div>
        <div>
          <span className="text-[#64748b]">BUMPER </span>
          <span className="text-[#e2e8f0] font-semibold">{vehicle.bumper_number}</span>
        </div>
        <div>
          <span className="text-[#64748b]">SPD </span>
          <span className="text-[#e2e8f0] font-semibold">{vehicle.speed_kph} KPH</span>
        </div>
        <div>
          <span className="text-[#64748b]">HDG </span>
          <span className="text-[#e2e8f0] font-semibold">{vehicle.heading}&deg;</span>
        </div>
      </div>

      {/* Crew Section */}
      <div className="mb-2">
        <div
          className="text-[9px] font-bold tracking-[1.5px] text-[#94a3b8] mb-1 uppercase"
        >
          CREW ({vehicle.crew.length})
        </div>
        {vehicle.crew.length > 0 ? (
          <div
            className="bg-[rgba(255,255,255,0.03)] rounded-[4px] py-1 px-1.5"
          >
            {vehicle.crew.map((person) => (
              <div
                key={person.personnel_id}
                className="flex items-center justify-between text-[10px] py-0.5 px-0"
              >
                <span>
                  <span className="text-[#94a3b8]">{person.rank}</span>{' '}
                  <span className="text-[#e2e8f0]">{person.name}</span>
                </span>
                <span
                  className="text-[8px] font-bold tracking-[0.5px] py-px px-1 rounded-[2px]" style={{ color: roleColor(person.role), backgroundColor: `${roleColor(person.role)}15` }}
                >
                  {person.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-[#64748b] italic">No crew assigned</div>
        )}
      </div>

      {/* Cargo Section */}
      <div>
        <div
          className="text-[9px] font-bold tracking-[1.5px] text-[#94a3b8] mb-1 uppercase"
        >
          CARGO ({vehicle.cargo.length} items)
        </div>
        {vehicle.cargo.length > 0 ? (
          <div
            className="bg-[rgba(255,255,255,0.03)] rounded-[4px] py-1 px-1.5"
          >
            {vehicle.cargo.map((item) => (
              <div
                key={item.item_id}
                className="flex justify-between text-[10px] py-0.5 px-0"
              >
                <span>
                  {item.item_name}{' '}
                  <span className="text-[#64748b] text-[9px]">CL {item.supply_class}</span>
                </span>
                <span className="text-[#4dabf7] font-semibold">
                  {item.quantity} {item.uom}
                </span>
              </div>
            ))}
            <div
              className="mt-1 pt-1 text-[10px] font-bold text-[#e2e8f0]" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' as const }}
            >
              {totalCargoWeight.toLocaleString()} kg total
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-[#64748b] italic">No cargo loaded</div>
        )}
      </div>
    </div>
  );
}
