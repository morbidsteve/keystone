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
    serialNumber: 'W123456',
    itemType: 'WEAPON',
    nomenclature: 'Rifle, 5.56mm, M4A1',
    nsn: '1005-01-231-0973',
    tamcn: 'D28',
    securityClassification: 'UNCLASSIFIED',
    owningUnitId: 4,
    currentHolderId: 101,
    currentHolderName: 'Sgt Johnson, M.R.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-003',
    conditionCode: 'A',
    status: 'ON_HAND',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-14),
    createdAt: isoStr(-365),
    updatedAt: isoStr(-1),
    notes: null,
  },
  {
    id: 2,
    serialNumber: 'W789012',
    itemType: 'WEAPON',
    nomenclature: 'Pistol, 9mm, M18',
    nsn: '1005-01-659-6741',
    tamcn: 'D29',
    securityClassification: 'UNCLASSIFIED',
    owningUnitId: 4,
    currentHolderId: 102,
    currentHolderName: 'Capt Williams, J.D.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: null,
    conditionCode: 'A',
    status: 'ON_HAND',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-30),
    createdAt: isoStr(-300),
    updatedAt: isoStr(-1),
    notes: null,
  },
  {
    id: 3,
    serialNumber: 'C-SECRET-001',
    itemType: 'CRYPTO',
    nomenclature: 'Crypto Device, AN/CYZ-10',
    nsn: '5810-01-398-5569',
    tamcn: null,
    securityClassification: 'SECRET',
    owningUnitId: 4,
    currentHolderId: 103,
    currentHolderName: 'SSgt Davis, R.L.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-CRYPTO-001',
    conditionCode: 'A',
    status: 'ON_HAND',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-7),
    createdAt: isoStr(-200),
    updatedAt: isoStr(-1),
    notes: 'COMSEC controlled item — requires two-person integrity',
  },
  {
    id: 4,
    serialNumber: 'NVG-2024-001',
    itemType: 'NVG',
    nomenclature: 'Night Vision Goggles, AN/PVS-31A',
    nsn: '5855-01-629-5399',
    tamcn: 'E90',
    securityClassification: 'CUI',
    owningUnitId: 4,
    currentHolderId: 101,
    currentHolderName: 'Sgt Johnson, M.R.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-005',
    conditionCode: 'A',
    status: 'ON_HAND',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-21),
    createdAt: isoStr(-180),
    updatedAt: isoStr(-1),
    notes: null,
  },
  {
    id: 5,
    serialNumber: 'NVG-2024-002',
    itemType: 'NVG',
    nomenclature: 'Night Vision Goggles, AN/PVS-31A',
    nsn: '5855-01-629-5399',
    tamcn: 'E90',
    securityClassification: 'CUI',
    owningUnitId: 4,
    currentHolderId: null,
    currentHolderName: null,
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: null,
    conditionCode: 'A',
    status: 'MISSING',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-45),
    createdAt: isoStr(-180),
    updatedAt: isoStr(-1),
    notes: 'FLIPL initiated — last seen during field exercise 26-FEB-2026',
  },
  {
    id: 6,
    serialNumber: 'OPT-ACOG-3042',
    itemType: 'OPTIC',
    nomenclature: 'Sight, Reflex, M150 (ACOG)',
    nsn: '1240-01-412-6608',
    tamcn: null,
    securityClassification: 'UNCLASSIFIED',
    owningUnitId: 4,
    currentHolderId: 104,
    currentHolderName: 'Cpl Martinez, A.F.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-007',
    conditionCode: 'B',
    status: 'IN_MAINTENANCE',
    lastInventoryDate: isoStr(-2),
    lastTransferDate: isoStr(-10),
    createdAt: isoStr(-250),
    updatedAt: isoStr(-2),
    notes: 'Reticle misalignment — sent to precision weapons for repair',
  },
  {
    id: 7,
    serialNumber: 'RAD-PRC-117G-014',
    itemType: 'RADIO',
    nomenclature: 'Radio Set, AN/PRC-117G',
    nsn: '5820-01-579-7393',
    tamcn: 'E47',
    securityClassification: 'SECRET',
    owningUnitId: 4,
    currentHolderId: 103,
    currentHolderName: 'SSgt Davis, R.L.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-COMMS-002',
    conditionCode: 'A',
    status: 'ON_HAND',
    lastInventoryDate: isoStr(-1),
    lastTransferDate: isoStr(-3),
    createdAt: isoStr(-150),
    updatedAt: isoStr(-1),
    notes: null,
  },
  {
    id: 8,
    serialNumber: 'RAD-PRC-152A-028',
    itemType: 'RADIO',
    nomenclature: 'Radio Set, AN/PRC-152A',
    nsn: '5820-01-451-8250',
    tamcn: 'E46',
    securityClassification: 'CUI',
    owningUnitId: 4,
    currentHolderId: 105,
    currentHolderName: 'LCpl Brown, T.K.',
    handReceiptNumber: 'HR-2026-0041',
    subHandReceiptNumber: 'SHR-2026-0041-COMMS-003',
    conditionCode: 'A',
    status: 'ISSUED',
    lastInventoryDate: isoStr(-3),
    lastTransferDate: isoStr(0, -4),
    createdAt: isoStr(-120),
    updatedAt: isoStr(0, -4),
    notes: 'Lateral transfer to 2nd PLT — pending hand receipt update',
  },
];

