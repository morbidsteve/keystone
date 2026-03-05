// =============================================================================
// KEYSTONE Custody & Chain of Custody — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  SensitiveItem,
  CustodyTransfer,
  InventoryEvent,
  AuditLogEntry,
  HandReceipt,
  SensitiveItemType,
  SensitiveItemStatus,
  AuditEntityType,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days from now (ISO short form)
// ---------------------------------------------------------------------------

function isoStr(daysFromNow: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Sensitive Items (8 records)
// ---------------------------------------------------------------------------

const MOCK_SENSITIVE_ITEMS: SensitiveItem[] = [
  {
    id: 1,
    serial_number: 'W123456',
    item_type: 'WEAPON',
    nomenclature: 'Rifle, 5.56mm, M4A1',
    nsn: '1005-01-231-0973',
    tamcn: 'D28',
    security_classification: 'UNCLASSIFIED',
    owning_unit_id: 4,
    current_holder_id: 101,
    current_holder_name: 'Sgt Johnson, M.R.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-003',
    condition_code: 'A',
    status: 'ON_HAND',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-14),
    created_at: isoStr(-365),
    updated_at: isoStr(-1),
    notes: null,
  },
  {
    id: 2,
    serial_number: 'W789012',
    item_type: 'WEAPON',
    nomenclature: 'Pistol, 9mm, M18',
    nsn: '1005-01-659-6741',
    tamcn: 'D29',
    security_classification: 'UNCLASSIFIED',
    owning_unit_id: 4,
    current_holder_id: 102,
    current_holder_name: 'Capt Williams, J.D.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: null,
    condition_code: 'A',
    status: 'ON_HAND',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-30),
    created_at: isoStr(-300),
    updated_at: isoStr(-1),
    notes: null,
  },
  {
    id: 3,
    serial_number: 'C-SECRET-001',
    item_type: 'CRYPTO',
    nomenclature: 'Crypto Device, AN/CYZ-10',
    nsn: '5810-01-398-5569',
    tamcn: null,
    security_classification: 'SECRET',
    owning_unit_id: 4,
    current_holder_id: 103,
    current_holder_name: 'SSgt Davis, R.L.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-CRYPTO-001',
    condition_code: 'A',
    status: 'ON_HAND',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-7),
    created_at: isoStr(-200),
    updated_at: isoStr(-1),
    notes: 'COMSEC controlled item — requires two-person integrity',
  },
  {
    id: 4,
    serial_number: 'NVG-2024-001',
    item_type: 'NVG',
    nomenclature: 'Night Vision Goggles, AN/PVS-31A',
    nsn: '5855-01-629-5399',
    tamcn: 'E90',
    security_classification: 'CUI',
    owning_unit_id: 4,
    current_holder_id: 101,
    current_holder_name: 'Sgt Johnson, M.R.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-005',
    condition_code: 'A',
    status: 'ON_HAND',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-21),
    created_at: isoStr(-180),
    updated_at: isoStr(-1),
    notes: null,
  },
  {
    id: 5,
    serial_number: 'NVG-2024-002',
    item_type: 'NVG',
    nomenclature: 'Night Vision Goggles, AN/PVS-31A',
    nsn: '5855-01-629-5399',
    tamcn: 'E90',
    security_classification: 'CUI',
    owning_unit_id: 4,
    current_holder_id: null,
    current_holder_name: null,
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: null,
    condition_code: 'A',
    status: 'MISSING',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-45),
    created_at: isoStr(-180),
    updated_at: isoStr(-1),
    notes: 'FLIPL initiated — last seen during field exercise 26-FEB-2026',
  },
  {
    id: 6,
    serial_number: 'OPT-ACOG-3042',
    item_type: 'OPTIC',
    nomenclature: 'Sight, Reflex, M150 (ACOG)',
    nsn: '1240-01-412-6608',
    tamcn: null,
    security_classification: 'UNCLASSIFIED',
    owning_unit_id: 4,
    current_holder_id: 104,
    current_holder_name: 'Cpl Martinez, A.F.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-007',
    condition_code: 'B',
    status: 'IN_MAINTENANCE',
    last_inventory_date: isoStr(-2),
    last_transfer_date: isoStr(-10),
    created_at: isoStr(-250),
    updated_at: isoStr(-2),
    notes: 'Reticle misalignment — sent to precision weapons for repair',
  },
  {
    id: 7,
    serial_number: 'RAD-PRC-117G-014',
    item_type: 'RADIO',
    nomenclature: 'Radio Set, AN/PRC-117G',
    nsn: '5820-01-579-7393',
    tamcn: 'E47',
    security_classification: 'SECRET',
    owning_unit_id: 4,
    current_holder_id: 103,
    current_holder_name: 'SSgt Davis, R.L.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-COMMS-002',
    condition_code: 'A',
    status: 'ON_HAND',
    last_inventory_date: isoStr(-1),
    last_transfer_date: isoStr(-3),
    created_at: isoStr(-150),
    updated_at: isoStr(-1),
    notes: null,
  },
  {
    id: 8,
    serial_number: 'RAD-PRC-152A-028',
    item_type: 'RADIO',
    nomenclature: 'Radio Set, AN/PRC-152A',
    nsn: '5820-01-451-8250',
    tamcn: 'E46',
    security_classification: 'CUI',
    owning_unit_id: 4,
    current_holder_id: 105,
    current_holder_name: 'LCpl Brown, T.K.',
    hand_receipt_number: 'HR-2026-0041',
    sub_hand_receipt_number: 'SHR-2026-0041-COMMS-003',
    condition_code: 'A',
    status: 'ISSUED',
    last_inventory_date: isoStr(-3),
    last_transfer_date: isoStr(0, -4),
    created_at: isoStr(-120),
    updated_at: isoStr(0, -4),
    notes: 'Lateral transfer to 2nd PLT — pending hand receipt update',
  },
];

