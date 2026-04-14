import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { LogisticsRecommendation } from '@/lib/types';

const MOCK_RECOMMENDATIONS: LogisticsRecommendation[] = [
  {
    id: 1,
    recommendationType: 'RESUPPLY',
    triggeredByMetric: 'Class V DOS < 15 at 1/11 Marines',
    targetUnitId: 4,
    description: 'Resupply 1/11 Marines with Class V ammunition from ASP Camp Pendleton',
    recommendedItems: [
      { itemName: '5.56mm M855A1', quantity: 50000, priority: 'HIGH', weight_per_unit: 0.026 },
      { itemName: '7.62mm M80A1', quantity: 15000, priority: 'HIGH', weight_per_unit: 0.052 },
      { itemName: '40mm HEDP', quantity: 500, priority: 'MEDIUM', weight_per_unit: 0.51 },
    ],
    recommendedSource: 'ASP Camp Pendleton',
    recommendedVehicles: [
      { vehicleType: 'MTVR MK23', capacity_weight: 10000, status: 'FMC' },
      { vehicleType: 'MTVR MK23', capacity_weight: 10000, status: 'FMC' },
    ],
    recommendedPersonnel: [
      { name: 'SSgt Garcia', rank: 'E-6', role: 'Convoy Commander' },
      { name: 'Cpl Thompson', rank: 'E-4', role: 'Driver' },
      { name: 'LCpl Rivera', rank: 'E-3', role: 'A-Driver' },
    ],
    estimatedWeight: 2335,
    estimatedCost: 125000,
    estimatedDuration: '4 hours',
    status: 'PENDING',
    assignedToRole: 'S4',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    recommendationType: 'MAINTENANCE',
    triggeredByMetric: 'Maintenance backlog > 10 at CLB-1',
    targetUnitId: 3,
    description: 'Address 14 open maintenance work orders at CLB-1, prioritize 3 deadline vehicles',
    recommendedItems: [
      { category: 'Vehicles - Deadline', count: 3 },
      { category: 'Vehicles - NMC', count: 5 },
      { category: 'Comms Equipment', count: 4 },
      { category: 'Weapons Systems', count: 2 },
    ],
    estimatedCost: 45000,
    estimatedDuration: '5 days',
    status: 'PENDING',
    assignedToRole: 'CO',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 3,
    recommendationType: 'FUEL_DELIVERY',
    triggeredByMetric: 'Fuel level < 40% at 1st CEB',
    targetUnitId: 5,
    description: 'Deliver 8,000 gallons JP-8 to 1st CEB FARP from DLA DFSP Pendleton',
    recommendedItems: [
      { fuelType: 'JP-8', quantity: 8000, unit: 'gallons' },
    ],
    recommendedSource: 'DLA DFSP Camp Pendleton',
    recommendedVehicles: [
      { vehicleType: 'M970 Fuel Tanker', capacity_weight: 20000, status: 'FMC' },
      { vehicleType: 'HMMWV M1151 (Escort)', capacity_weight: 2500, status: 'FMC' },
    ],
    recommendedPersonnel: [
      { name: 'Sgt Mitchell', rank: 'E-5', role: 'Convoy Commander' },
      { name: 'Cpl Adams', rank: 'E-4', role: 'Tanker Operator' },
    ],
    estimatedWeight: 53600,
    estimatedCost: 32000,
    estimatedDuration: '3 hours',
    status: 'APPROVED',
    assignedToRole: 'S4',
    decidedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 4,
    recommendationType: 'PERSONNEL_MOVE',
    triggeredByMetric: 'Fill rate < 80% at 3/1 Marines',
    targetUnitId: 6,
    description: 'Fill 12 critical MOS billets at 3/1 Marines from IPAC holding',
    recommendedItems: [
      { position_count: 4, mos: '0311 Rifleman' },
      { position_count: 3, mos: '0331 Machine Gunner' },
      { position_count: 2, mos: '0811 Field Artillery Cannoneer' },
      { position_count: 3, mos: '0621 Radio Operator' },
    ],
    estimatedDuration: '48 hours',
    status: 'DENIED',
    assignedToRole: 'XO',
    notes: 'Defer until next rotation cycle — current shortfall manageable',
    decidedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
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
    if (rec) { rec.status = 'APPROVED'; rec.decidedAt = new Date().toISOString(); rec.notes = notes; }
    return rec!;
  }
  const res = await apiClient.post(`/predictions/recommendations/${id}/approve`, { notes, auto_execute: autoExecute });
  return res.data;
}

export async function denyRecommendation(id: number, notes?: string): Promise<LogisticsRecommendation> {
  if (isDemoMode) {
    const rec = MOCK_RECOMMENDATIONS.find(r => r.id === id);
    if (rec) { rec.status = 'DENIED'; rec.decidedAt = new Date().toISOString(); rec.notes = notes; }
    return rec!;
  }
  const res = await apiClient.post(`/predictions/recommendations/${id}/deny`, { notes });
  return res.data;
}