// ---------------------------------------------------------------------------
// Mock Transfers (6 records)
// ---------------------------------------------------------------------------

const MOCK_TRANSFERS: CustodyTransfer[] = [
  {
    id: 1,
    sensitiveItemId: 1,
    fromPersonnelId: 100,
    fromPersonnelName: 'SSgt Thompson, K.J.',
    toPersonnelId: 101,
    toPersonnelName: 'Sgt Johnson, M.R.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'ISSUE',
    transferDate: isoStr(-14),
    documentNumber: 'SHR-2026-0041-003',
    authorizedBy: 102,
    witnessedBy: 106,
    reason: 'Sub-hand receipt issue for deployment preparation',
    notes: null,
    createdAt: isoStr(-14),
  },
  {
    id: 2,
    sensitiveItemId: 3,
    fromPersonnelId: 107,
    fromPersonnelName: 'GySgt Hernandez, P.M.',
    toPersonnelId: 103,
    toPersonnelName: 'SSgt Davis, R.L.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'ISSUE',
    transferDate: isoStr(-7),
    documentNumber: 'HR-CRYPTO-2026-012',
    authorizedBy: 108,
    witnessedBy: 109,
    reason: 'COMSEC key material rotation — new custodian assignment',
    notes: 'Two-person integrity maintained throughout transfer',
    createdAt: isoStr(-7),
  },
  {
    id: 3,
    sensitiveItemId: 7,
    fromPersonnelId: 110,
    fromPersonnelName: 'Cpl Adams, S.W.',
    toPersonnelId: 103,
    toPersonnelName: 'SSgt Davis, R.L.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'MAINTENANCE_RETURN',
    transferDate: isoStr(-3),
    documentNumber: 'TL-2026-0088',
    authorizedBy: 107,
    witnessedBy: null,
    reason: 'Return from field exercise temp loan',
    notes: null,
    createdAt: isoStr(-3),
  },
  {
    id: 4,
    sensitiveItemId: 8,
    fromPersonnelId: 103,
    fromPersonnelName: 'SSgt Davis, R.L.',
    toPersonnelId: 105,
    toPersonnelName: 'LCpl Brown, T.K.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'LATERAL_TRANSFER',
    transferDate: isoStr(0, -4),
    documentNumber: 'LT-2026-0034',
    authorizedBy: 102,
    witnessedBy: 107,
    reason: 'Lateral transfer to 2nd PLT communications section',
    notes: 'Pending hand receipt update',
    createdAt: isoStr(0, -4),
  },
  {
    id: 5,
    sensitiveItemId: 6,
    fromPersonnelId: 101,
    fromPersonnelName: 'Sgt Johnson, M.R.',
    toPersonnelId: 104,
    toPersonnelName: 'Cpl Martinez, A.F.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'TEMPORARY_LOAN',
    transferDate: isoStr(-10),
    documentNumber: 'TL-2026-0091',
    authorizedBy: 107,
    witnessedBy: null,
    reason: 'Temp loan for marksmanship qualification',
    notes: 'Return NLT 15-MAR-2026',
    createdAt: isoStr(-10),
  },
  {
    id: 6,
    sensitiveItemId: 4,
    fromPersonnelId: 100,
    fromPersonnelName: 'SSgt Thompson, K.J.',
    toPersonnelId: 101,
    toPersonnelName: 'Sgt Johnson, M.R.',
    fromUnitId: 4,
    toUnitId: 4,
    transferType: 'ISSUE',
    transferDate: isoStr(-21),
    documentNumber: 'ISS-2026-0156',
    authorizedBy: 108,
    witnessedBy: 107,
    reason: 'Night vision device issue for night operations qualification',
    notes: null,
    createdAt: isoStr(-21),
  },
];

