// =============================================================================
// KEYSTONE Requisition & Supply Chain — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  Requisition,
  RequisitionStatus,
  RequisitionPriority,
  InventoryRecord,
  InventoryTransaction,
  LowStockAlert,
  TransactionType,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Analytics summary shape
// ---------------------------------------------------------------------------

export interface RequisitionAnalytics {
  summary: {
    total: number;
    active: number;
    fulfilled: number;
    denied: number;
    canceled: number;
    approvalRate: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySupplyClass: Array<{ supplyClass: string; count: number; fulfilled: number }>;
  avgFulfillmentDays: number;
  recentTrend: Array<{ date: string; submitted: number; fulfilled: number }>;
}

// ---------------------------------------------------------------------------
// Helper: date string N days ago (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function isoStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// sessionStorage-backed Requisition Store
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'KEYSTONE_REQUISITIONS';

function buildInitialRequisitions(): Requisition[] {
  return [
    {
      id: 1,
      requisitionNumber: 'REQ-2026-0001',
      unitId: 4,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: null,
      supplyCatalogItemId: 1,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '8970-00-149-1094',
      dodic: null,
      nomenclature: 'MEAL, READY-TO-EAT (MRE), CASE',
      quantityRequested: 120,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'CS',
      priority: '06' as RequisitionPriority,
      status: 'DRAFT',
      justification: 'Resupply for upcoming field exercise, 3-day FEX support',
      denialReason: null,
      documentNumber: null,
      createdAt: isoStr(1),
      updatedAt: isoStr(1),
      submittedAt: null,
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 1, oldStatus: null, newStatus: 'DRAFT', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(1), notes: 'Requisition created' },
      ],
    },
    {
      id: 2,
      requisitionNumber: 'REQ-2026-0002',
      unitId: 4,
      requestedById: 12,
      requestedByName: 'Cpl Johnson',
      approvedById: null,
      supplyCatalogItemId: 2,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '9150-01-197-7688',
      dodic: null,
      nomenclature: 'LUBRICANT, WEAPONS (CLP)',
      quantityRequested: 48,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'BT',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Weapons maintenance prior to range week',
      denialReason: null,
      documentNumber: 'W81K4026R0002',
      createdAt: isoStr(5),
      updatedAt: isoStr(4),
      submittedAt: isoStr(4),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 2, oldStatus: null, newStatus: 'DRAFT', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(5), notes: 'Requisition created' },
        { id: 3, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(4), notes: 'Submitted for approval' },
      ],
    },
    {
      id: 3,
      requisitionNumber: 'REQ-2026-0003',
      unitId: 5,
      requestedById: 15,
      requestedByName: 'Sgt Williams',
      approvedById: null,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '6515-01-532-8056',
      dodic: null,
      nomenclature: 'FIRST AID KIT, INDIVIDUAL (IFAK)',
      quantityRequested: 30,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'KT',
      priority: '03' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'EMERGENCY: IFAKs expired, need replacement before deployment',
      denialReason: null,
      documentNumber: 'W81K4026R0003',
      createdAt: isoStr(3),
      updatedAt: isoStr(2),
      submittedAt: isoStr(2),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 4, oldStatus: null, newStatus: 'DRAFT', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(3), notes: 'Requisition created' },
        { id: 5, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(2), notes: 'Submitted - EMERGENCY priority' },
      ],
    },
    {
      id: 4,
      requisitionNumber: 'REQ-2026-0004',
      unitId: 4,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: 5,
      supplyCatalogItemId: 3,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '8405-01-547-2558',
      dodic: null,
      nomenclature: 'GLOVES, COLD WEATHER, INTERMEDIATE',
      quantityRequested: 60,
      quantityApproved: 60,
      quantityIssued: null,
      unitOfIssue: 'PR',
      priority: '06' as RequisitionPriority,
      status: 'APPROVED',
      justification: 'Mountain Warfare Training Center cold weather package',
      denialReason: null,
      documentNumber: 'W81K4026R0004',
      createdAt: isoStr(10),
      updatedAt: isoStr(7),
      submittedAt: isoStr(9),
      approvedAt: isoStr(7),
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: dateStr(-5),
      actualDeliveryDate: null,
      approvals: [
        { id: 1, approverId: 5, approverName: 'Capt Davis', action: 'APPROVE', comments: 'Approved per MWTC packing list', actionDate: isoStr(7) },
      ],
      statusHistory: [
        { id: 6, oldStatus: null, newStatus: 'DRAFT', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(10), notes: null },
        { id: 7, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(9), notes: null },
        { id: 8, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 5, changedByName: 'Capt Davis', changedAt: isoStr(7), notes: 'Approved per MWTC packing list' },
      ],
    },
    {
      id: 5,
      requisitionNumber: 'REQ-2026-0005',
      unitId: 4,
      requestedById: 12,
      requestedByName: 'Cpl Johnson',
      approvedById: 5,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '9130-00-160-1818',
      dodic: null,
      nomenclature: 'FUEL, DIESEL, DF-2',
      quantityRequested: 500,
      quantityApproved: 500,
      quantityIssued: null,
      unitOfIssue: 'GL',
      priority: '02' as RequisitionPriority,
      status: 'SOURCING',
      justification: 'URGENT: Convoy resupply for Operation Iron Hawk',
      denialReason: null,
      documentNumber: 'W81K4026R0005',
      createdAt: isoStr(8),
      updatedAt: isoStr(5),
      submittedAt: isoStr(7),
      approvedAt: isoStr(6),
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: dateStr(-2),
      actualDeliveryDate: null,
      approvals: [
        { id: 2, approverId: 5, approverName: 'Capt Davis', action: 'APPROVE', comments: 'Approved - coordinate with MLG for bulk delivery', actionDate: isoStr(6) },
      ],
      statusHistory: [
        { id: 9, oldStatus: null, newStatus: 'DRAFT', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(8), notes: null },
        { id: 10, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(7), notes: null },
        { id: 11, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 5, changedByName: 'Capt Davis', changedAt: isoStr(6), notes: null },
        { id: 12, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(5), notes: 'Coordinating with 1st MLG' },
      ],
    },
    {
      id: 6,
      requisitionNumber: 'REQ-2026-0006',
      unitId: 5,
      requestedById: 18,
      requestedByName: 'LCpl Ramirez',
      approvedById: 8,
      supplyCatalogItemId: null,
      ammoCatalogItemId: 1,
      equipmentCatalogItemId: null,
      nsn: '1305-01-480-6989',
      dodic: 'A059',
      nomenclature: 'CARTRIDGE, 5.56MM, BALL, M855',
      quantityRequested: 10000,
      quantityApproved: 8000,
      quantityIssued: 8000,
      unitOfIssue: 'RD',
      priority: '02' as RequisitionPriority,
      status: 'SHIPPED',
      justification: 'Range week qualification ammo',
      denialReason: null,
      documentNumber: 'W81K4026R0006',
      createdAt: isoStr(14),
      updatedAt: isoStr(3),
      submittedAt: isoStr(13),
      approvedAt: isoStr(11),
      shippedAt: isoStr(3),
      receivedAt: null,
      estimatedDeliveryDate: dateStr(-1),
      actualDeliveryDate: null,
      approvals: [
        { id: 3, approverId: 8, approverName: 'Maj Reynolds', action: 'APPROVE', comments: 'Approved 8000 rounds (reduced from 10000 per ammo allotment)', actionDate: isoStr(11) },
      ],
      statusHistory: [
        { id: 13, oldStatus: null, newStatus: 'DRAFT', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(14), notes: null },
        { id: 14, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(13), notes: null },
        { id: 15, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 8, changedByName: 'Maj Reynolds', changedAt: isoStr(11), notes: 'Qty reduced to 8000' },
        { id: 16, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(7), notes: null },
        { id: 17, oldStatus: 'SOURCING', newStatus: 'SHIPPED', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(3), notes: 'Shipped via LSA convoy' },
      ],
    },
    {
      id: 7,
      requisitionNumber: 'REQ-2026-0007',
      unitId: 4,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: 5,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '6545-01-539-6439',
      dodic: null,
      nomenclature: 'COMBAT GAUZE, HEMOSTATIC',
      quantityRequested: 100,
      quantityApproved: 100,
      quantityIssued: 100,
      unitOfIssue: 'EA',
      priority: '03' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'EMERGENCY: Restock after live fire exercise casualties treated',
      denialReason: null,
      documentNumber: 'W81K4026R0007',
      createdAt: isoStr(20),
      updatedAt: isoStr(2),
      submittedAt: isoStr(19),
      approvedAt: isoStr(18),
      shippedAt: isoStr(5),
      receivedAt: isoStr(2),
      estimatedDeliveryDate: dateStr(3),
      actualDeliveryDate: dateStr(2),
      approvals: [
        { id: 4, approverId: 5, approverName: 'Capt Davis', action: 'APPROVE', comments: 'EMERGENCY approved - expedite', actionDate: isoStr(18) },
      ],
      statusHistory: [
        { id: 18, oldStatus: null, newStatus: 'DRAFT', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(20), notes: null },
        { id: 19, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(19), notes: null },
        { id: 20, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 5, changedByName: 'Capt Davis', changedAt: isoStr(18), notes: 'EMERGENCY approved' },
        { id: 21, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(15), notes: null },
        { id: 22, oldStatus: 'SOURCING', newStatus: 'SHIPPED', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(5), notes: 'Express shipment via Class VIII push' },
        { id: 23, oldStatus: 'SHIPPED', newStatus: 'RECEIVED', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(2), notes: 'Received at BAS, qty verified' },
      ],
    },
    {
      id: 8,
      requisitionNumber: 'REQ-2026-0008',
      unitId: 5,
      requestedById: 15,
      requestedByName: 'Sgt Williams',
      approvedById: 8,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '2540-01-560-4518',
      dodic: null,
      nomenclature: 'TIRE, PNEUMATIC, HMMWV',
      quantityRequested: 8,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'EA',
      priority: '02' as RequisitionPriority,
      status: 'DENIED',
      justification: 'Replace worn tires on 4x HMMWV fleet',
      denialReason: 'Use DLA direct order per MCSF 4400 policy; not a unit-level requisition',
      documentNumber: 'W81K4026R0008',
      createdAt: isoStr(12),
      updatedAt: isoStr(9),
      submittedAt: isoStr(11),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [
        { id: 5, approverId: 8, approverName: 'Maj Reynolds', action: 'DENY', comments: 'Use DLA direct order per MCSF 4400 policy', actionDate: isoStr(9) },
      ],
      statusHistory: [
        { id: 24, oldStatus: null, newStatus: 'DRAFT', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(12), notes: null },
        { id: 25, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(11), notes: null },
        { id: 26, oldStatus: 'SUBMITTED', newStatus: 'DENIED', changedById: 8, changedByName: 'Maj Reynolds', changedAt: isoStr(9), notes: 'DLA direct order required' },
      ],
    },
    {
      id: 9,
      requisitionNumber: 'REQ-2026-0009',
      unitId: 4,
      requestedById: 12,
      requestedByName: 'Cpl Johnson',
      approvedById: null,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '8340-01-475-8850',
      dodic: null,
      nomenclature: 'TENT, COMBAT, 2-MAN (LITEFIGHTER)',
      quantityRequested: 15,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Replacement shelters for worn inventory prior to deployment',
      denialReason: null,
      documentNumber: 'W81K4026R0009',
      createdAt: isoStr(2),
      updatedAt: isoStr(1),
      submittedAt: isoStr(1),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 27, oldStatus: null, newStatus: 'DRAFT', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(2), notes: null },
        { id: 28, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(1), notes: null },
      ],
    },
    {
      id: 10,
      requisitionNumber: 'REQ-2026-0010',
      unitId: 5,
      requestedById: 18,
      requestedByName: 'LCpl Ramirez',
      approvedById: 8,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '7530-01-454-7220',
      dodic: null,
      nomenclature: 'MAP CASE, WATERPROOF',
      quantityRequested: 20,
      quantityApproved: 20,
      quantityIssued: 20,
      unitOfIssue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'Standard issue for platoon leadership',
      denialReason: null,
      documentNumber: 'W81K4026R0010',
      createdAt: isoStr(30),
      updatedAt: isoStr(10),
      submittedAt: isoStr(28),
      approvedAt: isoStr(25),
      shippedAt: isoStr(15),
      receivedAt: isoStr(10),
      estimatedDeliveryDate: dateStr(12),
      actualDeliveryDate: dateStr(10),
      approvals: [
        { id: 6, approverId: 8, approverName: 'Maj Reynolds', action: 'APPROVE', comments: null, actionDate: isoStr(25) },
      ],
      statusHistory: [
        { id: 29, oldStatus: null, newStatus: 'DRAFT', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(30), notes: null },
        { id: 30, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(28), notes: null },
        { id: 31, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 8, changedByName: 'Maj Reynolds', changedAt: isoStr(25), notes: null },
        { id: 32, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(20), notes: null },
        { id: 33, oldStatus: 'SOURCING', newStatus: 'SHIPPED', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(15), notes: null },
        { id: 34, oldStatus: 'SHIPPED', newStatus: 'RECEIVED', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(10), notes: 'All 20 received, condition serviceable' },
      ],
    },
    {
      id: 11,
      requisitionNumber: 'REQ-2026-0011',
      unitId: 4,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: null,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '8465-01-604-6541',
      dodic: null,
      nomenclature: 'PACK, FILBE MAIN (ILBE REPLACEMENT)',
      quantityRequested: 25,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'CANCELED',
      justification: 'Replace damaged packs from last deployment',
      denialReason: null,
      documentNumber: 'W81K4026R0011',
      createdAt: isoStr(15),
      updatedAt: isoStr(13),
      submittedAt: null,
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 35, oldStatus: null, newStatus: 'DRAFT', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(15), notes: null },
        { id: 36, oldStatus: 'DRAFT', newStatus: 'CANCELED', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(13), notes: 'Duplicate requisition — consolidated with REQ-2026-0015' },
      ],
    },
    {
      id: 12,
      requisitionNumber: 'REQ-2026-0012',
      unitId: 5,
      requestedById: 15,
      requestedByName: 'Sgt Williams',
      approvedById: 8,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '6850-00-281-1985',
      dodic: null,
      nomenclature: 'WATER PURIFICATION TABLETS',
      quantityRequested: 200,
      quantityApproved: 200,
      quantityIssued: null,
      unitOfIssue: 'BX',
      priority: '02' as RequisitionPriority,
      status: 'BACKORDERED',
      justification: 'URGENT: Water purification for field op, no potable water source',
      denialReason: null,
      documentNumber: 'W81K4026R0012',
      createdAt: isoStr(9),
      updatedAt: isoStr(4),
      submittedAt: isoStr(8),
      approvedAt: isoStr(7),
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: dateStr(-7),
      actualDeliveryDate: null,
      approvals: [
        { id: 7, approverId: 8, approverName: 'Maj Reynolds', action: 'APPROVE', comments: 'Approved, coordinate with BnAid for push package', actionDate: isoStr(7) },
      ],
      statusHistory: [
        { id: 37, oldStatus: null, newStatus: 'DRAFT', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(9), notes: null },
        { id: 38, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 15, changedByName: 'Sgt Williams', changedAt: isoStr(8), notes: null },
        { id: 39, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 8, changedByName: 'Maj Reynolds', changedAt: isoStr(7), notes: null },
        { id: 40, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(6), notes: null },
        { id: 41, oldStatus: 'SOURCING', newStatus: 'BACKORDERED', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(4), notes: 'Supply depot out of stock, ETA 7 days' },
      ],
    },
    {
      id: 13,
      requisitionNumber: 'REQ-2026-0013',
      unitId: 4,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: null,
      supplyCatalogItemId: null,
      ammoCatalogItemId: 2,
      equipmentCatalogItemId: null,
      nsn: '1315-01-482-4963',
      dodic: 'B519',
      nomenclature: 'GRENADE, HAND, SMOKE, GREEN (M18)',
      quantityRequested: 40,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Training grenades for squad leader course',
      denialReason: null,
      documentNumber: 'W81K4026R0013',
      createdAt: isoStr(3),
      updatedAt: isoStr(2),
      submittedAt: isoStr(2),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 42, oldStatus: null, newStatus: 'DRAFT', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(3), notes: null },
        { id: 43, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 10, changedByName: 'SSgt Martinez', changedAt: isoStr(2), notes: null },
      ],
    },
    {
      id: 14,
      requisitionNumber: 'REQ-2026-0014',
      unitId: 5,
      requestedById: 18,
      requestedByName: 'LCpl Ramirez',
      approvedById: 8,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '4240-01-516-4559',
      dodic: null,
      nomenclature: 'BALLISTIC EYEWEAR, ESS',
      quantityRequested: 45,
      quantityApproved: 45,
      quantityIssued: 45,
      unitOfIssue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'PPE issue for new joins',
      denialReason: null,
      documentNumber: 'W81K4026R0014',
      createdAt: isoStr(25),
      updatedAt: isoStr(8),
      submittedAt: isoStr(24),
      approvedAt: isoStr(22),
      shippedAt: isoStr(12),
      receivedAt: isoStr(8),
      estimatedDeliveryDate: dateStr(10),
      actualDeliveryDate: dateStr(8),
      approvals: [
        { id: 8, approverId: 8, approverName: 'Maj Reynolds', action: 'APPROVE', comments: null, actionDate: isoStr(22) },
      ],
      statusHistory: [
        { id: 44, oldStatus: null, newStatus: 'DRAFT', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(25), notes: null },
        { id: 45, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(24), notes: null },
        { id: 46, oldStatus: 'SUBMITTED', newStatus: 'APPROVED', changedById: 8, changedByName: 'Maj Reynolds', changedAt: isoStr(22), notes: null },
        { id: 47, oldStatus: 'APPROVED', newStatus: 'SOURCING', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(18), notes: null },
        { id: 48, oldStatus: 'SOURCING', newStatus: 'SHIPPED', changedById: 3, changedByName: 'GySgt Thompson', changedAt: isoStr(12), notes: null },
        { id: 49, oldStatus: 'SHIPPED', newStatus: 'RECEIVED', changedById: 18, changedByName: 'LCpl Ramirez', changedAt: isoStr(8), notes: 'All 45 pair received' },
      ],
    },
    {
      id: 15,
      requisitionNumber: 'REQ-2026-0015',
      unitId: 4,
      requestedById: 12,
      requestedByName: 'Cpl Johnson',
      approvedById: null,
      supplyCatalogItemId: null,
      ammoCatalogItemId: null,
      equipmentCatalogItemId: null,
      nsn: '8465-01-604-6541',
      dodic: null,
      nomenclature: 'PACK, FILBE MAIN (ILBE REPLACEMENT)',
      quantityRequested: 40,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: 'EA',
      priority: '02' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'URGENT: Consolidated replacement request for damaged packs across Bn',
      denialReason: null,
      documentNumber: 'W81K4026R0015',
      createdAt: isoStr(4),
      updatedAt: isoStr(3),
      submittedAt: isoStr(3),
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        { id: 50, oldStatus: null, newStatus: 'DRAFT', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(4), notes: null },
        { id: 51, oldStatus: 'DRAFT', newStatus: 'SUBMITTED', changedById: 12, changedByName: 'Cpl Johnson', changedAt: isoStr(3), notes: 'Consolidated from REQ-2026-0011' },
      ],
    },
  ];
}

