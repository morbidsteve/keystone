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
    entity_name: 'supply_status',
    entity_group: 'Supply',
    fields: [
      { id: 1, entity_name: 'supply_status', field_name: 'unit_id', display_name: 'Unit ID', data_type: 'string', is_required: true, enum_values: null, description: 'Unit identifier', entity_group: 'Supply' },
      { id: 2, entity_name: 'supply_status', field_name: 'supply_class', display_name: 'Supply Class', data_type: 'enum', is_required: true, enum_values: ['I','II','III','IV','V','VI','VII','VIII','IX','X'], description: null, entity_group: 'Supply' },
      { id: 3, entity_name: 'supply_status', field_name: 'item_description', display_name: 'Item Description', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Supply' },
      { id: 4, entity_name: 'supply_status', field_name: 'on_hand_qty', display_name: 'On Hand Quantity', data_type: 'float', is_required: true, enum_values: null, description: null, entity_group: 'Supply' },
      { id: 5, entity_name: 'supply_status', field_name: 'required_qty', display_name: 'Required Quantity', data_type: 'float', is_required: true, enum_values: null, description: null, entity_group: 'Supply' },
      { id: 6, entity_name: 'supply_status', field_name: 'dos', display_name: 'Days of Supply', data_type: 'float', is_required: true, enum_values: null, description: null, entity_group: 'Supply' },
      { id: 7, entity_name: 'supply_status', field_name: 'consumption_rate', display_name: 'Consumption Rate', data_type: 'float', is_required: false, enum_values: null, description: null, entity_group: 'Supply' },
      { id: 8, entity_name: 'supply_status', field_name: 'status', display_name: 'Status', data_type: 'enum', is_required: false, enum_values: ['GREEN','AMBER','RED','BLACK'], description: null, entity_group: 'Supply' },
    ],
  },
  {
    entity_name: 'equipment_status',
    entity_group: 'Equipment',
    fields: [
      { id: 9, entity_name: 'equipment_status', field_name: 'unit_id', display_name: 'Unit ID', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 10, entity_name: 'equipment_status', field_name: 'tamcn', display_name: 'TAMCN', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 11, entity_name: 'equipment_status', field_name: 'nomenclature', display_name: 'Nomenclature', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 12, entity_name: 'equipment_status', field_name: 'total_possessed', display_name: 'Total Possessed', data_type: 'integer', is_required: true, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 13, entity_name: 'equipment_status', field_name: 'mission_capable', display_name: 'Mission Capable', data_type: 'integer', is_required: true, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 14, entity_name: 'equipment_status', field_name: 'nmcm', display_name: 'NMCM', data_type: 'integer', is_required: false, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 15, entity_name: 'equipment_status', field_name: 'nmcs', display_name: 'NMCS', data_type: 'integer', is_required: false, enum_values: null, description: null, entity_group: 'Equipment' },
      { id: 16, entity_name: 'equipment_status', field_name: 'readiness_pct', display_name: 'Readiness %', data_type: 'float', is_required: false, enum_values: null, description: null, entity_group: 'Equipment' },
    ],
  },
  {
    entity_name: 'movement',
    entity_group: 'Movement',
    fields: [
      { id: 17, entity_name: 'movement', field_name: 'unit_id', display_name: 'Unit ID', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 18, entity_name: 'movement', field_name: 'convoy_id', display_name: 'Convoy ID', data_type: 'string', is_required: false, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 19, entity_name: 'movement', field_name: 'origin', display_name: 'Origin', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 20, entity_name: 'movement', field_name: 'destination', display_name: 'Destination', data_type: 'string', is_required: true, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 21, entity_name: 'movement', field_name: 'departure_time', display_name: 'Departure Time', data_type: 'datetime', is_required: false, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 22, entity_name: 'movement', field_name: 'eta', display_name: 'ETA', data_type: 'datetime', is_required: false, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 23, entity_name: 'movement', field_name: 'vehicle_count', display_name: 'Vehicle Count', data_type: 'integer', is_required: false, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 24, entity_name: 'movement', field_name: 'cargo_description', display_name: 'Cargo Description', data_type: 'string', is_required: false, enum_values: null, description: null, entity_group: 'Movement' },
      { id: 25, entity_name: 'movement', field_name: 'status', display_name: 'Status', data_type: 'enum', is_required: false, enum_values: ['PLANNED','EN_ROUTE','COMPLETE','DELAYED','CANCELLED'], description: null, entity_group: 'Movement' },
    ],
  },
];

// Re-export API types for convenience
export type { CanonicalFieldGroup, CanonicalField, FieldMappingConfig, MappingPreviewRow, UploadPreviewResponse, AutoDetectResponse };
