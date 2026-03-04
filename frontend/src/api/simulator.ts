import apiClient from './client';
import { isDemoMode } from './mockClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenarioSummary {
  name: string;
  display_name: string;
  description: string;
  duration_days: number;
  phase_count: number;
  unit_count: number;
  category: string;
}

export interface ScenarioPhase {
  name: string;
  offset_h: number;
  duration_h: number;
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
  area_of_operation?: {
    name: string;
    center: [number, number];
    radius_km: number;
  };
}

export interface SimulatorStatus {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  scenario_name?: string;
  sim_time?: string;
  speed?: number;
  events_processed?: number;
  started_at?: string;
}

// ---------------------------------------------------------------------------
// Mock data for demo mode
// ---------------------------------------------------------------------------

const MOCK_SCENARIOS: ScenarioSummary[] = [
  // Pre-Deployment Training (CONUS)
  {
    name: 'steel_guardian',
    display_name: 'Exercise Steel Guardian',
    description: '7-day battalion-level FEX at 29 Palms MCAGCC. 1/1 Marines with CLB-1 support.',
    duration_days: 7,
    phase_count: 5,
    unit_count: 8,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'itx',
    display_name: 'Integrated Training Exercise',
    description: 'Regimental-level ITX at 29 Palms. Combined arms live-fire with MAGTF integration.',
    duration_days: 19,
    phase_count: 6,
    unit_count: 14,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'steel_knight',
    display_name: 'Steel Knight',
    description: 'Division-level exercise across Southern California. Multi-domain operations.',
    duration_days: 10,
    phase_count: 5,
    unit_count: 16,
    category: 'Pre-Deployment Training (CONUS)',
  },
  {
    name: 'comptuex',
    display_name: 'MEU COMPTUEX',
    description: 'Composite Training Unit Exercise. Final certification for MEU deployment.',
    duration_days: 14,
    phase_count: 5,
    unit_count: 12,
    category: 'Pre-Deployment Training (CONUS)',
  },

  // Indo-Pacific
  {
    name: 'cobra_gold',
    display_name: 'Cobra Gold',
    description: 'Multinational exercise in Thailand. Combined amphibious and HA/DR operations.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'balikatan',
    display_name: 'Balikatan',
    description: 'US-Philippines bilateral exercise. Island defense and maritime security.',
    duration_days: 14,
    phase_count: 5,
    unit_count: 12,
    category: 'Indo-Pacific',
  },
  {
    name: 'resolute_dragon',
    display_name: 'Resolute Dragon',
    description: 'US-Japan bilateral exercise in Okinawa. Integrated island defense operations.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'ssang_yong',
    display_name: 'Ssang Yong',
    description: 'US-Korea combined amphibious exercise. Large-scale forcible entry operations.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 12,
    category: 'Indo-Pacific',
  },
  {
    name: 'kamandag',
    display_name: 'Kamandag',
    description: 'US-Philippines marine exercise. Littoral operations and humanitarian assistance.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 8,
    category: 'Indo-Pacific',
  },
  {
    name: 'valiant_shield',
    display_name: 'Valiant Shield',
    description: 'Tri-service exercise in the Marianas. Joint force integration and combined arms.',
    duration_days: 12,
    phase_count: 4,
    unit_count: 10,
    category: 'Indo-Pacific',
  },
  {
    name: 'rimpac',
    display_name: 'RIMPAC',
    description: 'Multinational maritime exercise in Hawaii. Largest international naval warfare exercise.',
    duration_days: 21,
    phase_count: 5,
    unit_count: 14,
    category: 'Indo-Pacific',
  },
  {
    name: 'island_sentinel',
    display_name: 'Island Sentinel',
    description: 'First Island Chain EAB operations. Expeditionary advanced base distributed operations.',
    duration_days: 14,
    phase_count: 5,
    unit_count: 10,
    category: 'Indo-Pacific',
  },

  // Europe / Africa / Middle East
  {
    name: 'african_lion',
    display_name: 'African Lion',
    description: 'US-Morocco combined exercise. Desert warfare and humanitarian assistance.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 10,
    category: 'Europe / Africa / Middle East',
  },
  {
    name: 'cold_response',
    display_name: 'Cold Response',
    description: 'NATO exercise in northern Norway. Arctic and cold weather operations.',
    duration_days: 14,
    phase_count: 5,
    unit_count: 12,
    category: 'Europe / Africa / Middle East',
  },
  {
    name: 'native_fury',
    display_name: 'Native Fury',
    description: 'US-UAE combined exercise. Amphibious operations and desert warfare.',
    duration_days: 10,
    phase_count: 4,
    unit_count: 10,
    category: 'Europe / Africa / Middle East',
  },

  // Americas / Maritime
  {
    name: 'unitas',
    display_name: 'UNITAS',
    description: 'Multinational maritime exercise with South American navies. Naval cooperation.',
    duration_days: 14,
    phase_count: 4,
    unit_count: 8,
    category: 'Americas / Maritime',
  },

  // Crisis Response
  {
    name: 'trident_spear',
    display_name: 'Trident Spear',
    description: 'NEO and crisis response exercise. Embassy reinforcement and civilian evacuation.',
    duration_days: 5,
    phase_count: 4,
    unit_count: 8,
    category: 'Crisis Response',
  },

  // Reserve Component
  {
    name: 'reserve_itx',
    display_name: 'Reserve ITX',
    description: 'Reserve component Integrated Training Exercise at 29 Palms.',
    duration_days: 14,
    phase_count: 5,
    unit_count: 10,
    category: 'Reserve Component',
  },

  // Deployment / Garrison
  {
    name: 'pacific_fury',
    display_name: 'Pacific Fury',
    description: '26th MEU Pre-Deployment Training and Embark, Camp Lejeune.',
    duration_days: 134,
    phase_count: 4,
    unit_count: 12,
    category: 'Deployment / Garrison',
  },
  {
    name: 'iron_forge',
    display_name: 'Iron Forge',
    description: 'MCAS / Camp Garrison Operations on Okinawa. Sustained logistics ops.',
    duration_days: 90,
    phase_count: 3,
    unit_count: 10,
    category: 'Deployment / Garrison',
  },
];

