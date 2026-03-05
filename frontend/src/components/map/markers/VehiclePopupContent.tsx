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
      style={{
        padding: '10px 14px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        lineHeight: 1.5,
        color: '#e2e8f0',
        minWidth: 260,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', letterSpacing: '0.5px' }}>
            {vehicle.call_sign}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '1px', marginTop: 1 }}>
            {convoyName}
          </div>
        </div>
        <div
          style={{
            padding: '2px 8px',
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#000',
            backgroundColor: statusColor(vehicle.status),
          }}
        >
          {vehicle.status}
        </div>
      </div>

      {/* Vehicle Info Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3px 12px',
          marginBottom: 8,
          fontSize: 10,
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>TYPE </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.vehicle_type}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>TAMCN </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.tamcn}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>BUMPER </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.bumper_number}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>SPD </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.speed_kph} KPH</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>HDG </span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{vehicle.heading}&deg;</span>
        </div>
      </div>

      {/* Crew Section */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#94a3b8',
            marginBottom: 4,
            textTransform: 'uppercase' as const,
          }}
        >
          CREW ({vehicle.crew.length})
        </div>
        {vehicle.crew.length > 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
              padding: '4px 6px',
            }}
          >
            {vehicle.crew.map((person) => (
              <div
                key={person.personnel_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  padding: '2px 0',
                }}
              >
                <span>
                  <span style={{ color: '#94a3b8' }}>{person.rank}</span>{' '}
                  <span style={{ color: '#e2e8f0' }}>{person.name}</span>
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: roleColor(person.role),
                    padding: '1px 4px',
                    borderRadius: 2,
                    backgroundColor: `${roleColor(person.role)}15`,
                  }}
                >
                  {person.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>No crew assigned</div>
        )}
      </div>

      {/* Cargo Section */}
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#94a3b8',
            marginBottom: 4,
            textTransform: 'uppercase' as const,
          }}
        >
          CARGO ({vehicle.cargo.length} items)
        </div>
        {vehicle.cargo.length > 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
              padding: '4px 6px',
            }}
          >
            {vehicle.cargo.map((item) => (
              <div
                key={item.item_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  padding: '2px 0',
                }}
              >
                <span>
                  {item.item_name}{' '}
                  <span style={{ color: '#64748b', fontSize: 9 }}>CL {item.supply_class}</span>
                </span>
                <span style={{ color: '#4dabf7', fontWeight: 600 }}>
                  {item.quantity} {item.uom}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 4,
                paddingTop: 4,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 10,
                fontWeight: 700,
                textAlign: 'right' as const,
                color: '#e2e8f0',
              }}
            >
              {totalCargoWeight.toLocaleString()} kg total
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>No cargo loaded</div>
        )}
      </div>
    </div>
  );
}
