import type {
  CanonicalFieldGroup,
  CanonicalField,
  FieldMappingConfig,
  MappingPreviewRow,
  UploadPreviewResponse,
  AutoDetectResponse,
} from '@/api/schemaMapping';

// ---------------------------------------------------------------------------
// Types local to SchemaMapper
// ---------------------------------------------------------------------------

export interface ColumnMapping {
  sourceColumn: string;
  targetEntity: string;
  targetField: string;
  targetDisplayName: string;
  transform: string;
}

export type WizardStep = 'upload' | 'map' | 'preview' | 'save';

// ---------------------------------------------------------------------------
// Transform options
// ---------------------------------------------------------------------------

export const TRANSFORM_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'datetime', label: 'Date/Time' },
  { value: 'regex', label: 'Regex Extract' },
  { value: 'enum', label: 'Enum' },
];

export const SOURCE_TYPE_OPTIONS = ['EXCEL', 'CSV', 'MIRC', 'TAK', 'CUSTOM'];

// ---------------------------------------------------------------------------
// Shared Styles
// ---------------------------------------------------------------------------

export const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
};

export const tdStyle: React.CSSProperties = {
  padding: '6px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-bright)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

export const primaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 20px',
  backgroundColor: 'var(--color-accent)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: 'var(--color-bg)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '1.5px',
  cursor: 'pointer',
};

export const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '1px',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// Demo data (used as fallback when API is unavailable)
// ---------------------------------------------------------------------------

export const DEMO_CANONICAL_GROUPS: CanonicalFieldGroup[] = [
  {
    entityName: 'supplyStatus',
    entityGroup: 'Supply',
    fields: [
      { id: 1, entityName: 'supplyStatus', fieldName: 'unitId', displayName: 'Unit ID', dataType: 'string', isRequired: true, enumValues: null, description: 'Unit identifier', entityGroup: 'Supply' },
      { id: 2, entityName: 'supplyStatus', fieldName: 'supplyClass', displayName: 'Supply Class', dataType: 'enum', isRequired: true, enumValues: ['I','II','III','IV','V','VI','VII','VIII','IX','X'], description: null, entityGroup: 'Supply' },
      { id: 3, entityName: 'supplyStatus', fieldName: 'item_description', displayName: 'Item Description', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Supply' },
      { id: 4, entityName: 'supplyStatus', fieldName: 'on_hand_qty', displayName: 'On Hand Quantity', dataType: 'float', isRequired: true, enumValues: null, description: null, entityGroup: 'Supply' },
      { id: 5, entityName: 'supplyStatus', fieldName: 'required_qty', displayName: 'Required Quantity', dataType: 'float', isRequired: true, enumValues: null, description: null, entityGroup: 'Supply' },
      { id: 6, entityName: 'supplyStatus', fieldName: 'dos', displayName: 'Days of Supply', dataType: 'float', isRequired: true, enumValues: null, description: null, entityGroup: 'Supply' },
      { id: 7, entityName: 'supplyStatus', fieldName: 'consumption_rate', displayName: 'Consumption Rate', dataType: 'float', isRequired: false, enumValues: null, description: null, entityGroup: 'Supply' },
      { id: 8, entityName: 'supplyStatus', fieldName: 'status', displayName: 'Status', dataType: 'enum', isRequired: false, enumValues: ['GREEN','AMBER','RED','BLACK'], description: null, entityGroup: 'Supply' },
    ],
  },
  {
    entityName: 'equipment_status',
    entityGroup: 'Equipment',
    fields: [
      { id: 9, entityName: 'equipment_status', fieldName: 'unitId', displayName: 'Unit ID', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 10, entityName: 'equipment_status', fieldName: 'tamcn', displayName: 'TAMCN', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 11, entityName: 'equipment_status', fieldName: 'nomenclature', displayName: 'Nomenclature', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 12, entityName: 'equipment_status', fieldName: 'total_possessed', displayName: 'Total Possessed', dataType: 'integer', isRequired: true, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 13, entityName: 'equipment_status', fieldName: 'missionCapable', displayName: 'Mission Capable', dataType: 'integer', isRequired: true, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 14, entityName: 'equipment_status', fieldName: 'nmcm', displayName: 'NMCM', dataType: 'integer', isRequired: false, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 15, entityName: 'equipment_status', fieldName: 'nmcs', displayName: 'NMCS', dataType: 'integer', isRequired: false, enumValues: null, description: null, entityGroup: 'Equipment' },
      { id: 16, entityName: 'equipment_status', fieldName: 'readinessPct', displayName: 'Readiness %', dataType: 'float', isRequired: false, enumValues: null, description: null, entityGroup: 'Equipment' },
    ],
  },
  {
    entityName: 'movement',
    entityGroup: 'Movement',
    fields: [
      { id: 17, entityName: 'movement', fieldName: 'unitId', displayName: 'Unit ID', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 18, entityName: 'movement', fieldName: 'convoyId', displayName: 'Convoy ID', dataType: 'string', isRequired: false, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 19, entityName: 'movement', fieldName: 'origin', displayName: 'Origin', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 20, entityName: 'movement', fieldName: 'destination', displayName: 'Destination', dataType: 'string', isRequired: true, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 21, entityName: 'movement', fieldName: 'departureTime', displayName: 'Departure Time', dataType: 'datetime', isRequired: false, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 22, entityName: 'movement', fieldName: 'eta', displayName: 'ETA', dataType: 'datetime', isRequired: false, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 23, entityName: 'movement', fieldName: 'vehicleCount', displayName: 'Vehicle Count', dataType: 'integer', isRequired: false, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 24, entityName: 'movement', fieldName: 'cargo_description', displayName: 'Cargo Description', dataType: 'string', isRequired: false, enumValues: null, description: null, entityGroup: 'Movement' },
      { id: 25, entityName: 'movement', fieldName: 'status', displayName: 'Status', dataType: 'enum', isRequired: false, enumValues: ['PLANNED','EN_ROUTE','COMPLETE','DELAYED','CANCELLED'], description: null, entityGroup: 'Movement' },
    ],
  },
];

// Re-export API types for convenience
export type { CanonicalFieldGroup, CanonicalField, FieldMappingConfig, MappingPreviewRow, UploadPreviewResponse, AutoDetectResponse };