// ---------------------------------------------------------------------------
// Mock Transfers (6 records)
// ---------------------------------------------------------------------------

const MOCK_TRANSFERS: CustodyTransfer[] = [
  {
    id: 1,
    sensitive_item_id: 1,
    from_personnel_id: 100,
    from_personnel_name: 'SSgt Thompson, K.J.',
    to_personnel_id: 101,
    to_personnel_name: 'Sgt Johnson, M.R.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'ISSUE',
    transfer_date: isoStr(-14),
    document_number: 'SHR-2026-0041-003',
    authorized_by: 102,
    witnessed_by: 106,
    reason: 'Sub-hand receipt issue for deployment preparation',
    notes: null,
    created_at: isoStr(-14),
  },
  {
    id: 2,
    sensitive_item_id: 3,
    from_personnel_id: 107,
    from_personnel_name: 'GySgt Hernandez, P.M.',
    to_personnel_id: 103,
    to_personnel_name: 'SSgt Davis, R.L.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'ISSUE',
    transfer_date: isoStr(-7),
    document_number: 'HR-CRYPTO-2026-012',
    authorized_by: 108,
    witnessed_by: 109,
    reason: 'COMSEC key material rotation — new custodian assignment',
    notes: 'Two-person integrity maintained throughout transfer',
    created_at: isoStr(-7),
  },
  {
    id: 3,
    sensitive_item_id: 7,
    from_personnel_id: 110,
    from_personnel_name: 'Cpl Adams, S.W.',
    to_personnel_id: 103,
    to_personnel_name: 'SSgt Davis, R.L.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'MAINTENANCE_RETURN',
    transfer_date: isoStr(-3),
    document_number: 'TL-2026-0088',
    authorized_by: 107,
    witnessed_by: null,
    reason: 'Return from field exercise temp loan',
    notes: null,
    created_at: isoStr(-3),
  },
  {
    id: 4,
    sensitive_item_id: 8,
    from_personnel_id: 103,
    from_personnel_name: 'SSgt Davis, R.L.',
    to_personnel_id: 105,
    to_personnel_name: 'LCpl Brown, T.K.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'LATERAL_TRANSFER',
    transfer_date: isoStr(0, -4),
    document_number: 'LT-2026-0034',
    authorized_by: 102,
    witnessed_by: 107,
    reason: 'Lateral transfer to 2nd PLT communications section',
    notes: 'Pending hand receipt update',
    created_at: isoStr(0, -4),
  },
  {
    id: 5,
    sensitive_item_id: 6,
    from_personnel_id: 101,
    from_personnel_name: 'Sgt Johnson, M.R.',
    to_personnel_id: 104,
    to_personnel_name: 'Cpl Martinez, A.F.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'TEMPORARY_LOAN',
    transfer_date: isoStr(-10),
    document_number: 'TL-2026-0091',
    authorized_by: 107,
    witnessed_by: null,
    reason: 'Temp loan for marksmanship qualification',
    notes: 'Return NLT 15-MAR-2026',
    created_at: isoStr(-10),
  },
  {
    id: 6,
    sensitive_item_id: 4,
    from_personnel_id: 100,
    from_personnel_name: 'SSgt Thompson, K.J.',
    to_personnel_id: 101,
    to_personnel_name: 'Sgt Johnson, M.R.',
    from_unit_id: 4,
    to_unit_id: 4,
    transfer_type: 'ISSUE',
    transfer_date: isoStr(-21),
    document_number: 'ISS-2026-0156',
    authorized_by: 108,
    witnessed_by: 107,
    reason: 'Night vision device issue for night operations qualification',
    notes: null,
    created_at: isoStr(-21),
  },
];