function loadRequisitions(): Requisition[] {
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // First load: store initial data
  const initial = buildInitialRequisitions();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveRequisitions(reqs: Requisition[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reqs));
}

function getRequisitionsStore(): Requisition[] {
  return loadRequisitions();
}

function updateRequisition(id: number, updater: (req: Requisition) => Requisition): Requisition {
  const all = loadRequisitions();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Requisition ${id} not found`);
  all[idx] = updater(all[idx]);
  saveRequisitions(all);
  return all[idx];
}

// ---------------------------------------------------------------------------
// Mock Inventory Data
// ---------------------------------------------------------------------------

const MOCK_INVENTORY: InventoryRecord[] = [
  { id: 1, unitId: 4, location: 'BN SUPPLY WAREHOUSE A', nsn: '8970-00-149-1094', nomenclature: 'MEAL, READY-TO-EAT (MRE), CASE', unitOfIssue: 'CS', quantityOnHand: 240, quantityOnOrder: 120, quantityDueOut: 60, reorderPoint: 200, reorderQuantity: 300, lotNumber: 'MRE-2025-0847', expirationDate: dateStr(-180), conditionCode: 'A', lastInventoryDate: dateStr(2) },
  { id: 2, unitId: 4, location: 'BN ARMORY', nsn: '9150-01-197-7688', nomenclature: 'LUBRICANT, WEAPONS (CLP)', unitOfIssue: 'BT', quantityOnHand: 12, quantityOnOrder: 48, quantityDueOut: 0, reorderPoint: 24, reorderQuantity: 48, lotNumber: null, expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(5) },
  { id: 3, unitId: 4, location: 'BN SUPPLY WAREHOUSE B', nsn: '8405-01-547-2558', nomenclature: 'GLOVES, COLD WEATHER, INTERMEDIATE', unitOfIssue: 'PR', quantityOnHand: 85, quantityOnOrder: 0, quantityDueOut: 60, reorderPoint: 50, reorderQuantity: 100, lotNumber: null, expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(7) },
  { id: 4, unitId: 4, location: 'BN FUEL POINT', nsn: '9130-00-160-1818', nomenclature: 'FUEL, DIESEL, DF-2', unitOfIssue: 'GL', quantityOnHand: 2200, quantityOnOrder: 500, quantityDueOut: 800, reorderPoint: 2000, reorderQuantity: 3000, lotNumber: null, expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(1) },
  { id: 5, unitId: 4, location: 'BAS (BATTALION AID STATION)', nsn: '6545-01-539-6439', nomenclature: 'COMBAT GAUZE, HEMOSTATIC', unitOfIssue: 'EA', quantityOnHand: 150, quantityOnOrder: 0, quantityDueOut: 20, reorderPoint: 100, reorderQuantity: 200, lotNumber: 'CG-2025-1102', expirationDate: dateStr(-365), conditionCode: 'A', lastInventoryDate: dateStr(3) },
  { id: 6, unitId: 5, location: 'CO SUPPLY ROOM', nsn: '6515-01-532-8056', nomenclature: 'FIRST AID KIT, INDIVIDUAL (IFAK)', unitOfIssue: 'KT', quantityOnHand: 8, quantityOnOrder: 30, quantityDueOut: 25, reorderPoint: 30, reorderQuantity: 50, lotNumber: 'IFAK-2024-0219', expirationDate: dateStr(-90), conditionCode: 'A', lastInventoryDate: dateStr(4) },
  { id: 7, unitId: 5, location: 'CO SUPPLY ROOM', nsn: '8340-01-475-8850', nomenclature: 'TENT, COMBAT, 2-MAN (LITEFIGHTER)', unitOfIssue: 'EA', quantityOnHand: 32, quantityOnOrder: 0, quantityDueOut: 0, reorderPoint: 25, reorderQuantity: 40, lotNumber: null, expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(10) },
  { id: 8, unitId: 5, location: 'BN AMMO SUPPLY POINT', nsn: '1305-01-480-6989', nomenclature: 'CARTRIDGE, 5.56MM, BALL, M855', unitOfIssue: 'RD', quantityOnHand: 15000, quantityOnOrder: 8000, quantityDueOut: 5000, reorderPoint: 20000, reorderQuantity: 50000, lotNumber: 'LC-2025-556-0482', expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(1) },
  { id: 9, unitId: 4, location: 'BN SUPPLY WAREHOUSE A', nsn: '7530-01-454-7220', nomenclature: 'MAP CASE, WATERPROOF', unitOfIssue: 'EA', quantityOnHand: 45, quantityOnOrder: 0, quantityDueOut: 0, reorderPoint: 20, reorderQuantity: 30, lotNumber: null, expirationDate: null, conditionCode: 'A', lastInventoryDate: dateStr(15) },
  { id: 10, unitId: 5, location: 'CO SUPPLY ROOM', nsn: '6850-00-281-1985', nomenclature: 'WATER PURIFICATION TABLETS', unitOfIssue: 'BX', quantityOnHand: 15, quantityOnOrder: 200, quantityDueOut: 50, reorderPoint: 50, reorderQuantity: 200, lotNumber: 'WP-2025-0312', expirationDate: dateStr(-180), conditionCode: 'A', lastInventoryDate: dateStr(6) },
];

// ---------------------------------------------------------------------------
// Filter interfaces
// ---------------------------------------------------------------------------

export interface RequisitionFilters {
  status?: RequisitionStatus;
  priority?: RequisitionPriority;
  unitId?: number;
}

// ---------------------------------------------------------------------------
// API Functions — Requisitions
// ---------------------------------------------------------------------------

export async function getRequisitions(
  filters?: RequisitionFilters,
): Promise<Requisition[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...getRequisitionsStore()];
    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters?.priority) {
      results = results.filter((r) => r.priority === filters.priority);
    }
    if (filters?.unitId) {
      results = results.filter((r) => r.unitId === filters.unitId);
    }
    return results;
  }
  const response = await apiClient.get<{ data: Requisition[] }>('/requisitions', {
    params: filters,
  });
  return response.data.data;
}

export async function getRequisition(id: number): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    const req = getRequisitionsStore().find((r) => r.id === id);
    if (!req) throw new Error(`Requisition ${id} not found`);
    return { ...req };
  }
  const response = await apiClient.get<{ data: Requisition }>(`/requisitions/${id}`);
  return response.data.data;
}

export async function createRequisition(
  _unitId: number,
  data: Partial<Requisition>,
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    const all = loadRequisitions();
    const newReq: Requisition = {
      id: all.length + 1,
      requisitionNumber: `REQ-2026-${String(all.length + 1).padStart(4, '0')}`,
      unitId: _unitId,
      requestedById: 10,
      requestedByName: 'SSgt Martinez',
      approvedById: null,
      supplyCatalogItemId: data.supplyCatalogItemId ?? null,
      ammoCatalogItemId: data.ammoCatalogItemId ?? null,
      equipmentCatalogItemId: data.equipmentCatalogItemId ?? null,
      nsn: data.nsn ?? null,
      dodic: data.dodic ?? null,
      nomenclature: data.nomenclature ?? 'UNKNOWN ITEM',
      quantityRequested: data.quantityRequested ?? 1,
      quantityApproved: null,
      quantityIssued: null,
      unitOfIssue: data.unitOfIssue ?? 'EA',
      priority: data.priority ?? '06',
      status: 'DRAFT',
      justification: data.justification ?? null,
      denialReason: null,
      documentNumber: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null,
      approvedAt: null,
      shippedAt: null,
      receivedAt: null,
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      approvals: [],
      statusHistory: [
        {
          id: Date.now(),
          oldStatus: null,
          newStatus: 'DRAFT',
          changedById: 10,
          changedByName: 'SSgt Martinez',
          changedAt: new Date().toISOString(),
          notes: 'Requisition created',
        },
      ],
    };
    all.push(newReq);
    saveRequisitions(all);
    return { ...newReq };
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/units/${_unitId}/requisitions`,
    data,
  );
  return response.data.data;
}

