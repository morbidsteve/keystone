import apiClient from './client';
import { isDemoMode } from './mockClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenarioSummary {
  name: string;
  displayName: string;
  description: string;
  durationDays: number;
  phaseCount: number;
  unitCount: number;
  category: string;
}

export interface ScenarioPhase {
  name: string;
  offsetH: number;
  durationH: number;
  tempo: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface ScenarioUnit {
  name: string;
  type: string;
  callsign: string;
}

export interface ScenarioDetail extends ScenarioSummary {
  phases: ScenarioPhase[];
  units: ScenarioUnit[];
  areaOfOperation?: {
    name: string;
    center: [number, number];
    radiusKm: number;
  };
}

export interface SimulatorStatus {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  scenarioName?: string;
  simTime?: string;
  speed?: number;
  eventsProcessed?: number;
  startedAt?: string;
}

// ---------------------------------------------------------------------------
// Mock data for demo mode
// ---------------------------------------------------------------------------

const MOCK_SCENARIOS: ScenarioSummary[] = [
  // Pre-Deployment Training (CONUS)
  {
    name: 'steelGuardian',
    displayName: 'Exercise Steel Guardian',
    description: '7-day battalion-level FEX at 29 Palms MCAGCC. 1/1 Marines with CLB-1 support.',
    durationDays: 7,
    phaseCount: 5,
    unitCount: 8,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'itx',
    displayName: 'Integrated Training Exercise',
    description: 'Regimental-level ITX at 29 Palms. Combined arms live-fire with MAGTF integration.',
    durationDays: 19,
    phaseCount: 6,
    unitCount: 14,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'steel_knight',
    displayName: 'Steel Knight',
    description: 'Division-level exercise across Southern California. Multi-domain operations.',
    durationDays: 10,
    phaseCount: 5,
    unitCount: 16,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'comptuex',
    displayName: 'MEU COMPTUEX',
    description: 'Composite Training Unit Exercise. Final certification for MEU deployment.',
    durationDays: 14,
    phaseCount: 5,
    unitCount: 12,
    category: 'Pre-Deployment Training (CONUS)',
  },

  // Indo-Pacific
  {
    name: 'cobra_gold',
    displayName: 'Cobra Gold',
    description: 'Multinational exercise in Thailand. Combined amphibious and HA/DR operations.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'balikatan',
    displayName: 'Balikatan',
    description: 'US-Philippines bilateral exercise. Island defense and maritime security.',
    durationDays: 14,
    phaseCount: 5,
    unitCount: 12,
    category: 'Indo-Pacific',
  },
  {
    name: 'resolute_dragon',
    displayName: 'Resolute Dragon',
    description: 'US-Japan bilateral exercise in Okinawa. Integrated island defense operations.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'ssang_yong',
    displayName: 'Ssang Yong',
    description: 'US-Korea combined amphibious exercise. Large-scale forcible entry operations.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 12,
    category: 'Indo-Pacific',
  },
  {
    name: 'kamandag',
    displayName: 'Kamandag',
    description: 'US-Philippines marine exercise. Littoral operations and humanitarian assistance.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 8,
    category: 'Indo-Pacific',
  },
  {
    name: 'valiant_shield',
    displayName: 'Valiant Shield',
    description: 'Tri-service exercise in the Marianas. Joint force integration and combined arms.',
    durationDays: 12,
    phaseCount: 4,
    unitCount: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'rimpac',
    displayName: 'RIMPAC',
    description: 'Multinational maritime exercise in Hawaii. Largest international naval warfare exercise.',
    durationDays: 21,
    phaseCount: 5,
    unitCount: 14,
    category: 'Indo-Pacific',
  },
  {
    name: 'island_sentinel',
    displayName: 'Island Sentinel',
    description: 'First Island Chain EAB operations. Expeditionary advanced base distributed operations.',
    durationDays: 14,
    phaseCount: 5,
    unitCount: 10,
    category: 'Indo-Pacific',
  },

  // Europe / Africa / Middle East
  {
    name: 'african_lion',
    displayName: 'African Lion',
    description: 'US-Morocco combined exercise. Desert warfare and humanitarian assistance.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 10,
    category: 'Europe / Africa / Middle East',
  },
  {
    name: 'cold_response',
    displayName: 'Cold Response',
    description: 'NATO exercise in northern Norway. Arctic and cold weather operations.',
    durationDays: 14,
    phaseCount: 5,
    unitCount: 12,
    category: 'Europe / Africa / Middle East',
  },
  {
    name: 'native_fury',
    displayName: 'Native Fury',
    description: 'US-UAE combined exercise. Amphibious operations and desert warfare.',
    durationDays: 10,
    phaseCount: 4,
    unitCount: 10,
    category: 'Europe / Africa / Middle East',
  },

  // Americas / Maritime
  {
    name: 'unitas',
    displayName: 'UNITAS',
    description: 'Multinational maritime exercise with South American navies. Naval cooperation.',
    durationDays: 14,
    phaseCount: 4,
    unitCount: 8,
    category: 'Americas / Maritime',
  },

  // Crisis Response
  {
    name: 'trident_spear',
    displayName: 'Trident Spear',
    description: 'NEO and crisis response exercise. Embassy reinforcement and civilian evacuation.',
    durationDays: 5,
    phaseCount: 4,
    unitCount: 8,
    category: 'Crisis Response',
  },

  // Reserve Component
  {
    name: 'reserve_itx',
    displayName: 'Reserve ITX',
    description: 'Reserve component Integrated Training Exercise at 29 Palms.',
    durationDays: 14,
    phaseCount: 5,
    unitCount: 10,
    category: 'Reserve Component',
  },

  // Deployment / Garrison
  {
    name: 'pacific_fury',
    displayName: 'Pacific Fury',
    description: '26th MEU Pre-Deployment Training and Embark, Camp Lejeune.',
    durationDays: 134,
    phaseCount: 4,
    unitCount: 12,
    category: 'Deployment / Garrison',
  },
  {
    name: 'iron_forge',
    displayName: 'Iron Forge',
    description: 'MCAS / Camp Garrison Operations on Okinawa. Sustained logistics ops.',
    durationDays: 90,
    phaseCount: 3,
    unitCount: 10,
    category: 'Deployment / Garrison',
  },
];

const MOCK_SCENARIO_DETAILS: Record<string, ScenarioDetail> = {
  steelGuardian: {
    ...MOCK_SCENARIOS[0],
    phases: [
      { name: 'Phase 0 -- Deployment & Assembly', offsetH: 0, durationH: 24, tempo: 'LOW', description: 'Units deploy from Camp Pendleton to 29 Palms MCAGCC.' },
      { name: 'Phase I -- Defense', offsetH: 24, durationH: 48, tempo: 'MEDIUM', description: 'Establish defensive positions. Conduct security patrols.' },
      { name: 'Phase II -- Offensive Operations', offsetH: 72, durationH: 48, tempo: 'HIGH', description: 'Conduct offensive operations to seize OBJ GRANITE and OBJ IRON.' },
      { name: 'Phase III -- Stability Operations', offsetH: 120, durationH: 36, tempo: 'MEDIUM', description: 'Consolidate gains. Focus on resupply and equipment recovery.' },
      { name: 'Phase IV -- Redeployment', offsetH: 156, durationH: 12, tempo: 'LOW', description: 'LACE report, LOGSTAT final, equipment accountability.' },
    ],
    units: [
      { name: '1st Battalion, 1st Marines', type: 'BN', callsign: 'WARHORSE' },
      { name: 'Alpha Company, 1/1', type: 'CO', callsign: 'ALPHA' },
      { name: 'Bravo Company, 1/1', type: 'CO', callsign: 'BRAVO' },
      { name: 'Charlie Company, 1/1', type: 'CO', callsign: 'CHARLIE' },
      { name: 'Weapons Company, 1/1', type: 'CO', callsign: 'WEAPONS' },
      { name: 'H&S Company, 1/1', type: 'CO', callsign: 'HEADHUNTER' },
      { name: 'CLB-1', type: 'BN', callsign: 'IRONHORSE' },
      { name: 'Alpha Co, CLB-1', type: 'CO', callsign: 'SUPPLY' },
    ],
    areaOfOperation: {
      name: '29 Palms MCAGCC',
      center: [34.2367, -116.0542],
      radiusKm: 30,
    },
  },
};

// Demo mode local simulation state
let _demoStatus: SimulatorStatus = { status: 'idle' };
let _demoStartTime: number | null = null;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const mockDelay = (ms = 100 + Math.random() * 100): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export async function getScenarios(): Promise<ScenarioSummary[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SCENARIOS;
  }
  const response = await apiClient.get<ScenarioSummary[]>('/simulator/scenarios');
  return response.data;
}

