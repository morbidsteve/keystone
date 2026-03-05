import L from 'leaflet';

export type VehicleType = 'HMMWV' | 'MTVR' | 'JLTV' | 'LVSR' | 'LAV' | 'ACV' | 'AAV';
export type VehicleStatus = 'FMC' | 'NMC' | 'BROKEN_DOWN' | 'MOVING' | 'STOPPED';

interface VehicleIconOptions {
  type: VehicleType | string;
  status: VehicleStatus;
  heading: number;
  bumperNumber: string;
  isLead?: boolean;
}

const VEHICLE_SVGS: Record<string, string> = {
  HMMWV:
    '<path d="M8 4h16l2 8v6H6v-6l2-8z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><circle cx="10" cy="16" r="2" fill="#fff" opacity="0.6"/><circle cx="22" cy="16" r="2" fill="#fff" opacity="0.6"/>',
  MTVR:
    '<path d="M6 3h18l3 10v8H3v-8l3-10z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><circle cx="9" cy="18" r="2.5" fill="#fff" opacity="0.6"/><circle cx="23" cy="18" r="2.5" fill="#fff" opacity="0.6"/><rect x="6" y="5" width="18" height="6" rx="1" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.4" opacity="0.7"/>',
  JLTV:
    '<path d="M7 5h18l2 7v7H5v-7l2-7z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><circle cx="10" cy="17" r="2" fill="#fff" opacity="0.6"/><circle cx="22" cy="17" r="2" fill="#fff" opacity="0.6"/><path d="M12 5h8v4h-8z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.4" opacity="0.8"/>',
  LVSR:
    '<path d="M4 4h22l3 10v8H2v-8l2-10z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><circle cx="8" cy="18" r="2.5" fill="#fff" opacity="0.6"/><circle cx="16" cy="18" r="2.5" fill="#fff" opacity="0.6"/><circle cx="24" cy="18" r="2.5" fill="#fff" opacity="0.6"/>',
  LAV:
    '<ellipse cx="16" cy="12" rx="13" ry="8" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><circle cx="8" cy="16" r="2" fill="#fff" opacity="0.6"/><circle cx="24" cy="16" r="2" fill="#fff" opacity="0.6"/><rect x="14" y="4" width="4" height="6" rx="1" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.5"/>',
  ACV:
    '<path d="M6 8h20l2 6v6H4v-6l2-6z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><path d="M4 14l2-2h20l2 2" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.5"/><circle cx="10" cy="17" r="2" fill="#fff" opacity="0.6"/><circle cx="22" cy="17" r="2" fill="#fff" opacity="0.6"/>',
  AAV:
    '<path d="M5 7h22l2 7v6H3v-6l2-7z" fill="STATUS_COLOR" stroke="#fff" stroke-width="0.8"/><path d="M3 14l2-2h22l2 2" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.5"/><circle cx="9" cy="17" r="2.5" fill="#fff" opacity="0.6"/><circle cx="23" cy="17" r="2.5" fill="#fff" opacity="0.6"/>',
};

function getStatusColor(status: VehicleStatus | string): string {
  switch (status) {
    case 'FMC':
    case 'MOVING':
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

export function createVehicleIcon(options: VehicleIconOptions): L.DivIcon {
  const { type, status, heading, bumperNumber, isLead } = options;
  const color = getStatusColor(status);
  const svgTemplate = VEHICLE_SVGS[type] || VEHICLE_SVGS.HMMWV;
  const svgContent = svgTemplate.split('STATUS_COLOR').join(color);

  const leadGlow = isLead ? `box-shadow: 0 0 8px 2px ${color}80;` : '';

  return L.divIcon({
    className: 'convoy-vehicle-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 32px;
          height: 24px;
          transform: rotate(${heading}deg);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          ${leadGlow}
          border-radius: 3px;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 22" width="32" height="22">
            ${svgContent}
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 7px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px;
        ">
          ${bumperNumber}
        </div>
      </div>
    `,
  });
}
