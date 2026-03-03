import { SupplyClass, Echelon, SupplyStatus } from './types';

export const SUPPLY_CLASS_NAMES: Record<string, string> = {
  [SupplyClass.I]: 'Class I - Subsistence',
  [SupplyClass.II]: 'Class II - Clothing & Equipment',
  [SupplyClass.III]: 'Class III - POL (Bulk)',
  [SupplyClass.IIIA]: 'Class IIIA - POL (Packaged)',
  [SupplyClass.IV]: 'Class IV - Construction',
  [SupplyClass.V]: 'Class V - Ammunition',
  [SupplyClass.VI]: 'Class VI - Personal Demand',
  [SupplyClass.VII]: 'Class VII - Major End Items',
  [SupplyClass.VIII]: 'Class VIII - Medical',
  [SupplyClass.IX]: 'Class IX - Repair Parts',
  [SupplyClass.X]: 'Class X - Non-military',
};

export const SUPPLY_CLASS_SHORT: Record<string, string> = {
  [SupplyClass.I]: 'CL I',
  [SupplyClass.II]: 'CL II',
  [SupplyClass.III]: 'CL III',
  [SupplyClass.IIIA]: 'CL IIIA',
  [SupplyClass.IV]: 'CL IV',
  [SupplyClass.V]: 'CL V',
  [SupplyClass.VI]: 'CL VI',
  [SupplyClass.VII]: 'CL VII',
  [SupplyClass.VIII]: 'CL VIII',
  [SupplyClass.IX]: 'CL IX',
  [SupplyClass.X]: 'CL X',
};

export const SUPPLY_CLASS_DESCRIPTIONS: Record<string, string> = {
  [SupplyClass.I]: 'Food, rations, water',
  [SupplyClass.II]: 'Clothing, tools, hand tools, admin supplies',
  [SupplyClass.III]: 'Petroleum, oils, lubricants (bulk)',
  [SupplyClass.IIIA]: 'Petroleum, oils, lubricants (packaged)',
  [SupplyClass.IV]: 'Construction materials, barrier materials',
  [SupplyClass.V]: 'Ammunition of all types',
  [SupplyClass.VI]: 'Personal demand items',
  [SupplyClass.VII]: 'Major end items (vehicles, aircraft)',
  [SupplyClass.VIII]: 'Medical materiel',
  [SupplyClass.IX]: 'Repair parts and components',
  [SupplyClass.X]: 'Non-military programs',
};

export const STATUS_COLORS: Record<string, string> = {
  [SupplyStatus.GREEN]: 'var(--color-success)',
  [SupplyStatus.AMBER]: 'var(--color-warning)',
  [SupplyStatus.RED]: 'var(--color-danger)',
  BLACK: '#1a1a1a',
};

export const STATUS_BG_COLORS: Record<string, string> = {
  [SupplyStatus.GREEN]: 'rgba(64, 192, 87, 0.1)',
  [SupplyStatus.AMBER]: 'rgba(250, 176, 5, 0.1)',
  [SupplyStatus.RED]: 'rgba(255, 107, 107, 0.1)',
  BLACK: 'rgba(0, 0, 0, 0.3)',
};

export const ECHELON_NAMES: Record<string, string> = {
  [Echelon.MEF]: 'Marine Expeditionary Force',
  [Echelon.DIVISION]: 'Division',
  [Echelon.REGIMENT]: 'Regiment',
  [Echelon.BATTALION]: 'Battalion',
  [Echelon.COMPANY]: 'Company',
  [Echelon.PLATOON]: 'Platoon',
};

export const ECHELON_ABBREVIATIONS: Record<string, string> = {
  [Echelon.MEF]: 'MEF',
  [Echelon.DIVISION]: 'DIV',
  [Echelon.REGIMENT]: 'RGT',
  [Echelon.BATTALION]: 'BN',
  [Echelon.COMPANY]: 'CO',
  [Echelon.PLATOON]: 'PLT',
};

export const TIME_RANGES = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
] as const;

export const READINESS_THRESHOLDS = {
  GREEN: 90,
  AMBER: 75,
  RED: 0,
} as const;

export const DOS_THRESHOLDS = {
  GREEN: 7,
  AMBER: 3,
  RED: 0,
} as const;