export async function getScenarioDetail(name: string): Promise<ScenarioDetail> {
  if (isDemoMode) {
    await mockDelay();
    const detail = MOCK_SCENARIO_DETAILS[name];
    if (detail) return detail;
    // Fallback: return summary with empty phases/units
    const summary = MOCK_SCENARIOS.find((s) => s.name === name);
    if (!summary) throw new Error(`Scenario not found: ${name}`);
    return {
      ...summary,
      phases: [
        { name: 'Phase I', offsetH: 0, durationH: summary.durationDays * 8, tempo: 'LOW', description: 'Initial phase' },
        { name: 'Phase II', offsetH: summary.durationDays * 8, durationH: summary.durationDays * 8, tempo: 'MEDIUM', description: 'Main phase' },
        { name: 'Phase III', offsetH: summary.durationDays * 16, durationH: summary.durationDays * 8, tempo: 'HIGH', description: 'Final phase' },
      ],
      units: Array.from({ length: summary.unitCount }, (_, i) => ({
        name: `Unit ${i + 1}`,
        type: i === 0 ? 'BN' : 'CO',
        callsign: `UNIT-${i + 1}`,
      })),
    };
  }
  const response = await apiClient.get<ScenarioDetail>(`/simulator/scenarios/${name}`);
  return response.data;
}