export async function submitRequisition(id: number): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'SUBMITTED' as RequisitionStatus,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentNumber: `W81K4026R${String(id).padStart(4, '0')}`,
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'SUBMITTED' as RequisitionStatus,
          changedById: req.requestedById,
          changedByName: req.requestedByName,
          changedAt: new Date().toISOString(),
          notes: 'Submitted for approval',
        },
      ],
    }));
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/requisitions/${id}/submit`,
  );
  return response.data.data;
}

export async function approveRequisition(
  id: number,
  data: { quantityApproved?: number; comments?: string },
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'APPROVED' as RequisitionStatus,
      quantityApproved: data.quantityApproved ?? req.quantityRequested,
      approvedAt: new Date().toISOString(),
      approvedById: 5,
      updatedAt: new Date().toISOString(),
      approvals: [
        ...(req.approvals ?? []),
        {
          id: Date.now(),
          approverId: 5,
          approverName: 'Capt Davis',
          action: 'APPROVE' as const,
          comments: data.comments ?? 'Approved',
          actionDate: new Date().toISOString(),
        },
      ],
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'APPROVED' as RequisitionStatus,
          changedById: 5,
          changedByName: 'Capt Davis',
          changedAt: new Date().toISOString(),
          notes: data.comments ?? 'Approved',
        },
      ],
    }));
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/requisitions/${id}/approve`,
    data,
  );
  return response.data.data;
}