// ---------------------------------------------------------------------------
// Mock Inventory Events (3 records)
// ---------------------------------------------------------------------------

const MOCK_INVENTORY_EVENTS: InventoryEvent[] = [
  {
    id: 1,
    unit_id: 4,
    inventory_type: 'CYCLIC',
    conducted_by: 107,
    conducted_by_name: 'GySgt Hernandez, P.M.',
    witnessed_by: 103,
    started_at: isoStr(-1, 6),
    completed_at: isoStr(-1, 7),
    total_items_expected: 8,
    total_items_verified: 7,
    discrepancies: 1,
    status: 'COMPLETED',
    approved_by: null,
    approved_at: null,
    notes: 'NVG-2024-002 not located — FLIPL initiated',
    created_at: isoStr(-1, 6),
  },
  {
    id: 2,
    unit_id: 4,
    inventory_type: 'SENSITIVE_ITEM',
    conducted_by: 100,
    conducted_by_name: 'SSgt Thompson, K.J.',
    witnessed_by: 107,
    started_at: isoStr(-7, 8),
    completed_at: isoStr(-7, 10),
    total_items_expected: 8,
    total_items_verified: 8,
    discrepancies: 0,
    status: 'COMPLETED',
    approved_by: 108,
    approved_at: isoStr(-7, 12),
    notes: 'All sensitive items accounted for',
    created_at: isoStr(-7, 8),
  },
  {
    id: 3,
    unit_id: 4,
    inventory_type: 'MONTHLY',
    conducted_by: 108,
    conducted_by_name: '1stLt Parker, C.A.',
    witnessed_by: 107,
    started_at: isoStr(-30, 8),
    completed_at: isoStr(-30, 14),
    total_items_expected: 8,
    total_items_verified: 8,
    discrepancies: 0,
    status: 'COMPLETED',
    approved_by: 109,
    approved_at: isoStr(-30, 16),
    notes: 'Monthly command-directed SI inventory — all items verified',
    created_at: isoStr(-30, 8),
  },
];

