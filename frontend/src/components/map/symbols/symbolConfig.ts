// MIL-STD-2525 symbol type mappings

export const ECHELON_SIDC: Record<string, string> = {
  MEF: 'SFGPU------G',
  DIV: 'SFGPU------F',
  DIVISION: 'SFGPU------F',
  REGT: 'SFGPU------E',
  REGIMENT: 'SFGPU------E',
  BN: 'SFGPU------D',
  BATTALION: 'SFGPU------D',
  CO: 'SFGPU------C',
  COMPANY: 'SFGPU------C',
};

export const SUPPLY_POINT_SIDC: Record<string, string> = {
  LOG_BASE: 'SFGPUSL----A',
  SUPPLY_POINT: 'SFGPUSS----A',
  FARP: 'SFGPUSF----A',
  LZ: 'SFGPUSLA---A',
  AMMO_SUPPLY_POINT: 'SFGPUSA----A',
  WATER_POINT: 'SFGPUSW----A',
  MAINTENANCE_COLLECTION_POINT: 'SFGPUSM----A',
  BEACH: 'SFGPUSB----A',
  PORT: 'SFGPUSB----A',
};

export function getStatusColor(status: string): string {
  switch (status) {
    case 'GREEN':
      return '#40c057';
    case 'AMBER':
      return '#fab005';
    case 'RED':
      return '#ff6b6b';
    default:
      return '#868e96';
  }
}