// ---------------------------------------------------------------------------
// Mock Inventory Events (3 records)
// ---------------------------------------------------------------------------

const MOCK_INVENTORY_EVENTS: InventoryEvent[] = [
  {
    id: 1,
    unitId: 4,
    inventoryType: 'CYCLIC',
    conductedBy: 107,
    conductedByName: 'GySgt Hernandez, P.M.',
    witnessedBy: 103,
    startedAt: isoStr(-1, 6),
    completedAt: isoStr(-1, 7),
    totalItemsExpected: 8,
    totalItemsVerified: 7,
    discrepancies: 1,
    status: 'COMPLETED',
    approvedBy: null,
    approvedAt: null,
    notes: 'NVG-2024-002 not located — FLIPL initiated',
    createdAt: isoStr(-1, 6),
  },
  {
    id: 2,
    unitId: 4,
    inventoryType: 'SENSITIVE_ITEM',
    conductedBy: 100,
    conductedByName: 'SSgt Thompson, K.J.',
    witnessedBy: 107,
    startedAt: isoStr(-7, 8),
    completedAt: isoStr(-7, 10),
    totalItemsExpected: 8,
    totalItemsVerified: 8,
    discrepancies: 0,
    status: 'COMPLETED',
    approvedBy: 108,
    approvedAt: isoStr(-7, 12),
    notes: 'All sensitive items accounted for',
    createdAt: isoStr(-7, 8),
  },
  {
    id: 3,
    unitId: 4,
    inventoryType: 'MONTHLY',
    conductedBy: 108,
    conductedByName: '1stLt Parker, C.A.',
    witnessedBy: 107,
    startedAt: isoStr(-30, 8),
    completedAt: isoStr(-30, 14),
    totalItemsExpected: 8,
    totalItemsVerified: 8,
    discrepancies: 0,
    status: 'COMPLETED',
    approvedBy: 109,
    approvedAt: isoStr(-30, 16),
    notes: 'Monthly command-directed SI inventory — all items verified',
    createdAt: isoStr(-30, 8),
  },
];