// ---------------------------------------------------------------------------
// Mock Audit Logs (10 records)
// ---------------------------------------------------------------------------

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1,
    user_id: 107,
    action: 'INVENTORY_START',
    entity_type: 'INVENTORY_EVENT',
    entity_id: 1,
    description: 'Daily sensitive items inventory initiated by GySgt Hernandez',
    ip_address: '10.0.1.45',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-1, 6),
  },
  {
    id: 2,
    user_id: 107,
    action: 'STATUS_CHANGE',
    entity_type: 'SENSITIVE_ITEM',
    entity_id: 5,
    description: 'MISSING ITEM ALERT: NVG AN/PVS-31A (NVG-2024-002) not located during daily inventory',
    ip_address: '10.0.1.45',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-1, 7),
  },
  {
    id: 3,
    user_id: 103,
    action: 'TRANSFER',
    entity_type: 'CUSTODY_TRANSFER',
    entity_id: 4,
    description: 'Lateral transfer: AN/PRC-152A (RAD-PRC-152A-028) from SSgt Davis to LCpl Brown',
    ip_address: '10.0.1.22',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(0, -4),
  },
  {
    id: 4,
    user_id: 102,
    action: 'UPDATE',
    entity_type: 'CUSTODY_TRANSFER',
    entity_id: 4,
    description: 'Transfer approved by Capt Williams for AN/PRC-152A lateral transfer',
    ip_address: '10.0.1.10',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(0, -3),
  },
  {
    id: 5,
    user_id: 1,
    action: 'LOGIN',
    entity_type: 'USER',
    entity_id: 1,
    description: 'User admin logged in via CAC authentication',
    ip_address: '10.0.1.5',
    user_agent: 'Mozilla/5.0',
    created_at: isoStr(0, -8),
  },
  {
    id: 6,
    user_id: 102,
    action: 'EXPORT',
    entity_type: 'REPORT',
    entity_id: 12,
    description: 'Exported sensitive items report to PDF — classification: CUI',
    ip_address: '10.0.1.10',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(0, -5),
  },
  {
    id: 7,
    user_id: 107,
    action: 'CREATE',
    entity_type: 'SENSITIVE_ITEM',
    entity_id: 8,
    description: 'New sensitive item registered: AN/PRC-152A (RAD-PRC-152A-028)',
    ip_address: '10.0.1.45',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-120),
  },
  {
    id: 8,
    user_id: 108,
    action: 'UPDATE',
    entity_type: 'SENSITIVE_ITEM',
    entity_id: 6,
    description: 'Status changed: M150 ACOG (OPT-ACOG-3042) set to IN_MAINTENANCE',
    ip_address: '10.0.1.50',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-2, 10),
  },
  {
    id: 9,
    user_id: 1,
    action: 'DELETE',
    entity_type: 'SYSTEM',
    entity_id: 44,
    description: 'Deleted obsolete alert rule: weekly crypto inventory reminder (superseded)',
    ip_address: '10.0.1.5',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-5, 14),
  },
  {
    id: 10,
    user_id: 102,
    action: 'STATUS_CHANGE',
    entity_type: 'CUSTODY_TRANSFER',
    entity_id: 99,
    description: 'Transfer denied: insufficient authorization for SECRET material transfer',
    ip_address: '10.0.1.10',
    user_agent: 'KEYSTONE/1.0',
    created_at: isoStr(-3, 11),
  },
];

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getSensitiveItems(
  unitId?: number,
  itemType?: SensitiveItemType,
  status?: SensitiveItemStatus,
): Promise<SensitiveItem[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_SENSITIVE_ITEMS];
    if (unitId) results = results.filter((i) => i.owning_unit_id === unitId || unitId === 4);
    if (itemType) results = results.filter((i) => i.item_type === itemType);
    if (status) results = results.filter((i) => i.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: SensitiveItem[] }>('/custody/sensitive-items', {
    params: { unit_id: unitId, item_type: itemType, status },
  });
  return response.data.data;
}

export async function getSensitiveItem(itemId: number): Promise<SensitiveItem> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SENSITIVE_ITEMS.find((i) => i.id === itemId) ?? MOCK_SENSITIVE_ITEMS[0];
  }
  const response = await apiClient.get<{ data: SensitiveItem }>(`/custody/sensitive-items/${itemId}`);
  return response.data.data;
}

