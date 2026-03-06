// =============================================================================
// KEYSTONE Demo Mode — Role Picker User List
// =============================================================================

export interface DemoUser {
  username: string;
  full_name: string;
  rank: string;
  billet: string;
  unit: string;
  mos: string;
  description: string;
  section: 'COMMAND' | 'STAFF' | 'COMPANY' | 'OPERATORS' | 'HIGHER_HQ';
}

export const DEMO_USERS_LIST: DemoUser[] = [
  // COMMAND
  { username: 'bn_co', full_name: 'David R. Harris', rank: 'LtCol', billet: 'Battalion Commander', unit: '1/11', mos: '0802', description: 'See the full COP from the Battalion CO\'s chair', section: 'COMMAND' },
  { username: 'bn_xo', full_name: 'Thomas A. Reed', rank: 'Maj', billet: 'Executive Officer', unit: '1/11', mos: '0802', description: 'Battalion XO perspective on operations and logistics', section: 'COMMAND' },
  { username: 'bn_sgtmaj', full_name: 'Carlos M. Rivera', rank: 'SgtMaj', billet: 'Battalion Sergeant Major', unit: '1/11', mos: '9500', description: 'Senior enlisted advisor to Battalion Commander', section: 'COMMAND' },
  // STAFF
  { username: 'bn_s1', full_name: 'Emily J. Foster', rank: 'Capt', billet: 'S-1 (Admin Officer)', unit: '1/11', mos: '0111', description: 'Personnel and administration oversight', section: 'STAFF' },
  { username: 'bn_s2', full_name: 'James W. Park', rank: 'Capt', billet: 'S-2 (Intelligence)', unit: '1/11', mos: '0261', description: 'Intelligence operations and reporting', section: 'STAFF' },
  { username: 'bn_s3', full_name: 'Ryan K. O\'Brien', rank: 'Maj', billet: 'S-3 (Operations)', unit: '1/11', mos: '0802', description: 'Operations planning and execution', section: 'STAFF' },
  { username: 'bn_s4', full_name: 'Michelle L. Santos', rank: 'Capt', billet: 'S-4 (Logistics)', unit: '1/11', mos: '0801', description: 'Logistics, supply, maintenance oversight', section: 'STAFF' },
  { username: 'bn_s6', full_name: 'Andrew P. Chen', rank: '1stLt', billet: 'S-6 (Communications)', unit: '1/11', mos: '2651', description: 'Communications systems and network operations', section: 'STAFF' },
  // COMPANY
  { username: 'alpha_co', full_name: 'Robert M. Williams', rank: 'Capt', billet: 'Battery Commander', unit: 'A Btry 1/11', mos: '0802', description: 'Alpha Battery command and leadership', section: 'COMPANY' },
  { username: 'bravo_co', full_name: 'Sarah K. Thompson', rank: 'Capt', billet: 'Battery Commander', unit: 'B Btry 1/11', mos: '0802', description: 'Bravo Battery command and leadership', section: 'COMPANY' },
  { username: 'charlie_co', full_name: 'Marcus D. Jackson', rank: 'Capt', billet: 'Battery Commander', unit: 'C Btry 1/11', mos: '0802', description: 'Charlie Battery command and leadership', section: 'COMPANY' },
  { username: 'hs_co', full_name: 'Nicole R. Adams', rank: 'Capt', billet: 'Battery Commander', unit: 'H&S Btry 1/11', mos: '0802', description: 'H&S Battery command and leadership', section: 'COMPANY' },
  // OPERATORS
  { username: 'alpha_supply', full_name: 'Miguel Rodriguez', rank: 'SSgt', billet: 'Supply Chief', unit: 'A Btry 1/11', mos: '0411', description: 'Manage Alpha Battery supply and requisitions', section: 'OPERATORS' },
  { username: 'bravo_supply', full_name: 'David Kim', rank: 'SSgt', billet: 'Supply Chief', unit: 'B Btry 1/11', mos: '0411', description: 'Manage Bravo Battery supply and requisitions', section: 'OPERATORS' },
  { username: 'maint_chief', full_name: 'Patrick O\'Malley', rank: 'GySgt', billet: 'Maintenance Chief', unit: 'H&S Btry 1/11', mos: '3514', description: 'Battalion maintenance operations', section: 'OPERATORS' },
  { username: 'motort_chief', full_name: 'Michael Thompson', rank: 'GySgt', billet: 'Motor Transport Chief', unit: 'H&S Btry 1/11', mos: '3512', description: 'Convoy operations and vehicle management', section: 'OPERATORS' },
  { username: 'motort_dispatcher', full_name: 'Luis Garcia', rank: 'Sgt', billet: 'MT Dispatcher', unit: 'H&S Btry 1/11', mos: '3512', description: 'Dispatch and route planning', section: 'OPERATORS' },
  // HIGHER HQ
  { username: 'regt_s4', full_name: 'David Wilson', rank: 'Maj', billet: 'Regimental S-4', unit: '11th Marines', mos: '0801', description: 'Regimental logistics oversight', section: 'HIGHER_HQ' },
  { username: 'regt_s3', full_name: 'Susan Brooks', rank: 'Maj', billet: 'Regimental S-3', unit: '11th Marines', mos: '0802', description: 'Regimental operations oversight', section: 'HIGHER_HQ' },
];

export const SECTION_TITLES: Record<string, string> = {
  COMMAND: 'COMMAND ELEMENT',
  STAFF: 'BATTALION STAFF',
  COMPANY: 'BATTERY COMMANDERS',
  OPERATORS: 'OPERATORS',
  HIGHER_HQ: 'HIGHER HEADQUARTERS',
};
