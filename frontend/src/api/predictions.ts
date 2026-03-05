import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { LogisticsRecommendation } from '@/lib/types';

const MOCK_RECOMMENDATIONS: LogisticsRecommendation[] = [
  {
    id: 1,
    recommendation_type: 'RESUPPLY',
    triggered_by_metric: 'Class V DOS < 15 at 1/11 Marines',
    target_unit_id: 4,
    description: 'Resupply 1/11 Marines with Class V ammunition from ASP Camp Pendleton',
    recommended_items: [
      { item_name: '5.56mm M855A1', quantity: 50000, priority: 'HIGH', weight_per_unit: 0.026 },
      { item_name: '7.62mm M80A1', quantity: 15000, priority: 'HIGH', weight_per_unit: 0.052 },
      { item_name: '40mm HEDP', quantity: 500, priority: 'MEDIUM', weight_per_unit: 0.51 },
    ],
    recommended_source: 'ASP Camp Pendleton',
    recommended_vehicles: [
      { vehicle_type: 'MTVR MK23', capacity_weight: 10000, status: 'FMC' },
      { vehicle_type: 'MTVR MK23', capacity_weight: 10000, status: 'FMC' },
    ],
    recommended_personnel: [
      { name: 'SSgt Garcia', rank: 'E-6', role: 'Convoy Commander' },
      { name: 'Cpl Thompson', rank: 'E-4', role: 'Driver' },
      { name: 'LCpl Rivera', rank: 'E-3', role: 'A-Driver' },
    ],
    estimated_weight: 2335,
    estimated_cost: 125000,
    estimated_duration: '4 hours',
    status: 'PENDING',
    assigned_to_role: 'S4',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    recommendation_type: 'MAINTENANCE',
    triggered_by_metric: 'Maintenance backlog > 10 at CLB-1',
    target_unit_id: 3,
    description: 'Address 14 open maintenance work orders at CLB-1, prioritize 3 deadline vehicles',
    recommended_items: [
      { category: 'Vehicles - Deadline', count: 3 },
      { category: 'Vehicles - NMC', count: 5 },
      { category: 'Comms Equipment', count: 4 },
      { category: 'Weapons Systems', count: 2 },
    ],
    estimated_cost: 45000,
    estimated_duration: '5 days',
    status: 'PENDING',
    assigned_to_role: 'CO',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 3,
    recommendation_type: 'FUEL_DELIVERY',
    triggered_by_metric: 'Fuel level < 40% at 1st CEB',
    target_unit_id: 5,
    description: 'Deliver 8,000 gallons JP-8 to 1st CEB FARP from DLA DFSP Pendleton',
    recommended_items: [
      { fuel_type: 'JP-8', quantity: 8000, unit: 'gallons' },
    ],
    recommended_source: 'DLA DFSP Camp Pendleton',
    recommended_vehicles: [
      { vehicle_type: 'M970 Fuel Tanker', capacity_weight: 20000, status: 'FMC' },
      { vehicle_type: 'HMMWV M1151 (Escort)', capacity_weight: 2500, status: 'FMC' },
    ],
    recommended_personnel: [
      { name: 'Sgt Mitchell', rank: 'E-5', role: 'Convoy Commander' },
      { name: 'Cpl Adams', rank: 'E-4', role: 'Tanker Operator' },
    ],
    estimated_weight: 53600,
    estimated_cost: 32000,
    estimated_duration: '3 hours',
    status: 'APPROVED',
    assigned_to_role: 'S4',
    decided_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 4,
    recommendation_type: 'PERSONNEL_MOVE',
    triggered_by_metric: 'Fill rate < 80% at 3/1 Marines',
    target_unit_id: 6,
    description: 'Fill 12 critical MOS billets at 3/1 Marines from IPAC holding',
    recommended_items: [
      { position_count: 4, mos: '0311 Rifleman' },
      { position_count: 3, mos: '0331 Machine Gunner' },
      { position_count: 2, mos: '0811 Field Artillery Cannoneer' },
      { position_count: 3, mos: '0621 Radio Operator' },
    ],
    estimated_duration: '48 hours',
    status: 'DENIED',
    assigned_to_role: 'XO',
    notes: 'Defer until next rotation cycle — current shortfall manageable',
    decided_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export async function getRecommendations(status?: string): Promise<LogisticsRecommendation[]> {
  if (isDemoMode) {
    if (status) return MOCK_RECOMMENDATIONS.filter(r => r.status === status);
    return [...MOCK_RECOMMENDATIONS];
  }
  const params = status ? `?status=${status}` : '';
  const res = await apiClient.get(`/predictions/recommendations${params}`);
  return res.data;
}

export async function getRecommendation(id: number): Promise<LogisticsRecommendation> {
  if (isDemoMode) {
    const rec = MOCK_RECOMMENDATIONS.find(r => r.id === id);
    if (!rec) throw new Error('Not found');
    return rec;
  }
  const res = await apiClient.get(`/predictions/recommendations/${id}`);
  return res.data;
}

export async function approveRecommendation(id: number, notes?: string, autoExecute: boolean = true): Promise<LogisticsRecommendation> {
  if (isDemoMode) {
    const rec = MOCK_RECOMMENDATIONS.find(r => r.id === id);
    if (rec) { rec.status = 'APPROVED'; rec.decided_at = new Date().toISOString(); rec.notes = notes; }
    return rec!;
  }
  const res = await apiClient.post(`/predictions/recommendations/${id}/approve`, { notes, auto_execute: autoExecute });
  return res.data;
}

export async function denyRecommendation(id: number, notes?: string): Promise<LogisticsRecommendation> {
  if (isDemoMode) {
    const rec = MOCK_RECOMMENDATIONS.find(r => r.id === id);
    if (rec) { rec.status = 'DENIED'; rec.decided_at = new Date().toISOString(); rec.notes = notes; }
    return rec!;
  }
  const res = await apiClient.post(`/predictions/recommendations/${id}/deny`, { notes });
  return res.data;
}
