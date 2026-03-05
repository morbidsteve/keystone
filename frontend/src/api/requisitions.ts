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
      requisition_number: 'REQ-2026-0001',
      unit_id: 4,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: null,
      supply_catalog_item_id: 1,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '8970-00-149-1094',
      dodic: null,
      nomenclature: 'MEAL, READY-TO-EAT (MRE), CASE',
      quantity_requested: 120,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'CS',
      priority: '06' as RequisitionPriority,
      status: 'DRAFT',
      justification: 'Resupply for upcoming field exercise, 3-day FEX support',
      denial_reason: null,
      document_number: null,
      created_at: isoStr(1),
      updated_at: isoStr(1),
      submitted_at: null,
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 1, old_status: null, new_status: 'DRAFT', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(1), notes: 'Requisition created' },
      ],
    },
    {
      id: 2,
      requisition_number: 'REQ-2026-0002',
      unit_id: 4,
      requested_by_id: 12,
      requested_by_name: 'Cpl Johnson',
      approved_by_id: null,
      supply_catalog_item_id: 2,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '9150-01-197-7688',
      dodic: null,
      nomenclature: 'LUBRICANT, WEAPONS (CLP)',
      quantity_requested: 48,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'BT',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Weapons maintenance prior to range week',
      denial_reason: null,
      document_number: 'W81K4026R0002',
      created_at: isoStr(5),
      updated_at: isoStr(4),
      submitted_at: isoStr(4),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 2, old_status: null, new_status: 'DRAFT', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(5), notes: 'Requisition created' },
        { id: 3, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(4), notes: 'Submitted for approval' },
      ],
    },
    {
      id: 3,
      requisition_number: 'REQ-2026-0003',
      unit_id: 5,
      requested_by_id: 15,
      requested_by_name: 'Sgt Williams',
      approved_by_id: null,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '6515-01-532-8056',
      dodic: null,
      nomenclature: 'FIRST AID KIT, INDIVIDUAL (IFAK)',
      quantity_requested: 30,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'KT',
      priority: '03' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'EMERGENCY: IFAKs expired, need replacement before deployment',
      denial_reason: null,
      document_number: 'W81K4026R0003',
      created_at: isoStr(3),
      updated_at: isoStr(2),
      submitted_at: isoStr(2),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 4, old_status: null, new_status: 'DRAFT', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(3), notes: 'Requisition created' },
        { id: 5, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(2), notes: 'Submitted - EMERGENCY priority' },
      ],
    },
    {
      id: 4,
      requisition_number: 'REQ-2026-0004',
      unit_id: 4,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: 5,
      supply_catalog_item_id: 3,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '8405-01-547-2558',
      dodic: null,
      nomenclature: 'GLOVES, COLD WEATHER, INTERMEDIATE',
      quantity_requested: 60,
      quantity_approved: 60,
      quantity_issued: null,
      unit_of_issue: 'PR',
      priority: '06' as RequisitionPriority,
      status: 'APPROVED',
      justification: 'Mountain Warfare Training Center cold weather package',
      denial_reason: null,
      document_number: 'W81K4026R0004',
      created_at: isoStr(10),
      updated_at: isoStr(7),
      submitted_at: isoStr(9),
      approved_at: isoStr(7),
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: dateStr(-5),
      actual_delivery_date: null,
      approvals: [
        { id: 1, approver_id: 5, approver_name: 'Capt Davis', action: 'APPROVE', comments: 'Approved per MWTC packing list', action_date: isoStr(7) },
      ],
      status_history: [
        { id: 6, old_status: null, new_status: 'DRAFT', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(10), notes: null },
        { id: 7, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(9), notes: null },
        { id: 8, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 5, changed_by_name: 'Capt Davis', changed_at: isoStr(7), notes: 'Approved per MWTC packing list' },
      ],
    },
    {
      id: 5,
      requisition_number: 'REQ-2026-0005',
      unit_id: 4,
      requested_by_id: 12,
      requested_by_name: 'Cpl Johnson',
      approved_by_id: 5,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '9130-00-160-1818',
      dodic: null,
      nomenclature: 'FUEL, DIESEL, DF-2',
      quantity_requested: 500,
      quantity_approved: 500,
      quantity_issued: null,
      unit_of_issue: 'GL',
      priority: '02' as RequisitionPriority,
      status: 'SOURCING',
      justification: 'URGENT: Convoy resupply for Operation Iron Hawk',
      denial_reason: null,
      document_number: 'W81K4026R0005',
      created_at: isoStr(8),
      updated_at: isoStr(5),
      submitted_at: isoStr(7),
      approved_at: isoStr(6),
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: dateStr(-2),
      actual_delivery_date: null,
      approvals: [
        { id: 2, approver_id: 5, approver_name: 'Capt Davis', action: 'APPROVE', comments: 'Approved - coordinate with MLG for bulk delivery', action_date: isoStr(6) },
      ],
      status_history: [
        { id: 9, old_status: null, new_status: 'DRAFT', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(8), notes: null },
        { id: 10, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(7), notes: null },
        { id: 11, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 5, changed_by_name: 'Capt Davis', changed_at: isoStr(6), notes: null },
        { id: 12, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(5), notes: 'Coordinating with 1st MLG' },
      ],
    },
    {
      id: 6,
      requisition_number: 'REQ-2026-0006',
      unit_id: 5,
      requested_by_id: 18,
      requested_by_name: 'LCpl Ramirez',
      approved_by_id: 8,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: 1,
      equipment_catalog_item_id: null,
      nsn: '1305-01-480-6989',
      dodic: 'A059',
      nomenclature: 'CARTRIDGE, 5.56MM, BALL, M855',
      quantity_requested: 10000,
      quantity_approved: 8000,
      quantity_issued: 8000,
      unit_of_issue: 'RD',
      priority: '02' as RequisitionPriority,
      status: 'SHIPPED',
      justification: 'Range week qualification ammo',
      denial_reason: null,
      document_number: 'W81K4026R0006',
      created_at: isoStr(14),
      updated_at: isoStr(3),
      submitted_at: isoStr(13),
      approved_at: isoStr(11),
      shipped_at: isoStr(3),
      received_at: null,
      estimated_delivery_date: dateStr(-1),
      actual_delivery_date: null,
      approvals: [
        { id: 3, approver_id: 8, approver_name: 'Maj Reynolds', action: 'APPROVE', comments: 'Approved 8000 rounds (reduced from 10000 per ammo allotment)', action_date: isoStr(11) },
      ],
      status_history: [
        { id: 13, old_status: null, new_status: 'DRAFT', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(14), notes: null },
        { id: 14, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(13), notes: null },
        { id: 15, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 8, changed_by_name: 'Maj Reynolds', changed_at: isoStr(11), notes: 'Qty reduced to 8000' },
        { id: 16, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(7), notes: null },
        { id: 17, old_status: 'SOURCING', new_status: 'SHIPPED', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(3), notes: 'Shipped via LSA convoy' },
      ],
    },
    {
      id: 7,
      requisition_number: 'REQ-2026-0007',
      unit_id: 4,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: 5,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '6545-01-539-6439',
      dodic: null,
      nomenclature: 'COMBAT GAUZE, HEMOSTATIC',
      quantity_requested: 100,
      quantity_approved: 100,
      quantity_issued: 100,
      unit_of_issue: 'EA',
      priority: '03' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'EMERGENCY: Restock after live fire exercise casualties treated',
      denial_reason: null,
      document_number: 'W81K4026R0007',
      created_at: isoStr(20),
      updated_at: isoStr(2),
      submitted_at: isoStr(19),
      approved_at: isoStr(18),
      shipped_at: isoStr(5),
      received_at: isoStr(2),
      estimated_delivery_date: dateStr(3),
      actual_delivery_date: dateStr(2),
      approvals: [
        { id: 4, approver_id: 5, approver_name: 'Capt Davis', action: 'APPROVE', comments: 'EMERGENCY approved - expedite', action_date: isoStr(18) },
      ],
      status_history: [
        { id: 18, old_status: null, new_status: 'DRAFT', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(20), notes: null },
        { id: 19, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(19), notes: null },
        { id: 20, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 5, changed_by_name: 'Capt Davis', changed_at: isoStr(18), notes: 'EMERGENCY approved' },
        { id: 21, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(15), notes: null },
        { id: 22, old_status: 'SOURCING', new_status: 'SHIPPED', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(5), notes: 'Express shipment via Class VIII push' },
        { id: 23, old_status: 'SHIPPED', new_status: 'RECEIVED', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(2), notes: 'Received at BAS, qty verified' },
      ],
    },
    {
      id: 8,
      requisition_number: 'REQ-2026-0008',
      unit_id: 5,
      requested_by_id: 15,
      requested_by_name: 'Sgt Williams',
      approved_by_id: 8,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '2540-01-560-4518',
      dodic: null,
      nomenclature: 'TIRE, PNEUMATIC, HMMWV',
      quantity_requested: 8,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'EA',
      priority: '02' as RequisitionPriority,
      status: 'DENIED',
      justification: 'Replace worn tires on 4x HMMWV fleet',
      denial_reason: 'Use DLA direct order per MCSF 4400 policy; not a unit-level requisition',
      document_number: 'W81K4026R0008',
      created_at: isoStr(12),
      updated_at: isoStr(9),
      submitted_at: isoStr(11),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [
        { id: 5, approver_id: 8, approver_name: 'Maj Reynolds', action: 'DENY', comments: 'Use DLA direct order per MCSF 4400 policy', action_date: isoStr(9) },
      ],
      status_history: [
        { id: 24, old_status: null, new_status: 'DRAFT', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(12), notes: null },
        { id: 25, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(11), notes: null },
        { id: 26, old_status: 'SUBMITTED', new_status: 'DENIED', changed_by_id: 8, changed_by_name: 'Maj Reynolds', changed_at: isoStr(9), notes: 'DLA direct order required' },
      ],
    },
    {
      id: 9,
      requisition_number: 'REQ-2026-0009',
      unit_id: 4,
      requested_by_id: 12,
      requested_by_name: 'Cpl Johnson',
      approved_by_id: null,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '8340-01-475-8850',
      dodic: null,
      nomenclature: 'TENT, COMBAT, 2-MAN (LITEFIGHTER)',
      quantity_requested: 15,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Replacement shelters for worn inventory prior to deployment',
      denial_reason: null,
      document_number: 'W81K4026R0009',
      created_at: isoStr(2),
      updated_at: isoStr(1),
      submitted_at: isoStr(1),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 27, old_status: null, new_status: 'DRAFT', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(2), notes: null },
        { id: 28, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(1), notes: null },
      ],
    },
    {
      id: 10,
      requisition_number: 'REQ-2026-0010',
      unit_id: 5,
      requested_by_id: 18,
      requested_by_name: 'LCpl Ramirez',
      approved_by_id: 8,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '7530-01-454-7220',
      dodic: null,
      nomenclature: 'MAP CASE, WATERPROOF',
      quantity_requested: 20,
      quantity_approved: 20,
      quantity_issued: 20,
      unit_of_issue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'Standard issue for platoon leadership',
      denial_reason: null,
      document_number: 'W81K4026R0010',
      created_at: isoStr(30),
      updated_at: isoStr(10),
      submitted_at: isoStr(28),
      approved_at: isoStr(25),
      shipped_at: isoStr(15),
      received_at: isoStr(10),
      estimated_delivery_date: dateStr(12),
      actual_delivery_date: dateStr(10),
      approvals: [
        { id: 6, approver_id: 8, approver_name: 'Maj Reynolds', action: 'APPROVE', comments: null, action_date: isoStr(25) },
      ],
      status_history: [
        { id: 29, old_status: null, new_status: 'DRAFT', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(30), notes: null },
        { id: 30, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(28), notes: null },
        { id: 31, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 8, changed_by_name: 'Maj Reynolds', changed_at: isoStr(25), notes: null },
        { id: 32, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(20), notes: null },
        { id: 33, old_status: 'SOURCING', new_status: 'SHIPPED', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(15), notes: null },
        { id: 34, old_status: 'SHIPPED', new_status: 'RECEIVED', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(10), notes: 'All 20 received, condition serviceable' },
      ],
    },
    {
      id: 11,
      requisition_number: 'REQ-2026-0011',
      unit_id: 4,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: null,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '8465-01-604-6541',
      dodic: null,
      nomenclature: 'PACK, FILBE MAIN (ILBE REPLACEMENT)',
      quantity_requested: 25,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'CANCELED',
      justification: 'Replace damaged packs from last deployment',
      denial_reason: null,
      document_number: 'W81K4026R0011',
      created_at: isoStr(15),
      updated_at: isoStr(13),
      submitted_at: null,
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 35, old_status: null, new_status: 'DRAFT', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(15), notes: null },
        { id: 36, old_status: 'DRAFT', new_status: 'CANCELED', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(13), notes: 'Duplicate requisition — consolidated with REQ-2026-0015' },
      ],
    },
    {
      id: 12,
      requisition_number: 'REQ-2026-0012',
      unit_id: 5,
      requested_by_id: 15,
      requested_by_name: 'Sgt Williams',
      approved_by_id: 8,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '6850-00-281-1985',
      dodic: null,
      nomenclature: 'WATER PURIFICATION TABLETS',
      quantity_requested: 200,
      quantity_approved: 200,
      quantity_issued: null,
      unit_of_issue: 'BX',
      priority: '02' as RequisitionPriority,
      status: 'BACKORDERED',
      justification: 'URGENT: Water purification for field op, no potable water source',
      denial_reason: null,
      document_number: 'W81K4026R0012',
      created_at: isoStr(9),
      updated_at: isoStr(4),
      submitted_at: isoStr(8),
      approved_at: isoStr(7),
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: dateStr(-7),
      actual_delivery_date: null,
      approvals: [
        { id: 7, approver_id: 8, approver_name: 'Maj Reynolds', action: 'APPROVE', comments: 'Approved, coordinate with BnAid for push package', action_date: isoStr(7) },
      ],
      status_history: [
        { id: 37, old_status: null, new_status: 'DRAFT', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(9), notes: null },
        { id: 38, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 15, changed_by_name: 'Sgt Williams', changed_at: isoStr(8), notes: null },
        { id: 39, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 8, changed_by_name: 'Maj Reynolds', changed_at: isoStr(7), notes: null },
        { id: 40, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(6), notes: null },
        { id: 41, old_status: 'SOURCING', new_status: 'BACKORDERED', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(4), notes: 'Supply depot out of stock, ETA 7 days' },
      ],
    },
    {
      id: 13,
      requisition_number: 'REQ-2026-0013',
      unit_id: 4,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: null,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: 2,
      equipment_catalog_item_id: null,
      nsn: '1315-01-482-4963',
      dodic: 'B519',
      nomenclature: 'GRENADE, HAND, SMOKE, GREEN (M18)',
      quantity_requested: 40,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'Training grenades for squad leader course',
      denial_reason: null,
      document_number: 'W81K4026R0013',
      created_at: isoStr(3),
      updated_at: isoStr(2),
      submitted_at: isoStr(2),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 42, old_status: null, new_status: 'DRAFT', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(3), notes: null },
        { id: 43, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 10, changed_by_name: 'SSgt Martinez', changed_at: isoStr(2), notes: null },
      ],
    },
    {
      id: 14,
      requisition_number: 'REQ-2026-0014',
      unit_id: 5,
      requested_by_id: 18,
      requested_by_name: 'LCpl Ramirez',
      approved_by_id: 8,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '4240-01-516-4559',
      dodic: null,
      nomenclature: 'BALLISTIC EYEWEAR, ESS',
      quantity_requested: 45,
      quantity_approved: 45,
      quantity_issued: 45,
      unit_of_issue: 'EA',
      priority: '06' as RequisitionPriority,
      status: 'RECEIVED',
      justification: 'PPE issue for new joins',
      denial_reason: null,
      document_number: 'W81K4026R0014',
      created_at: isoStr(25),
      updated_at: isoStr(8),
      submitted_at: isoStr(24),
      approved_at: isoStr(22),
      shipped_at: isoStr(12),
      received_at: isoStr(8),
      estimated_delivery_date: dateStr(10),
      actual_delivery_date: dateStr(8),
      approvals: [
        { id: 8, approver_id: 8, approver_name: 'Maj Reynolds', action: 'APPROVE', comments: null, action_date: isoStr(22) },
      ],
      status_history: [
        { id: 44, old_status: null, new_status: 'DRAFT', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(25), notes: null },
        { id: 45, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(24), notes: null },
        { id: 46, old_status: 'SUBMITTED', new_status: 'APPROVED', changed_by_id: 8, changed_by_name: 'Maj Reynolds', changed_at: isoStr(22), notes: null },
        { id: 47, old_status: 'APPROVED', new_status: 'SOURCING', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(18), notes: null },
        { id: 48, old_status: 'SOURCING', new_status: 'SHIPPED', changed_by_id: 3, changed_by_name: 'GySgt Thompson', changed_at: isoStr(12), notes: null },
        { id: 49, old_status: 'SHIPPED', new_status: 'RECEIVED', changed_by_id: 18, changed_by_name: 'LCpl Ramirez', changed_at: isoStr(8), notes: 'All 45 pair received' },
      ],
    },
    {
      id: 15,
      requisition_number: 'REQ-2026-0015',
      unit_id: 4,
      requested_by_id: 12,
      requested_by_name: 'Cpl Johnson',
      approved_by_id: null,
      supply_catalog_item_id: null,
      ammo_catalog_item_id: null,
      equipment_catalog_item_id: null,
      nsn: '8465-01-604-6541',
      dodic: null,
      nomenclature: 'PACK, FILBE MAIN (ILBE REPLACEMENT)',
      quantity_requested: 40,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: 'EA',
      priority: '02' as RequisitionPriority,
      status: 'SUBMITTED',
      justification: 'URGENT: Consolidated replacement request for damaged packs across Bn',
      denial_reason: null,
      document_number: 'W81K4026R0015',
      created_at: isoStr(4),
      updated_at: isoStr(3),
      submitted_at: isoStr(3),
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        { id: 50, old_status: null, new_status: 'DRAFT', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(4), notes: null },
        { id: 51, old_status: 'DRAFT', new_status: 'SUBMITTED', changed_by_id: 12, changed_by_name: 'Cpl Johnson', changed_at: isoStr(3), notes: 'Consolidated from REQ-2026-0011' },
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
  { id: 1, unit_id: 4, location: 'BN SUPPLY WAREHOUSE A', nsn: '8970-00-149-1094', nomenclature: 'MEAL, READY-TO-EAT (MRE), CASE', unit_of_issue: 'CS', quantity_on_hand: 240, quantity_on_order: 120, quantity_due_out: 60, reorder_point: 200, reorder_quantity: 300, lot_number: 'MRE-2025-0847', expiration_date: dateStr(-180), condition_code: 'A', last_inventory_date: dateStr(2) },
  { id: 2, unit_id: 4, location: 'BN ARMORY', nsn: '9150-01-197-7688', nomenclature: 'LUBRICANT, WEAPONS (CLP)', unit_of_issue: 'BT', quantity_on_hand: 12, quantity_on_order: 48, quantity_due_out: 0, reorder_point: 24, reorder_quantity: 48, lot_number: null, expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(5) },
  { id: 3, unit_id: 4, location: 'BN SUPPLY WAREHOUSE B', nsn: '8405-01-547-2558', nomenclature: 'GLOVES, COLD WEATHER, INTERMEDIATE', unit_of_issue: 'PR', quantity_on_hand: 85, quantity_on_order: 0, quantity_due_out: 60, reorder_point: 50, reorder_quantity: 100, lot_number: null, expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(7) },
  { id: 4, unit_id: 4, location: 'BN FUEL POINT', nsn: '9130-00-160-1818', nomenclature: 'FUEL, DIESEL, DF-2', unit_of_issue: 'GL', quantity_on_hand: 2200, quantity_on_order: 500, quantity_due_out: 800, reorder_point: 2000, reorder_quantity: 3000, lot_number: null, expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(1) },
  { id: 5, unit_id: 4, location: 'BAS (BATTALION AID STATION)', nsn: '6545-01-539-6439', nomenclature: 'COMBAT GAUZE, HEMOSTATIC', unit_of_issue: 'EA', quantity_on_hand: 150, quantity_on_order: 0, quantity_due_out: 20, reorder_point: 100, reorder_quantity: 200, lot_number: 'CG-2025-1102', expiration_date: dateStr(-365), condition_code: 'A', last_inventory_date: dateStr(3) },
  { id: 6, unit_id: 5, location: 'CO SUPPLY ROOM', nsn: '6515-01-532-8056', nomenclature: 'FIRST AID KIT, INDIVIDUAL (IFAK)', unit_of_issue: 'KT', quantity_on_hand: 8, quantity_on_order: 30, quantity_due_out: 25, reorder_point: 30, reorder_quantity: 50, lot_number: 'IFAK-2024-0219', expiration_date: dateStr(-90), condition_code: 'A', last_inventory_date: dateStr(4) },
  { id: 7, unit_id: 5, location: 'CO SUPPLY ROOM', nsn: '8340-01-475-8850', nomenclature: 'TENT, COMBAT, 2-MAN (LITEFIGHTER)', unit_of_issue: 'EA', quantity_on_hand: 32, quantity_on_order: 0, quantity_due_out: 0, reorder_point: 25, reorder_quantity: 40, lot_number: null, expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(10) },
  { id: 8, unit_id: 5, location: 'BN AMMO SUPPLY POINT', nsn: '1305-01-480-6989', nomenclature: 'CARTRIDGE, 5.56MM, BALL, M855', unit_of_issue: 'RD', quantity_on_hand: 15000, quantity_on_order: 8000, quantity_due_out: 5000, reorder_point: 20000, reorder_quantity: 50000, lot_number: 'LC-2025-556-0482', expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(1) },
  { id: 9, unit_id: 4, location: 'BN SUPPLY WAREHOUSE A', nsn: '7530-01-454-7220', nomenclature: 'MAP CASE, WATERPROOF', unit_of_issue: 'EA', quantity_on_hand: 45, quantity_on_order: 0, quantity_due_out: 0, reorder_point: 20, reorder_quantity: 30, lot_number: null, expiration_date: null, condition_code: 'A', last_inventory_date: dateStr(15) },
  { id: 10, unit_id: 5, location: 'CO SUPPLY ROOM', nsn: '6850-00-281-1985', nomenclature: 'WATER PURIFICATION TABLETS', unit_of_issue: 'BX', quantity_on_hand: 15, quantity_on_order: 200, quantity_due_out: 50, reorder_point: 50, reorder_quantity: 200, lot_number: 'WP-2025-0312', expiration_date: dateStr(-180), condition_code: 'A', last_inventory_date: dateStr(6) },
];