export async function createSensitiveItem(data: Partial<SensitiveItem>): Promise<SensitiveItem> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      serial_number: data.serial_number ?? 'NEW-001',
      item_type: data.item_type ?? 'OTHER',
      nomenclature: data.nomenclature ?? 'New Item',
      nsn: data.nsn ?? null,
      tamcn: data.tamcn ?? null,
      security_classification: data.security_classification ?? 'UNCLASSIFIED',
      owning_unit_id: data.owning_unit_id ?? 4,
      current_holder_id: data.current_holder_id ?? null,
      current_holder_name: data.current_holder_name ?? null,
      hand_receipt_number: data.hand_receipt_number ?? null,
      sub_hand_receipt_number: data.sub_hand_receipt_number ?? null,
      condition_code: data.condition_code ?? 'A',
      status: 'ON_HAND',
      last_inventory_date: null,
      last_transfer_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: data.notes ?? null,
    };
  }
  const response = await apiClient.post<{ data: SensitiveItem }>('/custody/sensitive-items', data);
  return response.data.data;
}

export async function updateSensitiveItem(
  itemId: number,
  data: Partial<SensitiveItem>,
): Promise<SensitiveItem> {
  if (isDemoMode) {
    await mockDelay();
    const existing = MOCK_SENSITIVE_ITEMS.find((i) => i.id === itemId) ?? MOCK_SENSITIVE_ITEMS[0];
    return { ...existing, ...data, id: itemId, updated_at: new Date().toISOString() };
  }
  const response = await apiClient.patch<{ data: SensitiveItem }>(
    `/custody/sensitive-items/${itemId}`,
    data,
  );
  return response.data.data;
}

export async function updateItemStatus(
  itemId: number,
  status: SensitiveItemStatus,
  reason?: string,
): Promise<SensitiveItem> {
  if (isDemoMode) {
    await mockDelay();
    const existing = MOCK_SENSITIVE_ITEMS.find((i) => i.id === itemId) ?? MOCK_SENSITIVE_ITEMS[0];
    return { ...existing, status, updated_at: new Date().toISOString(), notes: reason ?? existing.notes };
  }
  const response = await apiClient.patch<{ data: SensitiveItem }>(
    `/custody/sensitive-items/${itemId}/status`,
    { status, reason },
  );
  return response.data.data;
}

export async function getCustodyChain(itemId: number): Promise<CustodyTransfer[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_TRANSFERS.filter((t) => t.sensitive_item_id === itemId).sort(
      (a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime(),
    );
  }
  const response = await apiClient.get<{ data: CustodyTransfer[] }>(
    `/custody/sensitive-items/${itemId}/chain`,
  );
  return response.data.data;
}

export async function getTransfers(
  unitId?: number,
  itemId?: number,
): Promise<CustodyTransfer[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_TRANSFERS];
    if (itemId) results = results.filter((t) => t.sensitive_item_id === itemId);
    if (unitId) results = results.filter((t) => t.from_unit_id === unitId || t.to_unit_id === unitId || unitId === 4);
    return results.sort(
      (a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime(),
    );
  }
  const response = await apiClient.get<{ data: CustodyTransfer[] }>('/custody/transfers', {
    params: { unit_id: unitId, item_id: itemId },
  });
  return response.data.data;
}

export async function createTransfer(data: Partial<CustodyTransfer>): Promise<CustodyTransfer> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      sensitive_item_id: data.sensitive_item_id ?? 1,
      from_personnel_id: data.from_personnel_id ?? null,
      from_personnel_name: data.from_personnel_name ?? null,
      to_personnel_id: data.to_personnel_id ?? null,
      to_personnel_name: data.to_personnel_name ?? null,
      from_unit_id: data.from_unit_id ?? 4,
      to_unit_id: data.to_unit_id ?? 4,
      transfer_type: data.transfer_type ?? 'ISSUE',
      transfer_date: new Date().toISOString(),
      document_number: data.document_number ?? `TR-${Date.now()}`,
      authorized_by: data.authorized_by ?? null,
      witnessed_by: data.witnessed_by ?? null,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await apiClient.post<{ data: CustodyTransfer }>('/custody/transfers', data);
  return response.data.data;
}

