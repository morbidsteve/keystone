export const HELP_CONTENT: Record<string, string> = {
  // Sidebar Navigation
  'nav-dashboard':
    'View the main logistics dashboard with KPIs, readiness gauges, and supply status across all units.',
  'nav-map':
    'Interactive map showing unit positions, supply points, convoy routes, and alerts with military symbology.',
  'nav-supply':
    'Track supply levels by class (I-X), days of supply, and consumption rates for selected units.',
  'nav-equipment':
    'Monitor equipment readiness, maintenance status, work orders, and fault trends.',
  'nav-maintenance':
    'View maintenance analytics including top faults, trend charts, and scheduled maintenance windows.',
  'nav-personnel':
    'Track personnel strength, qualifications, EAS timelines, and manning levels.',
  'nav-medical':
    'Monitor medical treatment facility status, blood bank levels, and submit 9-line MEDEVAC requests.',
  'nav-fuel':
    'Track fuel storage levels, forecast consumption, and monitor distribution across supply points.',
  'nav-transportation':
    'Plan convoys, track active movements, manage lift requests, and view route throughput.',
  'nav-ingestion':
    'Ingest data from spreadsheets, TAK feeds, and other sources. Map schemas and review queued records.',
  'nav-data-sources':
    'Configure and monitor external data source connections including MIRC, TAK, and Excel watches.',
  'nav-reports':
    'Generate, schedule, and export logistics reports using customizable templates.',
  'nav-alerts':
    'View and manage system alerts, threshold warnings, and operational notifications.',
  'nav-readiness':
    'View unit readiness ratings, strength tables, and readiness trend charts.',
  'nav-admin':
    'System administration: manage users, roles, unit hierarchy, tile layers, and scenarios.',
  'nav-docs':
    'Access system documentation, user guides, and API reference.',
  'nav-custody':
    'Track chain of custody for sensitive items and serialized equipment.',
  'nav-audit':
    'View audit logs of all system actions for accountability and compliance.',

  // Dashboard KPIs
  'kpi-total-units':
    'Total number of units currently tracked in the system within your scope of visibility.',
  'kpi-avg-readiness':
    'Weighted average readiness percentage across all tracked units. Green >= 90%, Yellow >= 70%, Red < 70%.',
  'kpi-active-alerts':
    'Number of unresolved alerts including threshold breaches, overdue maintenance, and supply shortfalls.',
  'kpi-dos':
    'Average days of supply remaining across all supply classes for the selected unit scope.',
  'kpi-equipment-or':
    'Operational readiness rate for tracked equipment. Percentage of equipment in mission-capable status.',
  'kpi-convoy-active':
    'Number of convoys currently in transit or staged for departure within the next 24 hours.',

  // Common UI Elements
  'unit-selector':
    'Select a unit to filter all dashboard data. Shows your unit and subordinate units in the hierarchy.',
  'time-range-selector':
    'Filter data by time period: 24H (last 24 hours), 7D (last week), 30D (last month), ALL (all available data).',
  'search-button':
    'Open the command palette (Ctrl+K) to quickly search for units, pages, supply items, or equipment.',
  'alert-bell':
    'Notification bell showing unread alert count. Click to navigate to the alerts page.',
  'user-menu':
    'View your profile, role, and unit assignment. Access logout.',
  'classification-banner':
    'Shows the current classification level of displayed data. Always verify before sharing information.',
  'quick-actions':
    'Quick access to common actions like creating convoy plans, submitting requests, or generating reports.',
  'breadcrumb':
    'Shows your current location in the application. Click parent items to navigate back.',

  // Form Fields
  'field-mgrs':
    'Military Grid Reference System coordinate. Enter as: Grid Zone (e.g., 18S), 100km Square (e.g., UJ), Easting, Northing.',
  'field-supply-class':
    'NATO supply classification: I (Rations), II (Clothing/Equipment), III (POL), IV (Construction), V (Ammo), VI (Personal), VII (Major End Items), VIII (Medical), IX (Repair Parts), X (Non-military).',
  'field-readiness-rating':
    'Unit readiness rating: C1 (Fully Ready), C2 (Substantially Ready), C3 (Marginally Ready), C4 (Not Ready).',

  // Readiness Gauges
  'gauge-personnel':
    'Personnel fill rate against authorized strength. Includes all MOS categories.',
  'gauge-equipment':
    'Equipment operational readiness. Ratio of mission-capable to total assigned equipment.',
  'gauge-supply':
    'Supply sufficiency index based on days of supply across all classes vs required levels.',
  'gauge-training':
    'Training readiness based on qualification currency and required certifications.',
};

export function getHelpContent(key: string): string {
  return HELP_CONTENT[key] || `No help content available for "${key}".`;
}