export async function denyRequisition(
  id: number,
  data: { reason: string },
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'DENIED' as RequisitionStatus,
      denialReason: data.reason,
      updatedAt: new Date().toISOString(),
      approvals: [
        ...(req.approvals ?? []),
        {
          id: Date.now(),
          approverId: 5,
          approverName: 'Capt Davis',
          action: 'DENY' as const,
          comments: data.reason,
          actionDate: new Date().toISOString(),
        },
      ],
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'DENIED' as RequisitionStatus,
          changedById: 5,
          changedByName: 'Capt Davis',
          changedAt: new Date().toISOString(),
          notes: data.reason,
        },
      ],
    }));
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/requisitions/${id}/deny`,
    data,
  );
  return response.data.data;
}

export async function processRequisition(id: number, notes?: string): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'SOURCING' as RequisitionStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'SOURCING' as RequisitionStatus,
          changedById: 3,
          changedByName: 'GySgt Thompson',
          changedAt: new Date().toISOString(),
          notes: notes ?? 'Processing - sourcing materials',
        },
      ],
    }));
  }
  const response = await apiClient.put<{ data: Requisition }>(`/requisitions/${id}/process`);
  return response.data.data;
}

export async function shipRequisition(id: number, notes?: string): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'SHIPPED' as RequisitionStatus,
      shippedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDeliveryDate: dateStr(-3),
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'SHIPPED' as RequisitionStatus,
          changedById: 3,
          changedByName: 'GySgt Thompson',
          changedAt: new Date().toISOString(),
          notes: notes ?? 'Shipped',
        },
      ],
    }));
  }
  const response = await apiClient.put<{ data: Requisition }>(`/requisitions/${id}/ship`);
  return response.data.data;
}

export async function receiveRequisition(
  id: number,
  data: { quantity_received?: number; notes?: string },
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'RECEIVED' as RequisitionStatus,
      receivedAt: new Date().toISOString(),
      actualDeliveryDate: new Date().toISOString().split('T')[0],
      quantityIssued: data.quantity_received ?? req.quantityApproved ?? req.quantityRequested,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'RECEIVED' as RequisitionStatus,
          changedById: req.requestedById,
          changedByName: req.requestedByName,
          changedAt: new Date().toISOString(),
          notes: data.notes ?? 'Received and verified',
        },
      ],
    }));
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/requisitions/${id}/receive`,
    data,
  );
  return response.data.data;
}