const MOCK_SCENARIO_DETAILS: Record<string, ScenarioDetail> = {
  steel_guardian: {
    ...MOCK_SCENARIOS[0],
    phases: [
      { name: 'Phase 0 -- Deployment & Assembly', offset_h: 0, duration_h: 24, tempo: 'LOW', description: 'Units deploy from Camp Pendleton to 29 Palms MCAGCC.' },
      { name: 'Phase I -- Defense', offset_h: 24, duration_h: 48, tempo: 'MEDIUM', description: 'Establish defensive positions. Conduct security patrols.' },
      { name: 'Phase II -- Offensive Operations', offset_h: 72, duration_h: 48, tempo: 'HIGH', description: 'Conduct offensive operations to seize OBJ GRANITE and OBJ IRON.' },
      { name: 'Phase III -- Stability Operations', offset_h: 120, duration_h: 36, tempo: 'MEDIUM', description: 'Consolidate gains. Focus on resupply and equipment recovery.' },
      { name: 'Phase IV -- Redeployment', offset_h: 156, duration_h: 12, tempo: 'LOW', description: 'LACE report, LOGSTAT final, equipment accountability.' },
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
    area_of_operation: {
      name: '29 Palms MCAGCC',
      center: [34.2367, -116.0542],
      radius_km: 30,
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
        { name: 'Phase I', offset_h: 0, duration_h: summary.duration_days * 8, tempo: 'LOW', description: 'Initial phase' },
        { name: 'Phase II', offset_h: summary.duration_days * 8, duration_h: summary.duration_days * 8, tempo: 'MEDIUM', description: 'Main phase' },
        { name: 'Phase III', offset_h: summary.duration_days * 16, duration_h: summary.duration_days * 8, tempo: 'HIGH', description: 'Final phase' },
      ],
      units: Array.from({ length: summary.unit_count }, (_, i) => ({
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
      _demoStatus.events_processed = Math.floor(elapsed * 2);
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
      scenario_name: scenarioName,
      speed,
      started_at: new Date().toISOString(),
      events_processed: 0,
    };
    return;
  }
  await apiClient.post('/simulator/start', { scenario_name: scenarioName, speed });
}

export async function stopSimulation(): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    _demoStatus = { status: 'stopped', scenario_name: _demoStatus.scenario_name };
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