// ---------------------------------------------------------------------------
// Mock Audit Logs (10 records)
// ---------------------------------------------------------------------------

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1,
    userId: 107,
    action: 'INVENTORY_START',
    entityType: 'INVENTORY_EVENT',
    entityId: 1,
    description: 'Daily sensitive items inventory initiated by GySgt Hernandez',
    ipAddress: '10.0.1.45',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-1, 6),
  },
  {
    id: 2,
    userId: 107,
    action: 'STATUS_CHANGE',
    entityType: 'SENSITIVE_ITEM',
    entityId: 5,
    description: 'MISSING ITEM ALERT: NVG AN/PVS-31A (NVG-2024-002) not located during daily inventory',
    ipAddress: '10.0.1.45',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-1, 7),
  },
  {
    id: 3,
    userId: 103,
    action: 'TRANSFER',
    entityType: 'CUSTODY_TRANSFER',
    entityId: 4,
    description: 'Lateral transfer: AN/PRC-152A (RAD-PRC-152A-028) from SSgt Davis to LCpl Brown',
    ipAddress: '10.0.1.22',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(0, -4),
  },
  {
    id: 4,
    userId: 102,
    action: 'UPDATE',
    entityType: 'CUSTODY_TRANSFER',
    entityId: 4,
    description: 'Transfer approved by Capt Williams for AN/PRC-152A lateral transfer',
    ipAddress: '10.0.1.10',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(0, -3),
  },
  {
    id: 5,
    userId: 1,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: 1,
    description: 'User admin logged in via CAC authentication',
    ipAddress: '10.0.1.5',
    userAgent: 'Mozilla/5.0',
    createdAt: isoStr(0, -8),
  },
  {
    id: 6,
    userId: 102,
    action: 'EXPORT',
    entityType: 'REPORT',
    entityId: 12,
    description: 'Exported sensitive items report to PDF — classification: CUI',
    ipAddress: '10.0.1.10',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(0, -5),
  },
  {
    id: 7,
    userId: 107,
    action: 'CREATE',
    entityType: 'SENSITIVE_ITEM',
    entityId: 8,
    description: 'New sensitive item registered: AN/PRC-152A (RAD-PRC-152A-028)',
    ipAddress: '10.0.1.45',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-120),
  },
  {
    id: 8,
    userId: 108,
    action: 'UPDATE',
    entityType: 'SENSITIVE_ITEM',
    entityId: 6,
    description: 'Status changed: M150 ACOG (OPT-ACOG-3042) set to IN_MAINTENANCE',
    ipAddress: '10.0.1.50',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-2, 10),
  },
  {
    id: 9,
    userId: 1,
    action: 'DELETE',
    entityType: 'SYSTEM',
    entityId: 44,
    description: 'Deleted obsolete alert rule: weekly crypto inventory reminder (superseded)',
    ipAddress: '10.0.1.5',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-5, 14),
  },
  {
    id: 10,
    userId: 102,
    action: 'STATUS_CHANGE',
    entityType: 'CUSTODY_TRANSFER',
    entityId: 99,
    description: 'Transfer denied: insufficient authorization for SECRET material transfer',
    ipAddress: '10.0.1.10',
    userAgent: 'KEYSTONE/1.0',
    createdAt: isoStr(-3, 11),
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
    if (unitId) results = results.filter((i) => i.owningUnitId === unitId || unitId === 4);
    if (itemType) results = results.filter((i) => i.itemType === itemType);
    if (status) results = results.filter((i) => i.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: SensitiveItem[] }>('/custody/sensitive-items', {
    params: { unitId: unitId, itemType: itemType, status },
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
      serialNumber: data.serialNumber ?? 'NEW-001',
      itemType: data.itemType ?? 'OTHER',
      nomenclature: data.nomenclature ?? 'New Item',
      nsn: data.nsn ?? null,
      tamcn: data.tamcn ?? null,
      securityClassification: data.securityClassification ?? 'UNCLASSIFIED',
      owningUnitId: data.owningUnitId ?? 4,
      currentHolderId: data.currentHolderId ?? null,
      currentHolderName: data.currentHolderName ?? null,
      handReceiptNumber: data.handReceiptNumber ?? null,
      subHandReceiptNumber: data.subHandReceiptNumber ?? null,
      conditionCode: data.conditionCode ?? 'A',
      status: 'ON_HAND',
      lastInventoryDate: null,
      lastTransferDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    return { ...existing, ...data, id: itemId, updatedAt: new Date().toISOString() };
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
    return { ...existing, status, updatedAt: new Date().toISOString(), notes: reason ?? existing.notes };
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
    return MOCK_TRANSFERS.filter((t) => t.sensitiveItemId === itemId).sort(
      (a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime(),
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
    if (itemId) results = results.filter((t) => t.sensitiveItemId === itemId);
    if (unitId) results = results.filter((t) => t.fromUnitId === unitId || t.toUnitId === unitId || unitId === 4);
    return results.sort(
      (a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime(),
    );
  }
  const response = await apiClient.get<{ data: CustodyTransfer[] }>('/custody/transfers', {
    params: { unitId: unitId, itemId: itemId },
  });
  return response.data.data;
}

export async function createTransfer(data: Partial<CustodyTransfer>): Promise<CustodyTransfer> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      sensitiveItemId: data.sensitiveItemId ?? 1,
      fromPersonnelId: data.fromPersonnelId ?? null,
      fromPersonnelName: data.fromPersonnelName ?? null,
      toPersonnelId: data.toPersonnelId ?? null,
      toPersonnelName: data.toPersonnelName ?? null,
      fromUnitId: data.fromUnitId ?? 4,
      toUnitId: data.toUnitId ?? 4,
      transferType: data.transferType ?? 'ISSUE',
      transferDate: new Date().toISOString(),
      documentNumber: data.documentNumber ?? `TR-${Date.now()}`,
      authorizedBy: data.authorizedBy ?? null,
      witnessedBy: data.witnessedBy ?? null,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
    };
  }
  const response = await apiClient.post<{ data: CustodyTransfer }>('/custody/transfers', data);
  return response.data.data;
}

export async function getItemsByHolder(personnelId: number): Promise<SensitiveItem[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SENSITIVE_ITEMS.filter((i) => i.currentHolderId === personnelId);
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
    if (unitId) results = results.filter((e) => e.unitId === unitId || unitId === 4);
    return results.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }
  const response = await apiClient.get<{ data: InventoryEvent[] }>('/custody/inventory-events', {
    params: { unitId: unitId },
  });
  return response.data.data;
}