export async function cancelRequisition(
  id: number,
  reason?: string,
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'CANCELED' as RequisitionStatus,
      updatedAt: new Date().toISOString(),
      denialReason: reason ?? req.denialReason,
      statusHistory: [
        ...(req.statusHistory ?? []),
        {
          id: Date.now(),
          oldStatus: req.status,
          newStatus: 'CANCELED' as RequisitionStatus,
          changedById: req.requestedById,
          changedByName: req.requestedByName,
          changedAt: new Date().toISOString(),
          notes: reason ?? 'Canceled',
        },
      ],
    }));
  }
  const response = await apiClient.post<{ data: Requisition }>(
    `/requisitions/${id}/cancel`,
    { reason },
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// API Functions — Requisition Analytics
// ---------------------------------------------------------------------------

export async function getRequisitionAnalytics(): Promise<RequisitionAnalytics> {
  if (isDemoMode) {
    await mockDelay();
    const all = getRequisitionsStore();
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const r of all) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
    }
    const fulfilled = all.filter((r) => r.status === 'RECEIVED').length;
    const denied = all.filter((r) => r.status === 'DENIED').length;
    const canceled = all.filter((r) => r.status === 'CANCELED').length;
    const active = all.filter((r) => !['RECEIVED', 'DENIED', 'CANCELED'].includes(r.status)).length;
    const total = all.length;

    // Generate trend data for last 30 days
    const recentTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      // Seeded values for consistency
      const seed = (i * 7 + 13) % 5;
      recentTrend.push({ date: ds, submitted: seed + 1, fulfilled: Math.max(0, seed - 1) });
    }

    return {
      summary: {
        total,
        active,
        fulfilled,
        denied,
        canceled,
        approvalRate: total > 0 ? Math.round(((total - denied - canceled) / total) * 100) : 0,
      },
      byStatus,
      byPriority,
      bySupplyClass: [
        { supplyClass: 'CL I', count: 3, fulfilled: 1 },
        { supplyClass: 'CL II', count: 4, fulfilled: 2 },
        { supplyClass: 'CL III', count: 2, fulfilled: 1 },
        { supplyClass: 'CL V', count: 3, fulfilled: 1 },
        { supplyClass: 'CL VIII', count: 2, fulfilled: 2 },
        { supplyClass: 'CL IX', count: 1, fulfilled: 0 },
      ],
      avgFulfillmentDays: 12.3,
      recentTrend,
    };
  }
  const response = await apiClient.get<{ data: RequisitionAnalytics }>('/requisitions/analytics/summary');
  return response.data.data;
}