export async function getSimulatorStatus(): Promise<SimulatorStatus> {
  if (isDemoMode) {
    await mockDelay(50);
    if (_demoStatus.status === 'running' && _demoStartTime) {
      const elapsed = (Date.now() - _demoStartTime) / 1000;
      _demoStatus.eventsProcessed = Math.floor(elapsed * 2);
    }
    return { ..._demoStatus };
  }
  const response = await apiClient.get<SimulatorStatus>('/simulator/status');
  return response.data;
}

export async function startSimulation(scenarioName: string, speed: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStartTime = Date.now();
    _demoStatus = {
      status: 'running',
      scenarioName: scenarioName,
      speed,
      startedAt: new Date().toISOString(),
      eventsProcessed: 0,
    };
    return;
  }
  await apiClient.post('/simulator/start', { scenarioName: scenarioName, speed });
}

export async function stopSimulation(): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStatus = { status: 'stopped', scenarioName: _demoStatus.scenarioName };
    _demoStartTime = null;
    return;
  }
  await apiClient.post('/simulator/stop');
}

export async function pauseSimulation(): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStatus = { ..._demoStatus, status: 'paused' };
    return;
  }
  await apiClient.post('/simulator/pause');
}

export async function resumeSimulation(): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStatus = { ..._demoStatus, status: 'running' };
    return;
  }
  await apiClient.post('/simulator/resume');
}

export async function setSimulationSpeed(speed: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStatus = { ..._demoStatus, speed };
    return;
  }
  await apiClient.post('/simulator/speed', { speed });
}
