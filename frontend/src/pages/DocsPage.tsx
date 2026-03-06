import { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'quickstart' | 'modules' | 'glossary' | 'faq';

interface RoleGuide {
  id: string;
  label: string;
  icon: string;
  overview: string;
  workflows: Workflow[];
  shortcuts: Shortcut[];
}

interface Workflow {
  title: string;
  steps: (string | { text: string; substeps: string[] })[];
}

interface Shortcut {
  keys: string;
  action: string;
}

interface ModuleRef {
  id: string;
  label: string;
  icon: string;
  description: string;
  sections: ModuleSection[];
}

interface ModuleSection {
  title: string;
  content: string;
}

interface GlossaryItem {
  term: string;
  definition: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// ─── Data: Role Guides ──────────────────────────────────────────────────────

const roleGuides: RoleGuide[] = [
  {
    id: 'COMMANDER',
    label: 'Commander',
    icon: '\uD83C\uDF96\uFE0F',
    overview:
      'As the unit Commander, KEYSTONE gives you a consolidated view of logistics readiness across all subordinate elements. Your primary interface is the Dashboard, which aggregates equipment status, supply levels, personnel strength, and medical readiness into actionable readiness ratings (C-1 through C-5). You approve high-value requisitions, review alerts, and generate daily status reports for higher headquarters.',
    workflows: [
      {
        title: 'Check Daily Readiness',
        steps: [
          { text: 'Navigate to Dashboard', substeps: ['Click "Dashboard" in the left sidebar or press Ctrl+1.'] },
          { text: 'Review Readiness Cards', substeps: ['The top row shows C-rating cards for Equipment, Supply, Personnel, and Medical.', 'Green (C-1/C-2) means mission-capable; Yellow (C-3) needs attention; Red (C-4/C-5) is critical.'] },
          { text: 'Drill into Problem Areas', substeps: ['Click any card to jump to that module\'s detail view.', 'For example, clicking the Equipment card opens the Equipment page filtered to NMC items.'] },
          { text: 'Check Trend Charts', substeps: ['Scroll down to view 7-day and 30-day readiness trend lines.', 'Look for downward trends that may indicate systemic issues.'] },
        ],
      },
      {
        title: 'Review Critical Alerts',
        steps: [
          { text: 'Open Alerts Panel', substeps: ['Click the bell icon in the top nav bar, or navigate to Alerts page.'] },
          { text: 'Filter by Severity', substeps: ['Use the severity filter to show only "Critical" and "High" alerts.'] },
          { text: 'Acknowledge Alerts', substeps: ['Click each alert to expand details.', 'Click "Acknowledge" to mark as reviewed.', 'Add a comment if action is being taken.'] },
          { text: 'Assign Follow-up', substeps: ['Use the "Assign" button to delegate to the responsible staff section (S-4, S-3, etc.).'] },
        ],
      },
      {
        title: 'Read Equipment & Supply Status',
        steps: [
          { text: 'Navigate to Equipment Module', substeps: ['Click "Equipment" in the sidebar.'] },
          { text: 'Review FMC/NMC Summary', substeps: ['The top bar shows total equipment count, FMC rate, NMC-M, and NMC-S counts.', 'FMC rate should be above 90% for C-1 readiness.'] },
          { text: 'Check Supply Levels', substeps: ['Navigate to Supply module.', 'Review stock levels by supply class (I through X).', 'Items below reorder point are highlighted in amber/red.'] },
          { text: 'Cross-reference with Readiness', substeps: ['Return to Dashboard to see how equipment and supply status affects overall C-rating.'] },
        ],
      },
      {
        title: 'Monitor Personnel Strength & Medical',
        steps: [
          { text: 'Open Personnel Module', substeps: ['Click "Personnel" in the sidebar.'] },
          { text: 'Review Strength Numbers', substeps: ['Check authorized vs. assigned vs. present-for-duty counts.', 'Note any critical MOS shortfalls highlighted in red.'] },
          { text: 'Check Medical Readiness', substeps: ['Navigate to Medical module.', 'Review medical readiness percentage and overdue screenings.', 'Check dental readiness classification (Class 1-4).'] },
        ],
      },
      {
        title: 'Review Pending Approvals',
        steps: [
          { text: 'Open Requisitions Module', substeps: ['Click "Requisitions" in the sidebar.'] },
          { text: 'Filter to "Pending Approval"', substeps: ['Use the status filter dropdown and select "Pending CO Approval".'] },
          { text: 'Review Each Requisition', substeps: ['Click a requisition to see full details: item, quantity, justification, cost.', 'Check the priority level and requesting unit.'] },
          { text: 'Approve or Return', substeps: ['Click "Approve" to authorize the requisition.', 'Click "Return for Revision" with comments if more justification is needed.'] },
        ],
      },
      {
        title: 'Generate Daily SITREP/LOGSTAT',
        steps: [
          { text: 'Navigate to Reports Module', substeps: ['Click "Reports" in the sidebar.'] },
          { text: 'Select Report Template', substeps: ['Choose "Daily LOGSTAT" or "SITREP" from the template list.'] },
          { text: 'Configure Parameters', substeps: ['Select the reporting period (default: last 24 hours).', 'Choose subordinate units to include.'] },
          { text: 'Generate and Review', substeps: ['Click "Generate Report".', 'Review the output for accuracy.', 'Export as PDF or send to higher HQ.'] },
        ],
      },
      {
        title: 'Approve S-4 Requisitions',
        steps: [
          { text: 'Check Notification Badge', substeps: ['Look for the red badge on the Requisitions nav item indicating pending approvals.'] },
          { text: 'Open Pending Queue', substeps: ['Navigate to Requisitions and filter by "Awaiting CO Approval".'] },
          { text: 'Batch Review', substeps: ['Use the checkbox column to select multiple routine requisitions.', 'Click "Batch Approve" for standard items below threshold.'] },
          { text: 'Individual Review for High-Value Items', substeps: ['Items above the dollar threshold require individual review.', 'Verify funding source and mission justification.', 'Approve, deny, or return with comments.'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + 1', action: 'Go to Dashboard' },
      { keys: 'Ctrl + Shift + A', action: 'Open Alerts' },
      { keys: 'Ctrl + Shift + R', action: 'Open Reports' },
      { keys: 'Ctrl + Shift + S', action: 'Quick Search' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
  {
    id: 'S4',
    label: 'S-4 (Logistics Officer)',
    icon: '\uD83D\uDCE6',
    overview:
      'As the S-4 Logistics Officer, KEYSTONE is your primary tool for managing all classes of supply, equipment maintenance, requisitions, fuel accountability, convoy planning, and sensitive item tracking. You have full read/write access to logistics modules and are responsible for maintaining accurate data, processing requisitions, and ensuring supply readiness across the battalion.',
    workflows: [
      {
        title: 'Daily Logistics Standup',
        steps: [
          { text: 'Check Dashboard', substeps: ['Open Dashboard to review overnight changes to readiness ratings.', 'Note any new critical alerts or status changes.'] },
          { text: 'Review Supply Status', substeps: ['Navigate to Supply module.', 'Check items below minimum stock levels.', 'Review pending receipts and expected deliveries.'] },
          { text: 'Check Maintenance Queue', substeps: ['Open Maintenance module.', 'Review new work orders submitted overnight.', 'Check status of equipment in maintenance cycle.'] },
          { text: 'Review Pending Requisitions', substeps: ['Open Requisitions module.', 'Process any new requisition requests.', 'Update status on in-progress requisitions.'] },
        ],
      },
      {
        title: 'Submit & Manage Requisitions',
        steps: [
          { text: 'Create New Requisition', substeps: ['Navigate to Requisitions module.', 'Click "+ New Requisition" button.', 'Select supply class and item from catalog.'] },
          { text: 'Fill Requisition Details', substeps: ['Enter quantity, unit of issue, and delivery priority.', 'Provide justification narrative.', 'Attach supporting documents if required.'] },
          { text: 'Route for Approval', substeps: ['Submit requisition for CO approval if above threshold.', 'Track approval status in the requisition timeline.'] },
          { text: 'Track Fulfillment', substeps: ['Monitor requisition status through the pipeline.', 'Update receipt quantities when items arrive.', 'Close requisition when fully received.'] },
        ],
      },
      {
        title: 'Track Equipment Maintenance',
        steps: [
          { text: 'Open Equipment Module', substeps: ['Navigate to Equipment page.', 'Filter by maintenance status (NMC-M, NMC-S).'] },
          { text: 'Review Work Orders', substeps: ['Click on a deadlined item to view its work order history.', 'Check parts on order and estimated completion date.'] },
          { text: 'Update Maintenance Status', substeps: ['When repairs are complete, update equipment status to FMC.', 'Log maintenance action in the equipment history.'] },
          { text: 'Escalate Long-Lead Items', substeps: ['Identify equipment deadlined more than 30 days.', 'Create escalation request to higher maintenance authority.'] },
        ],
      },
      {
        title: 'Monitor Supply Levels',
        steps: [
          { text: 'Open Supply Module', substeps: ['Navigate to Supply page.'] },
          { text: 'Review by Supply Class', substeps: ['Use the class filter tabs (I through X) to review each class.', 'Check current on-hand quantities against authorized levels.'] },
          { text: 'Identify Shortfalls', substeps: ['Items highlighted in red are below minimum stock level.', 'Items in amber are approaching minimum.'] },
          { text: 'Generate Requisitions for Shortfalls', substeps: ['Select shortage items and click "Generate Requisition".', 'System auto-fills item details and calculates order quantity.'] },
        ],
      },
      {
        title: 'Plan & Execute Convoys',
        steps: [
          { text: 'Open Transportation Module', substeps: ['Navigate to Transportation page.'] },
          { text: 'Create Convoy Request', substeps: ['Click "+ New Convoy" button.', 'Define route, departure/arrival points, and timeline.', 'Add vehicles and cargo manifest.'] },
          { text: 'Coordinate Approvals', substeps: ['Submit convoy plan for S-3 route approval.', 'Attach risk assessment and mitigation plan.'] },
          { text: 'Track Convoy Movement', substeps: ['Monitor active convoys on the Map module.', 'Update status at checkpoints.', 'Log completion and any incidents.'] },
        ],
      },
      {
        title: 'Fuel Accountability',
        steps: [
          { text: 'Open Fuel Module', substeps: ['Navigate to Fuel management page.'] },
          { text: 'Record Fuel Receipts', substeps: ['Log incoming fuel deliveries with quantity and type (JP-8, diesel, MOGAS).', 'Record vendor/source and document number.'] },
          { text: 'Record Fuel Issues', substeps: ['Log fuel issued to vehicles and equipment.', 'Record odometer/hourmeter readings.'] },
          { text: 'Reconcile Daily', substeps: ['Compare physical measurements with system balance.', 'Investigate and document any variances.', 'Submit daily fuel accountability report.'] },
        ],
      },
      {
        title: 'Sensitive Item Accountability',
        steps: [
          { text: 'Open Custody Module', substeps: ['Navigate to Chain of Custody page.'] },
          { text: 'Conduct Inventory', substeps: ['Select sensitive items requiring inventory.', 'Scan or manually verify each serial number.', 'Record inventory results.'] },
          { text: 'Process Hand Receipts', substeps: ['Create or update hand receipt for item transfers.', 'Require digital signature from receiving party.', 'Update chain of custody record.'] },
          { text: 'Report Discrepancies', substeps: ['If any item is missing or damaged, create a discrepancy report.', 'System automatically generates alert to CO and S-4.'] },
        ],
      },
      {
        title: 'Medical Readiness',
        steps: [
          { text: 'Open Medical Module', substeps: ['Navigate to Medical readiness page.'] },
          { text: 'Review Unit Medical Status', substeps: ['Check overall medical readiness percentage.', 'Review overdue physical exams, dental, immunizations.'] },
          { text: 'Coordinate with Medical', substeps: ['Generate list of personnel needing medical attention.', 'Coordinate appointment schedules with BAS/medical.'] },
        ],
      },
      {
        title: 'Audit & Accountability',
        steps: [
          { text: 'Open Audit Module', substeps: ['Navigate to Audit trail page.'] },
          { text: 'Review Recent Changes', substeps: ['Filter audit log by date range, module, and user.', 'Review all supply transactions for accuracy.'] },
          { text: 'Run Accountability Reports', substeps: ['Generate CMR (Command Managed Report).', 'Cross-reference physical inventory with system records.', 'Document and resolve discrepancies.'] },
        ],
      },
      {
        title: 'Generate S-4 Status Reports',
        steps: [
          { text: 'Open Reports Module', substeps: ['Navigate to Reports page.'] },
          { text: 'Select Report Type', substeps: ['Choose from LOGSTAT, Equipment Status, Supply Status, or Custom.'] },
          { text: 'Configure and Generate', substeps: ['Set reporting period and included units.', 'Generate the report.'] },
          { text: 'Review and Submit', substeps: ['Review for accuracy.', 'Export as PDF, Excel, or formatted LOGSTAT.', 'Submit to CO and higher HQ.'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + 1', action: 'Go to Dashboard' },
      { keys: 'Ctrl + N', action: 'New Requisition' },
      { keys: 'Ctrl + Shift + E', action: 'Open Equipment' },
      { keys: 'Ctrl + Shift + S', action: 'Quick Search' },
      { keys: 'Ctrl + Shift + M', action: 'Open Maintenance' },
      { keys: 'Ctrl + Shift + R', action: 'Open Reports' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
  {
    id: 'S3',
    label: 'S-3 (Operations Officer)',
    icon: '\u2694\uFE0F',
    overview:
      'As the S-3 Operations Officer, KEYSTONE helps you assess logistics feasibility for planned operations, monitor readiness during field exercises, coordinate movement and convoy requirements, and track active operations on the map. Your view emphasizes operational readiness, transportation, and the intersection of logistics with mission planning.',
    workflows: [
      {
        title: 'Check Logistics Feasibility',
        steps: [
          { text: 'Open Readiness Module', substeps: ['Navigate to Readiness page.'] },
          { text: 'Review Current C-Ratings', substeps: ['Check equipment, supply, personnel, and medical readiness ratings.', 'Identify any areas at C-3 or below that could impact the mission.'] },
          { text: 'Check Supply Sustainability', substeps: ['Navigate to Supply module.', 'Review days of supply on hand for critical classes (I, III, V, IX).'] },
          { text: 'Assess Transportation Availability', substeps: ['Navigate to Transportation module.', 'Check available vehicle capacity against movement requirements.'] },
        ],
      },
      {
        title: 'Monitor Readiness for FTX',
        steps: [
          { text: 'Open Dashboard', substeps: ['Review all readiness indicators for participating units.'] },
          { text: 'Check Equipment Availability', substeps: ['Navigate to Equipment module.', 'Filter by units participating in the FTX.', 'Verify FMC rates meet minimum requirements.'] },
          { text: 'Verify Supply Stocks', substeps: ['Check Class I (rations), III (fuel), V (ammo), and VIII (medical) levels.', 'Coordinate with S-4 on any shortfalls.'] },
          { text: 'Review Personnel Status', substeps: ['Check personnel strength for participating units.', 'Verify key MOS positions are filled.'] },
        ],
      },
      {
        title: 'Plan Movement & Convoy Requirements',
        steps: [
          { text: 'Open Transportation Module', substeps: ['Navigate to Transportation page.'] },
          { text: 'Define Movement Requirements', substeps: ['Specify units, equipment, and personnel to be moved.', 'Define timeline and destination.'] },
          { text: 'Review Available Assets', substeps: ['Check available organic transportation.', 'Identify if external lift support is needed.'] },
          { text: 'Approve Convoy Routes', substeps: ['Review S-4 submitted convoy plans.', 'Approve routes and timelines.', 'Coordinate with supported/supporting units.'] },
        ],
      },
      {
        title: 'Monitor Active Ops on Map',
        steps: [
          { text: 'Open Map Module', substeps: ['Navigate to Map page.'] },
          { text: 'Enable Logistics Overlays', substeps: ['Toggle on supply point, maintenance, and fuel overlays.', 'Enable convoy route display.'] },
          { text: 'Track Unit Positions', substeps: ['Monitor unit locations and movement progress.', 'Check supply point status and throughput.'] },
          { text: 'Coordinate with S-4', substeps: ['Use map annotations to mark logistics control points.', 'Share map view with S-4 for coordination.'] },
        ],
      },
      {
        title: 'Request Emergency Logistics Support',
        steps: [
          { text: 'Create Priority Requisition', substeps: ['Navigate to Requisitions module.', 'Click "+ New Requisition" and set priority to "Emergency".'] },
          { text: 'Specify Urgency', substeps: ['Select NMCS (Not Mission Capable - Supply) if applicable.', 'Provide mission impact statement.'] },
          { text: 'Route for Expedited Approval', substeps: ['Emergency requisitions route directly to CO.', 'System generates alert to S-4 and CO simultaneously.'] },
        ],
      },
      {
        title: 'After-Action Review',
        steps: [
          { text: 'Open Reports Module', substeps: ['Navigate to Reports page.'] },
          { text: 'Generate AAR Data', substeps: ['Select "After-Action Review" report template.', 'Set the date range covering the operation.'] },
          { text: 'Review Logistics Performance', substeps: ['Analyze supply consumption rates vs. planned.', 'Review equipment readiness trends during the operation.', 'Identify maintenance issues that impacted operations.'] },
          { text: 'Document Lessons Learned', substeps: ['Export report data for AAR briefing.', 'Note logistics sustainment successes and shortfalls.'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + 1', action: 'Go to Dashboard' },
      { keys: 'Ctrl + Shift + M', action: 'Open Map' },
      { keys: 'Ctrl + Shift + T', action: 'Open Transportation' },
      { keys: 'Ctrl + Shift + R', action: 'Open Reports' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
  {
    id: 'OPERATOR',
    label: 'Operator',
    icon: '\uD83D\uDCBC',
    overview:
      'As an Operator, you are the primary data entry point for KEYSTONE. You submit supply requisitions, report equipment status changes, create maintenance work orders, update inventory counts, and manage personnel medical status. Your accurate and timely data entry is critical for the entire unit\'s logistics picture. You have create/edit access to most logistics modules but cannot approve requisitions or modify organizational structure.',
    workflows: [
      {
        title: 'Submit Supply Requisition',
        steps: [
          { text: 'Open Requisitions Module', substeps: ['Click "Requisitions" in the sidebar.'] },
          { text: 'Click "+ New Requisition"', substeps: ['The requisition form opens.'] },
          { text: 'Search Item Catalog', substeps: ['Type NSN, NIIN, or item name in the search field.', 'Select the correct item from results.'] },
          { text: 'Fill Details', substeps: ['Enter quantity needed and unit of issue.', 'Select priority (Routine, Priority, Emergency).', 'Write justification narrative.'] },
          { text: 'Submit', substeps: ['Click "Submit" to send for S-4 review.', 'Track status in your "My Requisitions" view.'] },
        ],
      },
      {
        title: 'Report Equipment Status Change',
        steps: [
          { text: 'Open Equipment Module', substeps: ['Navigate to Equipment page.'] },
          { text: 'Find the Equipment Item', substeps: ['Search by TAMCN, serial number, or bumper number.', 'Click the item to open its detail view.'] },
          { text: 'Update Status', substeps: ['Click "Update Status" button.', 'Select new status: FMC, NMC-M (maintenance), NMC-S (supply), or Deadlined.', 'Provide reason for status change.'] },
          { text: 'Submit Change', substeps: ['Click "Save" to record the change.', 'System logs the change in audit trail and updates readiness calculations.'] },
        ],
      },
      {
        title: 'Create Maintenance Work Order',
        steps: [
          { text: 'Open Maintenance Module', substeps: ['Navigate to Maintenance page.'] },
          { text: 'Click "+ New Work Order"', substeps: ['The work order form opens.'] },
          { text: 'Select Equipment', substeps: ['Search and select the equipment item needing maintenance.', 'System auto-fills equipment details.'] },
          { text: 'Describe the Issue', substeps: ['Select maintenance type (scheduled, corrective, emergency).', 'Describe the fault or required maintenance.', 'Specify parts needed if known.'] },
          { text: 'Submit Work Order', substeps: ['Submit for S-4/maintenance section review.', 'Track progress through work order stages.'] },
        ],
      },
      {
        title: 'Update Supply Inventory',
        steps: [
          { text: 'Open Supply Module', substeps: ['Navigate to Supply page.'] },
          { text: 'Select Item to Update', substeps: ['Search for the item by NSN, name, or location.'] },
          { text: 'Record Transaction', substeps: ['Click "Record Transaction" on the item.', 'Select type: Receipt, Issue, Turn-in, or Adjustment.', 'Enter quantity and document number.'] },
          { text: 'Confirm and Save', substeps: ['Verify the transaction details.', 'Click "Save" to update inventory.', 'System recalculates stock levels automatically.'] },
        ],
      },
      {
        title: 'Complete Personnel Medical Status',
        steps: [
          { text: 'Open Medical Module', substeps: ['Navigate to Medical page.'] },
          { text: 'Find Personnel Record', substeps: ['Search by name, EDIPI, or unit.'] },
          { text: 'Update Medical Items', substeps: ['Update physical exam date, dental class, immunization status.', 'Record any duty limitations or profiles.'] },
          { text: 'Save Changes', substeps: ['Click "Save" to update the record.', 'Medical readiness percentages update automatically.'] },
        ],
      },
      {
        title: 'Log In to Sensitive Item Hand Receipt',
        steps: [
          { text: 'Open Custody Module', substeps: ['Navigate to Chain of Custody page.'] },
          { text: 'Find Your Hand Receipt', substeps: ['Select your unit or search by your name.'] },
          { text: 'Verify Items', substeps: ['Review all items on your hand receipt.', 'Confirm serial numbers and quantities match physical inventory.'] },
          { text: 'Sign Hand Receipt', substeps: ['Click "Verify & Sign" to digitally sign accountability.', 'System records the verification in the audit trail.'] },
        ],
      },
      {
        title: 'Check Upcoming Medical/Training',
        steps: [
          { text: 'Open Personnel Module', substeps: ['Navigate to Personnel page.'] },
          { text: 'View Your Profile', substeps: ['Click your name or search for your record.'] },
          { text: 'Review Upcoming Items', substeps: ['Check medical appointments, dental exams, and immunization due dates.', 'Review training requirements and certifications.'] },
        ],
      },
      {
        title: 'View Supply Catalog',
        steps: [
          { text: 'Open Supply Module', substeps: ['Navigate to Supply page.'] },
          { text: 'Open Catalog Search', substeps: ['Click "Search Catalog" or use the search bar.'] },
          { text: 'Search for Items', substeps: ['Search by NSN, NIIN, nomenclature, or keyword.', 'Browse by supply class category.'] },
          { text: 'View Item Details', substeps: ['Click an item to see full details: NSN, description, unit of issue, price, and current stock levels.'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + N', action: 'New Requisition' },
      { keys: 'Ctrl + Shift + E', action: 'Open Equipment' },
      { keys: 'Ctrl + Shift + S', action: 'Quick Search' },
      { keys: 'Ctrl + Shift + W', action: 'New Work Order' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
  {
    id: 'VIEWER',
    label: 'Viewer',
    icon: '\uD83D\uDC41\uFE0F',
    overview:
      'As a Viewer, you have read-only access to KEYSTONE. You can see dashboards, maps, historical reports, and audit trails, but you cannot create, edit, or approve any records. This role is ideal for higher headquarters staff, liaison officers, inspectors, or anyone who needs situational awareness without modification capability.',
    workflows: [
      {
        title: 'View Unit Readiness Dashboard',
        steps: [
          { text: 'Open Dashboard', substeps: ['Click "Dashboard" in the sidebar.'] },
          { text: 'Review Readiness Cards', substeps: ['View C-rating cards for Equipment, Supply, Personnel, and Medical.', 'All data is real-time but read-only.'] },
          { text: 'Explore Detail Views', substeps: ['Click any readiness card to see detailed breakdown.', 'You can view all data but cannot modify anything.'] },
        ],
      },
      {
        title: 'View Operations Map',
        steps: [
          { text: 'Open Map Module', substeps: ['Navigate to Map page.'] },
          { text: 'Browse Map Layers', substeps: ['Toggle unit positions, supply points, maintenance facilities, and convoy routes.', 'Zoom and pan to areas of interest.'] },
          { text: 'View Feature Details', substeps: ['Click map markers to see details about units, supply points, or convoys.'] },
        ],
      },
      {
        title: 'View Historical Reports',
        steps: [
          { text: 'Open Reports Module', substeps: ['Navigate to Reports page.'] },
          { text: 'Browse Report Library', substeps: ['View previously generated reports.', 'Filter by type, date range, and generating unit.'] },
          { text: 'Open and Export', substeps: ['Click a report to view it.', 'Export as PDF for your records (download only, no editing).'] },
        ],
      },
      {
        title: 'View Audit Trail',
        steps: [
          { text: 'Open Audit Module', substeps: ['Navigate to Audit page.'] },
          { text: 'Search Audit Logs', substeps: ['Filter by date range, user, module, or action type.', 'View who made what changes and when.'] },
          { text: 'Export Audit Data', substeps: ['Export filtered audit log for external review.'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + 1', action: 'Go to Dashboard' },
      { keys: 'Ctrl + Shift + M', action: 'Open Map' },
      { keys: 'Ctrl + Shift + R', action: 'Open Reports' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    icon: '\u2699\uFE0F',
    overview:
      'As a System Administrator, you have full access to all KEYSTONE modules plus exclusive access to user management, organizational structure configuration, data import/integration, system health monitoring, and backup/recovery. You are responsible for keeping the system operational, managing user accounts and permissions, and ensuring data integrity.',
    workflows: [
      {
        title: 'User & Permission Management',
        steps: [
          { text: 'Open Admin Panel', substeps: ['Click "Admin" in the sidebar (only visible to Admin role).'] },
          { text: 'Manage Users', substeps: ['View all user accounts.', 'Create new users: set username, role, unit assignment, and permissions.', 'Edit existing users: change role, reset password, enable/disable account.'] },
          { text: 'Manage Roles & Permissions', substeps: ['View role definitions and associated permissions.', 'Custom permission overrides can be set per user if needed.'] },
          { text: 'Review Active Sessions', substeps: ['View currently logged-in users.', 'Force logout if needed for security.'] },
        ],
      },
      {
        title: 'Organizational Structure',
        steps: [
          { text: 'Open Org Structure', substeps: ['Navigate to Admin > Organization.'] },
          { text: 'Manage Unit Hierarchy', substeps: ['View and edit the unit hierarchy tree.', 'Add new units at appropriate echelon level.', 'Set parent-child relationships.'] },
          { text: 'Assign Users to Units', substeps: ['Drag users to units or use the assignment dialog.', 'Users inherit data visibility based on their unit and subordinates.'] },
        ],
      },
      {
        title: 'Integration & Data Import',
        steps: [
          { text: 'Open Data Ingestion', substeps: ['Navigate to Admin > Ingestion.'] },
          { text: 'Upload Data Files', substeps: ['Support for CSV, Excel, and JSON formats.', 'Map columns to KEYSTONE fields.', 'Validate data before import.'] },
          { text: 'Configure Integrations', substeps: ['Set up automated data feeds from external systems.', 'Configure API keys and endpoints.', 'Schedule periodic imports.'] },
          { text: 'Review Import History', substeps: ['View past imports with success/failure counts.', 'Download error reports for failed records.'] },
        ],
      },
      {
        title: 'System Health & Performance',
        steps: [
          { text: 'Open System Health', substeps: ['Navigate to Admin > System Health.'] },
          { text: 'Monitor Services', substeps: ['View status of all backend services (API, database, cache, task queue).', 'Check response times and error rates.'] },
          { text: 'Review System Logs', substeps: ['Filter logs by service, severity, and time range.', 'Search for specific error messages.'] },
          { text: 'Performance Metrics', substeps: ['View database query performance.', 'Monitor memory and CPU usage trends.', 'Check cache hit rates.'] },
        ],
      },
      {
        title: 'Backup & Disaster Recovery',
        steps: [
          { text: 'Open Backup Management', substeps: ['Navigate to Admin > Backups.'] },
          { text: 'View Backup Schedule', substeps: ['Check automatic backup schedule and last successful backup.', 'Verify backup integrity status.'] },
          { text: 'Create Manual Backup', substeps: ['Click "Backup Now" for an immediate backup.', 'Choose full or incremental backup type.'] },
          { text: 'Restore from Backup', substeps: ['Select a backup point to restore from.', 'System performs pre-restore validation.', 'Confirm restore action (requires re-authentication).'] },
        ],
      },
    ],
    shortcuts: [
      { keys: 'Ctrl + 1', action: 'Go to Dashboard' },
      { keys: 'Ctrl + Shift + U', action: 'Open User Management' },
      { keys: 'Ctrl + Shift + O', action: 'Open Organization' },
      { keys: 'Ctrl + Shift + H', action: 'Open System Health' },
      { keys: 'Ctrl + /', action: 'Open Keyboard Shortcuts Help' },
    ],
  },
];

// ─── Data: Module References ────────────────────────────────────────────────

const moduleRefs: ModuleRef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '\uD83D\uDCCA',
    description: 'Aggregated logistics readiness overview for your unit and subordinates.',
    sections: [
      { title: 'Overview', content: 'The Dashboard is the primary landing page for KEYSTONE. It provides a consolidated view of unit logistics readiness through C-rating cards, trend charts, alert summaries, and quick-action links. Data refreshes automatically every 60 seconds.' },
      { title: 'Readiness Cards', content: 'Four cards display C-ratings (C-1 through C-5) for Equipment, Supply, Personnel, and Medical. Each card shows the current rating, trend direction, and percentage. Click any card to drill into the corresponding module.' },
      { title: 'Trend Charts', content: '7-day and 30-day trend lines show how each readiness area has changed over time. Hover over data points to see exact values. Use the date range picker to customize the view.' },
      { title: 'Alert Summary', content: 'A compact list of the most recent critical and high-severity alerts. Click an alert to navigate to the full Alerts module. Badge count shows unacknowledged alerts.' },
      { title: 'Quick Actions', content: 'Role-based quick action buttons appear at the top. Commanders see "Approve Requisitions" and "Generate Report". S-4 sees "New Requisition" and "Update Inventory". Operators see "Submit Requisition" and "Report Status".' },
    ],
  },
  {
    id: 'map',
    label: 'Map',
    icon: '\uD83D\uDDFA\uFE0F',
    description: 'Geospatial view of unit positions, supply points, routes, and operations.',
    sections: [
      { title: 'Overview', content: 'The Map module provides a Leaflet-based interactive map showing unit positions, supply points, maintenance facilities, convoy routes, and logistics control points. Supports multiple base layers and overlay toggles.' },
      { title: 'Map Layers', content: 'Toggle layers: Unit Positions, Supply Points (ASP, FSP), Maintenance Facilities, Fuel Points, Convoy Routes, and Medical Facilities. Each layer uses standard military symbology.' },
      { title: 'Interaction', content: 'Click markers to view details. Right-click for context menu options. Use the measure tool for distance calculations. Draw tools allow S-3/S-4 to annotate the map.' },
      { title: 'Filters', content: 'Filter map features by unit, echelon, status, and time range. Search for specific locations or units using the search bar.' },
    ],
  },
  {
    id: 'supply',
    label: 'Supply',
    icon: '\uD83D\uDCE6',
    description: 'Track all classes of supply (I-X) with stock levels, transactions, and catalog search.',
    sections: [
      { title: 'Overview', content: 'The Supply module manages all ten classes of supply. View current stock levels, record transactions (receipts, issues, turn-ins, adjustments), search the item catalog, and monitor reorder points.' },
      { title: 'Stock Levels', content: 'Table view shows each item with NSN, nomenclature, current quantity, authorized level, reorder point, and status indicator. Items below reorder point are highlighted. Sort and filter by any column.' },
      { title: 'Transactions', content: 'Record supply transactions with full traceability. Each transaction requires document number, type (receipt/issue/turn-in/adjustment), quantity, and authorization. All transactions are audit-logged.' },
      { title: 'Catalog Search', content: 'Search the supply catalog by NSN, NIIN, nomenclature, or keyword. View item details including unit of issue, price, and supply class. Create requisitions directly from catalog results.' },
      { title: 'Supply Class Tabs', content: 'Filter view by supply class: Class I (Rations), II (Clothing/Equipment), III (POL), IV (Construction), V (Ammunition), VI (Personal Items), VII (Major End Items), VIII (Medical), IX (Repair Parts), X (Non-military).' },
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    icon: '\uD83D\uDE9A',
    description: 'Track all unit equipment: status, location, serial numbers, and readiness rates.',
    sections: [
      { title: 'Overview', content: 'The Equipment module tracks every piece of reportable equipment in the unit. View status (FMC, NMC-M, NMC-S, Deadlined), location, serial/bumper numbers, and maintenance history. Equipment data feeds directly into readiness calculations.' },
      { title: 'Equipment List', content: 'Table view with TAMCN, nomenclature, serial number, bumper number, status, location, and assigned unit. Color-coded status indicators: green (FMC), yellow (NMC partial), red (Deadlined). Filter by status, type, or unit.' },
      { title: 'Equipment Detail', content: 'Click any item to see full detail: technical data, maintenance history, hand receipt holder, location history, and associated work orders. Update status with required justification.' },
      { title: 'FMC Rate Dashboard', content: 'Visual display of FMC rates by equipment type and unit. Bar charts compare authorized vs. on-hand vs. FMC. Trend lines show rate changes over time.' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '\uD83D\uDD27',
    description: 'Work order management, maintenance scheduling, and parts tracking.',
    sections: [
      { title: 'Overview', content: 'The Maintenance module manages the complete maintenance lifecycle from fault identification through repair completion. Create work orders, track parts on order, schedule preventive maintenance, and monitor maintenance backlogs.' },
      { title: 'Work Orders', content: 'Create, edit, and track work orders. Each work order includes: equipment item, fault description, maintenance type (scheduled/corrective/emergency), priority, assigned technician, parts needed, and estimated completion. Status workflow: Open > In Progress > Awaiting Parts > Complete.' },
      { title: 'Scheduling', content: 'Calendar view shows upcoming scheduled maintenance (PMCS, annual services, etc.). Overdue items highlighted in red. Drag-and-drop to reschedule. Set recurring maintenance schedules.' },
      { title: 'Parts Tracking', content: 'Track repair parts on order for each work order. Link parts requisitions to work orders. View estimated delivery dates. Alert when parts arrive so work can resume.' },
    ],
  },
  {
    id: 'requisitions',
    label: 'Requisitions',
    icon: '\uD83D\uDCCB',
    description: 'Submit, track, approve, and manage supply requisitions through the pipeline.',
    sections: [
      { title: 'Overview', content: 'The Requisitions module handles the full lifecycle of supply requests from submission through fulfillment. Submit new requisitions, track status, route for approval, and record receipt of items.' },
      { title: 'Create Requisition', content: 'Click "+ New Requisition" to start. Search item catalog, enter quantity, select priority (Routine/Priority/Emergency), provide justification, and submit. System auto-generates document number and routes to appropriate approver.' },
      { title: 'Approval Workflow', content: 'Requisitions follow a configurable approval chain. Standard flow: Operator submits > S-4 reviews > CO approves (if above threshold). Each approver can approve, return for revision, or deny. Full comment trail maintained.' },
      { title: 'Tracking', content: 'Track requisitions through stages: Draft > Submitted > S-4 Review > CO Approval > Ordered > Partially Received > Complete. Filter by status, priority, date, or requester. "My Requisitions" view shows your submissions.' },
      { title: 'Receipt', content: 'When items arrive, record partial or full receipt against the requisition. Enter received quantity, condition, and storage location. System updates supply inventory automatically.' },
    ],
  },
  {
    id: 'personnel',
    label: 'Personnel',
    icon: '\uD83D\uDC65',
    description: 'Personnel strength, MOS tracking, assignments, and duty status.',
    sections: [
      { title: 'Overview', content: 'The Personnel module tracks unit strength, MOS fill rates, duty status, and assignments. View authorized vs. assigned vs. present-for-duty numbers. Critical for readiness calculations and manpower planning.' },
      { title: 'Strength Report', content: 'Summary cards show total authorized, assigned, present-for-duty, and gains/losses. Breakdown by officer/enlisted/warrant. Filter by unit to see subordinate element strength.' },
      { title: 'MOS Tracking', content: 'View fill rates by MOS. Critical MOS shortfalls highlighted. MOS qualification tracking with expiration dates for certifications.' },
      { title: 'Personnel Roster', content: 'Searchable table of all assigned personnel with rank, name, MOS, unit, duty status, and medical readiness. Click any person to view full profile.' },
    ],
  },
  {
    id: 'readiness',
    label: 'Readiness',
    icon: '\uD83C\uDFAF',
    description: 'Composite readiness ratings (C-1 through C-5) with drill-down analysis.',
    sections: [
      { title: 'Overview', content: 'The Readiness module calculates and displays composite readiness ratings based on equipment status, supply levels, personnel strength, and medical readiness. Ratings follow standard C-1 through C-5 methodology.' },
      { title: 'C-Rating Calculation', content: 'C-1: Fully mission capable (>90%). C-2: Substantially mission capable (80-90%). C-3: Marginally mission capable (70-80%). C-4: Not mission capable (50-70%). C-5: Not mission capable (<50%). Each area (equipment, supply, personnel, medical) has its own rating; the composite is the lowest individual rating.' },
      { title: 'Trend Analysis', content: 'Historical readiness data displayed as trend lines. Compare readiness across time periods. Identify patterns and predict future readiness based on current trends.' },
      { title: 'Subordinate Comparison', content: 'Compare readiness ratings across subordinate units. Identify which units are driving overall readiness down. Drill into specific unit readiness for root cause analysis.' },
    ],
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: '\u2695\uFE0F',
    description: 'Medical and dental readiness tracking, screenings, and duty limitations.',
    sections: [
      { title: 'Overview', content: 'The Medical module tracks individual and unit medical readiness including physical exams, dental classification, immunizations, hearing/vision screenings, and duty limitations. Medical readiness percentage feeds into overall readiness calculations.' },
      { title: 'Medical Readiness', content: 'Dashboard shows unit medical readiness percentage, broken down by: current physicals, dental class 1/2, immunizations current, and no duty-limiting conditions. Each category shows compliant/non-compliant counts.' },
      { title: 'Dental Classification', content: 'Tracks dental readiness classes: Class 1 (no treatment needed), Class 2 (non-urgent treatment), Class 3 (urgent treatment needed), Class 4 (unknown/overdue). Class 3 personnel are flagged for immediate attention.' },
      { title: 'Duty Limitations', content: 'Record and track duty limitations, light duty profiles, and medical restrictions. Visible to commanders for mission planning. Automatic expiration tracking with renewal reminders.' },
    ],
  },
  {
    id: 'fuel',
    label: 'Fuel',
    icon: '\u26FD',
    description: 'Fuel receipt, issue, and accountability across all POL products.',
    sections: [
      { title: 'Overview', content: 'The Fuel module manages petroleum, oils, and lubricants (POL) accountability. Track fuel receipts, issues to vehicles/equipment, current balances, and consumption rates. Supports JP-8, diesel, MOGAS, and other fuel types.' },
      { title: 'Fuel Balance', content: 'Real-time display of fuel on hand by type and storage location. Visual gauge shows percentage of capacity. Historical consumption rate helps predict when resupply is needed.' },
      { title: 'Transactions', content: 'Log all fuel transactions: receipts from higher/vendors, issues to vehicles (with odometer reading), bulk transfers, and losses/adjustments. Each transaction requires authorization and document number.' },
      { title: 'Accountability', content: 'Daily fuel accountability report compares physical measurements with system balance. Variance thresholds trigger alerts. Monthly reconciliation report for command review.' },
    ],
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: '\uD83D\uDE9B',
    description: 'Convoy planning, route management, vehicle dispatch, and movement tracking.',
    sections: [
      { title: 'Overview', content: 'The Transportation module supports convoy planning, vehicle dispatch, route management, and movement tracking. Create convoy requests, define routes, assign vehicles, and track progress on the map.' },
      { title: 'Convoy Planning', content: 'Create convoy requests with: route, timeline, vehicles, cargo manifest, personnel count, and risk assessment. Route selection integrates with the Map module. Approval workflow routes to S-3.' },
      { title: 'Vehicle Dispatch', content: 'Manage vehicle dispatch log. Check out vehicles with driver assignment, purpose, expected return. Track current dispatched vehicles and overdue returns.' },
      { title: 'Movement Tracking', content: 'Active convoys display on the Map module with real-time position updates. Checkpoint status updates. Automatic alerts for overdue convoys or route deviations.' },
    ],
  },
  {
    id: 'custody',
    label: 'Chain of Custody',
    icon: '\uD83D\uDD12',
    description: 'Sensitive item tracking, hand receipts, and digital chain of custody.',
    sections: [
      { title: 'Overview', content: 'The Custody module provides digital chain of custody tracking for sensitive items, serialized equipment, and high-value assets. Manage hand receipts, conduct inventories, and maintain full transfer history.' },
      { title: 'Hand Receipts', content: 'Digital hand receipts with electronic signature. View items by holder, unit, or category. Transfer items between holders with digital signature required from both parties.' },
      { title: 'Inventory', content: 'Conduct and record sensitive item inventories. Scan or manually verify serial numbers. Record inventory results with date, time, and conductor. Automatic scheduling for required inventory frequencies.' },
      { title: 'Transfer History', content: 'Complete audit trail of every item transfer: who transferred, who received, when, where, and authorization. Immutable record for accountability and investigation purposes.' },
    ],
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: '\uD83D\uDCDD',
    description: 'Complete audit trail of all system actions for accountability and compliance.',
    sections: [
      { title: 'Overview', content: 'The Audit module provides a comprehensive, immutable log of all actions taken in KEYSTONE. Every create, update, delete, approval, and login event is recorded with timestamp, user, IP address, and before/after values.' },
      { title: 'Audit Log', content: 'Searchable, filterable log of all system events. Filter by date range, user, module, action type (create/update/delete/login), and severity. Paginated results with export capability.' },
      { title: 'Compliance', content: 'Pre-built compliance reports for command inspections. Track who accessed what data and when. Support for investigation and inquiry requirements.' },
      { title: 'Data Integrity', content: 'Audit records are append-only and cannot be modified or deleted. Hash chain ensures tamper detection. Regular integrity verification runs automatically.' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: '\uD83D\uDD14',
    description: 'Real-time notifications for critical events, threshold breaches, and action items.',
    sections: [
      { title: 'Overview', content: 'The Alerts module provides real-time notifications for logistics events requiring attention. Alerts are generated automatically when thresholds are breached, items become overdue, or critical status changes occur.' },
      { title: 'Alert Types', content: 'Supply alerts (below reorder point), Equipment alerts (deadlined, overdue maintenance), Personnel alerts (strength changes), Medical alerts (overdue screenings), Requisition alerts (pending approvals, status changes), and System alerts (integration failures, data quality).' },
      { title: 'Severity Levels', content: 'Critical (immediate action required), High (action within 24 hours), Medium (action within 72 hours), Low (informational). Critical and High alerts generate push notifications.' },
      { title: 'Management', content: 'Acknowledge alerts to clear from active queue. Assign alerts to specific users for follow-up. Comment on alerts to document actions taken. Bulk acknowledge for resolved alert groups.' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '\uD83D\uDCC4',
    description: 'Generate LOGSTAT, SITREP, equipment status, and custom reports.',
    sections: [
      { title: 'Overview', content: 'The Reports module provides pre-built and custom report templates for logistics reporting. Generate LOGSTAT, SITREP, equipment status reports, supply status reports, and more. Export in PDF, Excel, and formatted military message formats.' },
      { title: 'Report Templates', content: 'Pre-built templates: Daily LOGSTAT, SITREP, Equipment Readiness, Supply Status, Personnel Strength, Medical Readiness, Fuel Accountability, Convoy After-Action, and Custom. Each template can be customized with date range and unit selection.' },
      { title: 'Generation', content: 'Select template, configure parameters (date range, units, filters), and click Generate. Large reports run as background tasks with notification on completion. Scheduled reports can be configured for automatic generation.' },
      { title: 'Library', content: 'All generated reports are saved in the report library. Browse, search, and download previously generated reports. Share reports with other users or units.' },
    ],
  },
];

// ─── Data: Glossary ─────────────────────────────────────────────────────────

const glossaryItems: GlossaryItem[] = [
  { term: 'ACE', definition: 'Ammunition, Casualties, and Equipment report. A quick-reference report used to communicate critical logistics status during operations.' },
  { term: 'ASP', definition: 'Ammunition Supply Point. A designated location where ammunition is stored, managed, and issued to requesting units.' },
  { term: 'BLOT', definition: 'Battalion Logistics Operations Tracker. A tool or process used by battalion-level staff to track logistics activities across subordinate units.' },
  { term: 'C-1', definition: 'Readiness rating indicating a unit is fully mission capable. All resource areas (equipment, supply, personnel, medical) are at or above 90% of required levels.' },
  { term: 'C-2', definition: 'Readiness rating indicating a unit is substantially mission capable. Resource areas are between 80-90% of required levels. Minor shortfalls exist but do not significantly impact mission capability.' },
  { term: 'C-3', definition: 'Readiness rating indicating a unit is marginally mission capable. Resource areas are between 70-80% of required levels. The unit can perform some but not all of its missions.' },
  { term: 'C-4', definition: 'Readiness rating indicating a unit is not mission capable. Resource areas are between 50-70% of required levels. The unit requires significant resources to achieve mission capability.' },
  { term: 'C-5', definition: 'Readiness rating indicating a unit is not mission capable and unable to perform any of its missions. Resource areas are below 50% of required levels.' },
  { term: 'CLB', definition: 'Combat Logistics Battalion. A USMC logistics unit that provides direct support to a regiment or Marine Expeditionary Brigade, handling supply, maintenance, transportation, and medical support.' },
  { term: 'CLR', definition: 'Combat Logistics Regiment. A USMC logistics unit that provides general support to a Marine Division or Marine Expeditionary Force, commanding multiple CLBs.' },
  { term: 'DEADLINED', definition: 'Equipment status indicating the item is completely non-mission capable and cannot be operated. Requires immediate maintenance action. Deadlined equipment significantly impacts unit readiness ratings.' },
  { term: 'DODIC', definition: 'Department of Defense Identification Code. A four-character alphanumeric code assigned to identify specific ammunition items in the DOD supply system.' },
  { term: 'FMC', definition: 'Fully Mission Capable. Equipment status indicating the item is operational and can perform all of its intended missions without restriction.' },
  { term: 'FSP', definition: 'Forward Supply Point. A temporary supply point established close to the forward edge of the battle area to reduce resupply turnaround time.' },
  { term: 'GCE', definition: 'Ground Combat Element. The primary ground fighting force of a MAGTF, typically built around an infantry unit (regiment or battalion).' },
  { term: 'LCE', definition: 'Logistics Combat Element. The element of a MAGTF that provides logistics support including supply, maintenance, transportation, engineering, medical, and dental services.' },
  { term: 'LIN', definition: 'Line Item Number. A six-character alphanumeric code that identifies a specific item of supply in the Army supply system. (USMC equivalent: TAMCN.)' },
  { term: 'MAGTF', definition: 'Marine Air-Ground Task Force. The fundamental USMC organizational structure that integrates ground, aviation, logistics, and command elements under a single commander.' },
  { term: 'MEF', definition: 'Marine Expeditionary Force. The largest standing MAGTF, commanded by a Lieutenant General. There are three active MEFs: I MEF (Camp Pendleton), II MEF (Camp Lejeune), III MEF (Okinawa).' },
  { term: 'MEU', definition: 'Marine Expeditionary Unit. A forward-deployed MAGTF of approximately 2,200 Marines, built around a reinforced infantry battalion and composite aviation squadron.' },
  { term: 'MOS', definition: 'Military Occupational Specialty. A code that identifies a specific job or skill set held by a Marine. Used for personnel management and unit staffing requirements.' },
  { term: 'MTOE', definition: 'Modified Table of Organization and Equipment. The document that prescribes the organizational structure, personnel, and equipment authorizations for a military unit.' },
  { term: 'NMC-M', definition: 'Not Mission Capable - Maintenance. Equipment status indicating the item is non-operational due to a maintenance fault that requires repair. Parts and labor are needed to restore FMC status.' },
  { term: 'NMC-S', definition: 'Not Mission Capable - Supply. Equipment status indicating the item is non-operational because required repair parts are not available. The equipment is awaiting parts to complete maintenance.' },
  { term: 'NIIN', definition: 'National Item Identification Number. The last nine digits of the NSN, uniquely identifying an item of supply without regard to the supply classification.' },
  { term: 'NSN', definition: 'National Stock Number. A 13-digit number (format: XXXX-XX-XXX-XXXX) that uniquely identifies each item of supply in the federal supply system. Composed of Federal Supply Class + NIIN.' },
  { term: 'OPTEMPO', definition: 'Operational Tempo. The rate of military operations, measured by the pace of equipment usage, supply consumption, and personnel deployment. Higher OPTEMPO increases logistics demands.' },
  { term: 'P1/P2/P3', definition: 'Priority designators for supply requisitions. P1 (Emergency/NMCS): mission-critical, immediate processing. P2 (Priority): needed within days. P3 (Routine): standard processing time, no mission impact from delay.' },
  { term: 'POL', definition: 'Petroleum, Oils, and Lubricants. Class III supply items including JP-8 (jet fuel), diesel, MOGAS (gasoline), motor oil, hydraulic fluid, and other petroleum products.' },
  { term: 'SITREP', definition: 'Situation Report. A formatted report providing the current status of a unit including personnel, equipment, supply, and operational information. Typically submitted daily or on a schedule set by higher headquarters.' },
  { term: 'Supply Class I', definition: 'Subsistence (food and water). Includes MREs, fresh rations, UGR (Unitized Group Rations), and bottled water. Consumption-based; calculated per person per day.' },
  { term: 'Supply Class II', definition: 'Clothing, individual equipment, tools, and administrative supplies. Includes organizational clothing, sleeping bags, tools, and office supplies.' },
  { term: 'Supply Class III', definition: 'Petroleum, oils, and lubricants (POL). Includes JP-8, diesel, MOGAS, motor oil, and hydraulic fluid. Class IIIA specifically refers to aviation fuel.' },
  { term: 'Supply Class IV', definition: 'Construction materials. Includes lumber, barriers, wire, sandbags, and other building materials for fortifications and infrastructure.' },
  { term: 'Supply Class V', definition: 'Ammunition of all types. Includes small arms, grenades, rockets, missiles, and explosives. Tracked by DODIC and lot number. Requires special handling and storage.' },
  { term: 'Supply Class VI', definition: 'Personal demand items. Includes comfort items, hygiene products, and sundries available through exchanges. Typically managed by AAFES/MCX.' },
  { term: 'Supply Class VII', definition: 'Major end items. Includes vehicles, aircraft, watercraft, and weapons systems. Tracked individually by serial number and TAMCN. Reported on unit property books.' },
  { term: 'Supply Class VIII', definition: 'Medical material. Includes pharmaceuticals, medical supplies, and medical equipment. Managed through medical supply channels.' },
  { term: 'Supply Class IX', definition: 'Repair parts and components. Includes all parts needed for equipment maintenance. Tracked by NSN and linked to specific equipment TAMCNs.' },
  { term: 'Supply Class X', definition: 'Non-military programs material. Includes agricultural and economic development items used in civil affairs and humanitarian operations.' },
  { term: 'TAMCN', definition: 'Table of Authorized Materiel Control Number. A USMC-specific identifier for equipment items on the unit\'s Table of Equipment (T/E). Format: alphanumeric code unique to each equipment type.' },
  { term: 'USMC', definition: 'United States Marine Corps. A branch of the U.S. Armed Forces responsible for expeditionary and amphibious operations. KEYSTONE is designed primarily for USMC logistics operations.' },
];

// ─── Data: FAQ ──────────────────────────────────────────────────────────────

const faqItems: FAQItem[] = [
  { question: 'I see wrong data on the Dashboard. What should I do?', answer: 'Dashboard data is aggregated from all modules in real-time. First, check the specific module (Equipment, Supply, Personnel, Medical) to verify the source data. If the source data is correct but the Dashboard shows different numbers, try refreshing the page (Ctrl+R). If the issue persists, it may be a data synchronization delay — wait 60 seconds for the next refresh cycle. If still incorrect, report to your system administrator with a screenshot showing the discrepancy.' },
  { question: 'My requisition has been "Pending" for days. What\'s happening?', answer: 'Requisitions go through an approval workflow: Submitted > S-4 Review > CO Approval (if above threshold) > Ordered. Check the requisition detail view for the current stage and any comments from approvers. If stuck at "S-4 Review", contact your S-4 directly. If stuck at "CO Approval", the CO may have questions — check for any "Return for Revision" notes. You can also check the Alerts module to see if the approver has been notified.' },
  { question: 'Why is my unit showing C-3 readiness when most equipment is FMC?', answer: 'Readiness is calculated as the lowest of four areas: Equipment, Supply, Personnel, and Medical. Your equipment may be C-1, but if your supply levels, personnel strength, or medical readiness is between 70-80%, the overall rating drops to C-3. Check each readiness area individually on the Dashboard or Readiness module to find the specific area pulling the rating down.' },
  { question: 'How do I export a report to PDF?', answer: 'Navigate to the Reports module, select or generate the report you need, and click the "Export" button. Choose "PDF" from the format dropdown. The report will download to your browser\'s default download folder. For large reports, the system may process the export in the background and notify you when it\'s ready for download.' },
  { question: 'I have read-only access but need to submit data. How do I get write access?', answer: 'Your access level is determined by your assigned role. Contact your unit\'s system administrator (Admin role) to request a role change. The admin can update your role from Viewer to Operator (for data entry), S-4 (for logistics management), or another appropriate role. Role changes take effect immediately upon save.' },
  { question: 'I can\'t find a piece of equipment by its NSN. Where is it?', answer: 'Equipment is tracked primarily by TAMCN and serial number, not NSN. Try searching by serial number, bumper number, or TAMCN instead. If the equipment exists but is not showing, it may be assigned to a different unit — you can only see equipment assigned to your unit and subordinate units. Contact your S-4 if you believe equipment is missing from the system.' },
  { question: 'How do I update a Marine\'s medical restriction or profile?', answer: 'Navigate to the Medical module and search for the Marine by name or EDIPI. Click on their record to open the detail view. Click "Edit" and update the relevant fields (duty limitation, profile, restriction). Save the changes. Note: medical data changes are audit-logged and may require appropriate medical authority permissions depending on your system configuration.' },
  { question: 'What does a red alert mean, and what should I do?', answer: 'Red alerts indicate critical severity — immediate action is required. Common red alerts include: equipment deadlined (critical asset), supply stockout (mission-essential item), medical emergency, or security incident. Click the alert to see full details and recommended action. Acknowledge the alert to show you\'ve seen it, add a comment documenting your response, and assign follow-up if needed.' },
  { question: 'A convoy request was rejected. How do I resubmit?', answer: 'Open the rejected convoy request in the Transportation module. Review the rejection comments from the approver (usually S-3). Click "Revise and Resubmit" to create a new version addressing the concerns. Common rejection reasons include: incomplete risk assessment, route conflicts, or insufficient vehicle assets. Revise the plan, add any missing information, and resubmit for approval.' },
  { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login screen and follow the reset process. If you\'re already logged in and want to change your password, go to your profile (click your name in the top-right corner) and select "Change Password". If you\'re locked out and the self-service reset isn\'t working, contact your system administrator to manually reset your password.' },
  { question: 'How do I search for an item by NSN in the supply catalog?', answer: 'Navigate to the Supply module and click "Search Catalog" or use the search bar at the top of the supply list. Enter the full 13-digit NSN (with or without dashes) or the 9-digit NIIN. The search also supports partial matches and nomenclature keywords. Results show item details, current stock levels, and a "Create Requisition" button for quick ordering.' },
  { question: 'Can I edit a requisition after submitting it?', answer: 'You can edit a requisition only if it is still in "Submitted" status and has not yet been picked up for review. Click on the requisition, then click "Edit". If the requisition has moved to "S-4 Review" or beyond, you cannot edit it directly. Instead, contact the current reviewer to return it for revision, or cancel the requisition and create a new one with the corrected information.' },
];

// ─── Subcomponent: Quick Start Guides ───────────────────────────────────────

function QuickStartGuides() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role?.toUpperCase() ?? '';
  const matchedRoleId = roleGuides.find((r) => r.id === userRole)?.id ?? null;
  const [selectedRole, setSelectedRole] = useState<string | null>(matchedRoleId);
  const selectedGuide = roleGuides.find((r) => r.id === selectedRole) ?? null;

  return (
    <div>
      <p className="text-[var(--color-text-muted)] mb-5 text-sm leading-relaxed">
        Select your role to see a tailored quick-start guide with step-by-step workflows.
      </p>
      {/* Role selector grid */}
      <div
        className="grid gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
      >
        {roleGuides.map((role) => {
          const active = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className="rounded-[var(--radius)] py-3.5 px-3 cursor-pointer text-center outline-none" style={{ background: active ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)', border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`, transition: 'var(--transition)' }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="text-[28px] mb-1.5">{role.icon}</div>
              <div className="text-[13px] font-semibold" style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-bright)' }}>
                {role.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected guide content */}
      {selectedGuide && (
        <div
          className="border border-[var(--color-border)] rounded-[var(--radius)] p-6 bg-[var(--color-bg-surface)]"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[28px]">{selectedGuide.icon}</span>
            <h3 className="font-[var(--font-mono)] text-lg font-bold text-[var(--color-text-bright)] m-0">
              {selectedGuide.label}
            </h3>
          </div>
          <p className="text-[var(--color-text)] text-sm leading-relaxed mb-6">
            {selectedGuide.overview}
          </p>

          {/* Workflows */}
          {selectedGuide.workflows.map((wf, wi) => (
            <WorkflowBlock key={wi} workflow={wf} index={wi + 1} />
          ))}

          {/* Keyboard Shortcuts */}
          <div className="mt-7 border-t border-t-[var(--color-border)] pt-5">
            <div className="flex items-center gap-2 mb-3.5">
              <Keyboard size={16} className="text-[var(--color-accent)]" />
              <h4 className="font-[var(--font-mono)] text-sm font-semibold text-[var(--color-text-bright)] m-0">
                Keyboard Shortcuts
              </h4>
            </div>
            <div
              className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
            >
              {selectedGuide.shortcuts.map((sc, si) => (
                <div
                  key={si}
                  className="flex items-center gap-2.5 py-1.5 px-0"
                >
                  <kbd
                    className="font-[var(--font-mono)] text-xs border border-[var(--color-border)] rounded-[4px] py-0.5 px-2 text-[var(--color-text-bright)] whitespace-nowrap" style={{ background: 'var(--color-bg)' }}
                  >
                    {sc.keys}
                  </kbd>
                  <span className="text-[var(--color-text-muted)] text-[13px]">{sc.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowBlock({ workflow, index }: { workflow: Workflow; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="mb-3 border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--color-bg-elevated)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 py-3 px-4 bg-transparent border-0 cursor-pointer text-left outline-none"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-[var(--color-accent)] shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <span
          className="font-[var(--font-mono)] text-xs text-[var(--color-accent)] font-bold min-w-[24px]"
        >
          {String(index).padStart(2, '0')}
        </span>
        <span className="text-sm font-semibold text-[var(--color-text-bright)]">
          {workflow.title}
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px 46px' }}>
          <ol className="m-0 pl-5 list-decimal">
            {workflow.steps.map((step, si) => {
              const isComplex = typeof step !== 'string';
              const text = isComplex ? (step as { text: string; substeps: string[] }).text : (step as string);
              const substeps = isComplex ? (step as { text: string; substeps: string[] }).substeps : [];
              return (
                <li key={si} className="text-[var(--color-text)] text-[13px] leading-relaxed" style={{ marginBottom: substeps.length > 0 ? 8 : 4 }}>
                  <span className="font-semibold text-[var(--color-text-bright)]">{text}</span>
                  {substeps.length > 0 && (
                    <ul className="pl-[18px] list-disc" style={{ margin: '4px 0 0 0' }}>
                      {substeps.map((ss, ssi) => (
                        <li key={ssi} className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          {ss}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponent: Module Reference ─────────────────────────────────────────

function ModuleReference() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const selected = moduleRefs.find((m) => m.id === selectedModule) ?? null;

  return (
    <div>
      <p className="text-[var(--color-text-muted)] mb-5 text-sm leading-relaxed">
        Select a module to view its detailed reference documentation.
      </p>
      {/* Module selector grid */}
      <div
        className="grid gap-2.5 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
      >
        {moduleRefs.map((mod) => {
          const active = selectedModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setSelectedModule(mod.id)}
              className="rounded-[var(--radius)] py-3 px-2.5 cursor-pointer text-center outline-none" style={{ background: active ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)', border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`, transition: 'var(--transition)' }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="text-[22px] mb-1">{mod.icon}</div>
              <div className="text-xs font-semibold" style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-bright)' }}>
                {mod.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected module content */}
      {selected && (
        <div
          className="border border-[var(--color-border)] rounded-[var(--radius)] p-6 bg-[var(--color-bg-surface)]"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[26px]">{selected.icon}</span>
            <h3 className="font-[var(--font-mono)] text-lg font-bold text-[var(--color-text-bright)] m-0">
              {selected.label}
            </h3>
          </div>
          <p className="text-[var(--color-text-muted)] text-[13px] mb-5 leading-relaxed">
            {selected.description}
          </p>
          {selected.sections.map((sec, si) => (
            <div key={si} className="mb-[18px]">
              <h4 className="font-[var(--font-mono)] text-sm font-semibold text-[var(--color-accent)] mb-1.5">
                {sec.title}
              </h4>
              <p className="text-[var(--color-text)] text-[13px] leading-relaxed m-0">
                {sec.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponent: Glossary ─────────────────────────────────────────────────

function Glossary() {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return glossaryItems;
    const q = search.toLowerCase();
    return glossaryItems.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div>
      <p className="text-[var(--color-text-muted)] mb-4 text-sm leading-relaxed">
        USMC logistics terminology and abbreviations used throughout KEYSTONE.
      </p>
      {/* Search input */}
      <div className="relative mb-5 max-w-[400px]">
        <Search
          size={16}
          className="absolute left-3 text-[var(--color-text-muted)] top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search glossary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] text-sm outline-none" style={{ padding: '10px 12px 10px 36px', background: 'var(--color-bg-surface)', fontFamily: 'inherit', boxSizing: 'border-box' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
      </div>

      {/* Glossary items */}
      {filtered.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-[13px]">No matching terms found.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="flex gap-4 py-2.5 px-3.5 rounded-[var(--radius)] items-baseline" style={{ background: i % 2 === 0 ? 'var(--color-bg-surface)' : 'var(--color-bg-elevated)' }}
            >
              <span
                className="font-[var(--font-mono)] text-[13px] font-bold text-[var(--color-accent)] min-w-[140px] shrink-0"
              >
                {item.term}
              </span>
              <span className="text-[var(--color-text)] text-[13px] leading-relaxed">
                {item.definition}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponent: FAQ & Troubleshooting ────────────────────────────────────

function FAQTroubleshooting() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <div>
      <p className="text-[var(--color-text-muted)] mb-5 text-sm leading-relaxed">
        Common questions and troubleshooting guidance for KEYSTONE users.
      </p>
      <div className="flex flex-col gap-2">
        {faqItems.map((item, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={i}
              className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden bg-[var(--color-bg-surface)]"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-2.5 py-3.5 px-4 bg-transparent border-0 cursor-pointer text-left outline-none"
              >
                {isOpen ? (
                  <ChevronDown size={16} className="text-[var(--color-accent)] shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
                )}
                <span className="text-sm font-semibold text-[var(--color-text-bright)]">
                  {item.question}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 16px 42px' }}>
                  <p className="text-[var(--color-text)] text-[13px] leading-relaxed m-0">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component: DocsPage ───────────────────────────────────────────────

const tabs: { id: Tab; label: string }[] = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'modules', label: 'Module Reference' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'faq', label: 'FAQ & Troubleshooting' },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('quickstart');

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <BookOpen size={22} className="text-[var(--color-accent)]" />
        <h1
          className="font-[var(--font-mono)] text-[22px] font-bold text-[var(--color-text-bright)] m-0"
        >
          Documentation
        </h1>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-0 border-b border-b-[var(--color-border)] mb-7"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="py-2.5 px-5 bg-transparent border-0 cursor-pointer text-sm outline-none font-[var(--font-mono)]" style={{ borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`, fontWeight: active ? 600 : 400, color: active ? 'var(--color-accent)' : 'var(--color-text-muted)', transition: 'var(--transition)' }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'quickstart' && <QuickStartGuides />}
      {activeTab === 'modules' && <ModuleReference />}
      {activeTab === 'glossary' && <Glossary />}
      {activeTab === 'faq' && <FAQTroubleshooting />}
    </div>
  );
}