// ---------------------------------------------------------------------------
// API Functions — Inventory
// ---------------------------------------------------------------------------

export async function getInventory(unitId?: number): Promise<InventoryRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) {
      return MOCK_INVENTORY.filter((r) => r.unitId === unitId);
    }
    return [...MOCK_INVENTORY];
  }
  const response = await apiClient.get<{ data: InventoryRecord[] }>('/inventory', {
    params: unitId ? { unitId: unitId } : undefined,
  });
  return response.data.data;
}

export async function getLowStockAlerts(unitId?: number): Promise<LowStockAlert[]> {
  if (isDemoMode) {
    await mockDelay();
    let items = MOCK_INVENTORY;
    if (unitId) {
      items = items.filter((r) => r.unitId === unitId);
    }
    return items
      .filter((r) => r.reorderPoint !== null && r.quantityOnHand < r.reorderPoint!)
      .map((r) => ({
        inventoryRecordId: r.id,
        unitId: r.unitId,
        location: r.location,
        nomenclature: r.nomenclature,
        quantityOnHand: r.quantityOnHand,
        reorderPoint: r.reorderPoint!,
        quantityBelow: r.reorderPoint! - r.quantityOnHand,
        lastInventoryDate: r.lastInventoryDate,
      }));
  }
  const response = await apiClient.get<{ data: LowStockAlert[] }>(
    '/inventory/low-stock',
    { params: unitId ? { unitId: unitId } : undefined },
  );
  return response.data.data;
}

export async function recordTransaction(data: {
  inventoryRecordId: number;
  transactionType: TransactionType;
  quantity: number;
  requisitionId?: number;
  notes?: string;
}): Promise<InventoryTransaction> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: Math.floor(Math.random() * 10000),
      inventoryRecordId: data.inventoryRecordId,
      transactionType: data.transactionType,
      quantity: data.quantity,
      requisitionId: data.requisitionId ?? null,
      performedById: 10,
      transactionDate: new Date().toISOString(),
      documentNumber: null,
      notes: data.notes ?? null,
    };
  }
  const response = await apiClient.post<{ data: InventoryTransaction }>(
    '/inventory/transactions',
    data,
  );
  return response.data.data;
}