export async function startInventory(data: {
  unitId: number;
  inventoryType: string;
  conductedBy: number;
  witnessedBy?: number;
  notes?: string;
}): Promise<InventoryEvent> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      unitId: data.unitId,
      inventoryType: data.inventoryType as InventoryEvent['inventoryType'],
      conductedBy: data.conductedBy,
      conductedByName: 'Current User',
      witnessedBy: data.witnessedBy ?? null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalItemsExpected: 8,
      totalItemsVerified: 0,
      discrepancies: 0,
      status: 'IN_PROGRESS',
      approvedBy: null,
      approvedAt: null,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
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
    if (entityType) results = results.filter((l) => l.entityType === entityType);
    if (entityId) results = results.filter((l) => l.entityId === entityId);
    if (daysBack) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      results = results.filter((l) => new Date(l.createdAt) >= cutoff);
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  const response = await apiClient.get<{ data: AuditLogEntry[] }>('/audit/logs', {
    params: { entityType: entityType, entityId: entityId, days_back: daysBack },
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
      results = results.filter((l) => new Date(l.createdAt) >= cutoff);
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    const items = MOCK_SENSITIVE_ITEMS.filter((i) => i.currentHolderId === personnelId);
    const holderName = items.length > 0 ? (items[0].currentHolderName ?? 'Unknown') : 'Unknown';
    return {
      personnelId: personnelId,
      personnelName: holderName,
      rank: 'Sgt',
      edipi: '1234567890',
      unitName: '1st Bn, 5th Marines',
      totalItems: items.length,
      items,
      generatedAt: new Date().toISOString(),
    };
  }
  const response = await apiClient.get<{ data: HandReceipt }>(
    `/custody/personnel/${personnelId}/hand-receipt`,
  );
  return response.data.data;
}