// ---------------------------------------------------------------------------
// Filter interfaces
// ---------------------------------------------------------------------------

export interface RequisitionFilters {
  status?: RequisitionStatus;
  priority?: RequisitionPriority;
  unit_id?: number;
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
    if (filters?.unit_id) {
      results = results.filter((r) => r.unit_id === filters.unit_id);
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
      requisition_number: `REQ-2026-${String(all.length + 1).padStart(4, '0')}`,
      unit_id: _unitId,
      requested_by_id: 10,
      requested_by_name: 'SSgt Martinez',
      approved_by_id: null,
      supply_catalog_item_id: data.supply_catalog_item_id ?? null,
      ammo_catalog_item_id: data.ammo_catalog_item_id ?? null,
      equipment_catalog_item_id: data.equipment_catalog_item_id ?? null,
      nsn: data.nsn ?? null,
      dodic: data.dodic ?? null,
      nomenclature: data.nomenclature ?? 'UNKNOWN ITEM',
      quantity_requested: data.quantity_requested ?? 1,
      quantity_approved: null,
      quantity_issued: null,
      unit_of_issue: data.unit_of_issue ?? 'EA',
      priority: data.priority ?? '06',
      status: 'DRAFT',
      justification: data.justification ?? null,
      denial_reason: null,
      document_number: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: null,
      approved_at: null,
      shipped_at: null,
      received_at: null,
      estimated_delivery_date: null,
      actual_delivery_date: null,
      approvals: [],
      status_history: [
        {
          id: Date.now(),
          old_status: null,
          new_status: 'DRAFT',
          changed_by_id: 10,
          changed_by_name: 'SSgt Martinez',
          changed_at: new Date().toISOString(),
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
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_number: `W81K4026R${String(id).padStart(4, '0')}`,
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'SUBMITTED' as RequisitionStatus,
          changed_by_id: req.requested_by_id,
          changed_by_name: req.requested_by_name,
          changed_at: new Date().toISOString(),
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
  data: { quantity_approved?: number; comments?: string },
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    return updateRequisition(id, (req) => ({
      ...req,
      status: 'APPROVED' as RequisitionStatus,
      quantity_approved: data.quantity_approved ?? req.quantity_requested,
      approved_at: new Date().toISOString(),
      approved_by_id: 5,
      updated_at: new Date().toISOString(),
      approvals: [
        ...(req.approvals ?? []),
        {
          id: Date.now(),
          approver_id: 5,
          approver_name: 'Capt Davis',
          action: 'APPROVE' as const,
          comments: data.comments ?? 'Approved',
          action_date: new Date().toISOString(),
        },
      ],
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'APPROVED' as RequisitionStatus,
          changed_by_id: 5,
          changed_by_name: 'Capt Davis',
          changed_at: new Date().toISOString(),
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
      denial_reason: data.reason,
      updated_at: new Date().toISOString(),
      approvals: [
        ...(req.approvals ?? []),
        {
          id: Date.now(),
          approver_id: 5,
          approver_name: 'Capt Davis',
          action: 'DENY' as const,
          comments: data.reason,
          action_date: new Date().toISOString(),
        },
      ],
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'DENIED' as RequisitionStatus,
          changed_by_id: 5,
          changed_by_name: 'Capt Davis',
          changed_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'SOURCING' as RequisitionStatus,
          changed_by_id: 3,
          changed_by_name: 'GySgt Thompson',
          changed_at: new Date().toISOString(),
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
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      estimated_delivery_date: dateStr(-3),
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'SHIPPED' as RequisitionStatus,
          changed_by_id: 3,
          changed_by_name: 'GySgt Thompson',
          changed_at: new Date().toISOString(),
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
      received_at: new Date().toISOString(),
      actual_delivery_date: new Date().toISOString().split('T')[0],
      quantity_issued: data.quantity_received ?? req.quantity_approved ?? req.quantity_requested,
      updated_at: new Date().toISOString(),
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'RECEIVED' as RequisitionStatus,
          changed_by_id: req.requested_by_id,
          changed_by_name: req.requested_by_name,
          changed_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
      denial_reason: reason ?? req.denial_reason,
      status_history: [
        ...(req.status_history ?? []),
        {
          id: Date.now(),
          old_status: req.status,
          new_status: 'CANCELED' as RequisitionStatus,
          changed_by_id: req.requested_by_id,
          changed_by_name: req.requested_by_name,
          changed_at: new Date().toISOString(),
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

export async function getRequisitionAnalytics(): Promise<{
  summary: { total: number; active: number; fulfilled: number; denied: number; canceled: number; approvalRate: number };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySupplyClass: Array<{ supplyClass: string; count: number; fulfilled: number }>;
  avgFulfillmentDays: number;
  recentTrend: Array<{ date: string; submitted: number; fulfilled: number }>;
}> {
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
  const response = await apiClient.get<{ data: any }>('/requisitions/analytics/summary');
  return response.data.data;
}

// ---------------------------------------------------------------------------
// API Functions — Inventory
// ---------------------------------------------------------------------------

export async function getInventory(unitId?: number): Promise<InventoryRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) {
      return MOCK_INVENTORY.filter((r) => r.unit_id === unitId);
    }
    return [...MOCK_INVENTORY];
  }
  const response = await apiClient.get<{ data: InventoryRecord[] }>('/inventory', {
    params: unitId ? { unit_id: unitId } : undefined,
  });
  return response.data.data;
}

export async function getLowStockAlerts(unitId?: number): Promise<LowStockAlert[]> {
  if (isDemoMode) {
    await mockDelay();
    let items = MOCK_INVENTORY;
    if (unitId) {
      items = items.filter((r) => r.unit_id === unitId);
    }
    return items
      .filter((r) => r.reorder_point !== null && r.quantity_on_hand < r.reorder_point!)
      .map((r) => ({
        inventory_record_id: r.id,
        unit_id: r.unit_id,
        location: r.location,
        nomenclature: r.nomenclature,
        quantity_on_hand: r.quantity_on_hand,
        reorder_point: r.reorder_point!,
        quantity_below: r.reorder_point! - r.quantity_on_hand,
        last_inventory_date: r.last_inventory_date,
      }));
  }
  const response = await apiClient.get<{ data: LowStockAlert[] }>(
    '/inventory/low-stock',
    { params: unitId ? { unit_id: unitId } : undefined },
  );
  return response.data.data;
}

export async function recordTransaction(data: {
  inventory_record_id: number;
  transaction_type: TransactionType;
  quantity: number;
  requisition_id?: number;
  notes?: string;
}): Promise<InventoryTransaction> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: Math.floor(Math.random() * 10000),
      inventory_record_id: data.inventory_record_id,
      transaction_type: data.transaction_type,
      quantity: data.quantity,
      requisition_id: data.requisition_id ?? null,
      performed_by_id: 10,
      transaction_date: new Date().toISOString(),
      document_number: null,
      notes: data.notes ?? null,
    };
  }
  const response = await apiClient.post<{ data: InventoryTransaction }>(
    '/inventory/transactions',
    data,
  );
  return response.data.data;
}