export async function getItemsByHolder(personnelId: number): Promise<SensitiveItem[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SENSITIVE_ITEMS.filter((i) => i.current_holder_id === personnelId);
  }
  const response = await apiClient.get<{ data: SensitiveItem[] }>(
    `/custody/personnel/${personnelId}/items`,
  );
  return response.data.data;
}

export async function getInventoryEvents(unitId?: number): Promise<InventoryEvent[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_INVENTORY_EVENTS];
    if (unitId) results = results.filter((e) => e.unit_id === unitId || unitId === 4);
    return results.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
  }
  const response = await apiClient.get<{ data: InventoryEvent[] }>('/custody/inventory-events', {
    params: { unit_id: unitId },
  });
  return response.data.data;
}

export async function startInventory(data: {
  unit_id: number;
  inventory_type: string;
  conducted_by: number;
  witnessed_by?: number;
  notes?: string;
}): Promise<InventoryEvent> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      unit_id: data.unit_id,
      inventory_type: data.inventory_type as InventoryEvent['inventory_type'],
      conducted_by: data.conducted_by,
      conducted_by_name: 'Current User',
      witnessed_by: data.witnessed_by ?? null,
      started_at: new Date().toISOString(),
      completed_at: null,
      total_items_expected: 8,
      total_items_verified: 0,
      discrepancies: 0,
      status: 'IN_PROGRESS',
      approved_by: null,
      approved_at: null,
      notes: data.notes ?? null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await apiClient.post<{ data: InventoryEvent }>('/custody/inventory-events', data);
  return response.data.data;
}

export async function getAuditLogs(
  entityType?: AuditEntityType,
  entityId?: number,
  daysBack?: number,
): Promise<AuditLogEntry[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_AUDIT_LOGS];
    if (entityType) results = results.filter((l) => l.entity_type === entityType);
    if (entityId) results = results.filter((l) => l.entity_id === entityId);
    if (daysBack) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      results = results.filter((l) => new Date(l.created_at) >= cutoff);
    }
    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
  const response = await apiClient.get<{ data: AuditLogEntry[] }>('/audit/logs', {
    params: { entity_type: entityType, entity_id: entityId, days_back: daysBack },
  });
  return response.data.data;
}

export async function getSecurityActions(hoursBack?: number): Promise<AuditLogEntry[]> {
  if (isDemoMode) {
    await mockDelay();
    const securityActions: AuditLogEntry['action'][] = ['DELETE', 'EXPORT', 'TRANSFER', 'STATUS_CHANGE', 'PERMISSION_CHANGE'];
    let results = MOCK_AUDIT_LOGS.filter((l) => securityActions.includes(l.action));
    if (hoursBack) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hoursBack);
      results = results.filter((l) => new Date(l.created_at) >= cutoff);
    }
    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
  const response = await apiClient.get<{ data: AuditLogEntry[] }>('/audit/security-actions', {
    params: { hours_back: hoursBack },
  });
  return response.data.data;
}

export async function getHandReceipt(personnelId: number): Promise<HandReceipt> {
  if (isDemoMode) {
    await mockDelay();
    const items = MOCK_SENSITIVE_ITEMS.filter((i) => i.current_holder_id === personnelId);
    const holderName = items.length > 0 ? (items[0].current_holder_name ?? 'Unknown') : 'Unknown';
    return {
      personnel_id: personnelId,
      personnel_name: holderName,
      rank: 'Sgt',
      edipi: '1234567890',
      unit_name: '1st Bn, 5th Marines',
      total_items: items.length,
      items,
      generated_at: new Date().toISOString(),
    };
  }
  const response = await apiClient.get<{ data: HandReceipt }>(
    `/custody/personnel/${personnelId}/hand-receipt`,
  );
  return response.data.data;
}
