import { useState } from 'react';
import {
  BookOpen,
  Layers,
  Rocket,
  Server,
  Code,
  Activity,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Wrench,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Section =
  | 'getting-started'
  | 'architecture'
  | 'features'
  | 'equipment'
  | 'reports'
  | 'admin'
  | 'deployment'
  | 'api-reference'
  | 'simulator'
  | 'security'
  | 'troubleshooting';

interface NavItem {
  id: Section;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'architecture', label: 'Architecture', icon: Layers },
  { id: 'features', label: 'Features', icon: Activity },
  { id: 'equipment', label: 'Equipment & Maint.', icon: Wrench },
  { id: 'reports', label: 'Reports', icon: Activity },
  { id: 'admin', label: 'Administration', icon: Settings },
  { id: 'deployment', label: 'Deployment', icon: Server },
  { id: 'api-reference', label: 'API Reference', icon: Code },
  { id: 'simulator', label: 'Simulator', icon: Activity },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: HelpCircle },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--color-text-bright)',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border)',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--color-accent)',
        marginTop: 24,
        marginBottom: 12,
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: 'var(--color-text)',
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        lineHeight: 1.6,
        color: 'var(--color-text-bright)',
        overflowX: 'auto',
        marginBottom: 16,
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 3,
        padding: '2px 6px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--color-accent)',
      }}
    >
      {children}
    </code>
  );
}

function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(77, 171, 247, 0.06)',
        border: '1px solid rgba(77, 171, 247, 0.2)',
        borderLeft: '3px solid var(--color-accent)',
        borderRadius: 'var(--radius)',
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)' }}>
        {children}
      </div>
    </div>
  );
}

function WarningBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderLeft: '3px solid var(--color-warning)',
        borderRadius: 'var(--radius)',
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-warning)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)' }}>
        {children}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        flex: '1 1 280px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-bright)',
          marginBottom: 8,
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--color-text-muted)',
        }}
      >
        {description}
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: '8px 0 16px 0',
        paddingLeft: 20,
        listStyleType: 'none',
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: 13,
            lineHeight: 1.8,
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ChevronRight
            size={12}
            style={{
              color: 'var(--color-accent)',
              marginTop: 4,
              flexShrink: 0,
            }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Getting Started
// ---------------------------------------------------------------------------

function GettingStartedSection() {
  return (
    <div>
      <SectionHeading>Getting Started</SectionHeading>

      <Paragraph>
        KEYSTONE is a USMC logistics intelligence application built as a
        component of Project Dynamis (USMC CJADC2). It provides automated
        ingestion, analysis, and reporting of supply, equipment, and
        transportation data, giving commanders and staff a real-time Common
        Operating Picture (COP) of their logistics posture across all echelons
        from company to MEF.
      </Paragraph>

      <InfoBox title="Quick Start">
        The fastest way to get KEYSTONE running locally is with Docker Compose.
        You need Docker 24+ and Docker Compose v2 installed.
      </InfoBox>

      <SubHeading>1. Start the Stack</SubHeading>
      <CodeBlock>{`# Clone the repository
git clone https://github.com/morbidsteve/keystone.git
cd keystone

# Start all services (backend, frontend, database, Redis, Celery)
docker compose up --build -d

# Verify everything is healthy (~30 seconds)
docker compose ps`}</CodeBlock>

      <SubHeading>2. Access the Application</SubHeading>
      <Paragraph>
        Once all services are healthy, open your browser to{' '}
        <InlineCode>https://localhost</InlineCode> (self-signed certificate).
        In development mode, seed users are created automatically.
      </Paragraph>

      <SubHeading>Default Credentials (Development Only)</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Password</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['admin', 'admin123', 'Admin', 'I MEF'],
              ['commander', 'cmd123', 'Commander', '1st MarDiv'],
              ['s4officer', 's4pass123', 'S-4', '1st Marines'],
              ['s3officer', 's3pass123', 'S-3', '1st Marines'],
              ['operator', 'op123', 'Operator', '1/1'],
              ['viewer', 'view123', 'Viewer', 'A Co 1/1'],
            ].map(([user, pass, role, unit]) => (
              <tr key={user} style={trStyle}>
                <td style={tdStyle}>{user}</td>
                <td style={tdStyle}>{pass}</td>
                <td style={tdStyle}>{role}</td>
                <td style={tdStyle}>{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <WarningBox title="Security Note">
        These seed accounts are only created when ENV_MODE=development (the
        default). They are blocked from creation in production environments.
        Always change SECRET_KEY in production.
      </WarningBox>

      <SubHeading>3. Run the Simulator (Optional)</SubHeading>
      <Paragraph>
        To populate the system with realistic exercise data, start the demo
        profile:
      </Paragraph>
      <CodeBlock>{`docker compose --profile demo up -d`}</CodeBlock>
      <Paragraph>
        The simulator runs the Steel Guardian scenario at 60x speed, feeding
        supply, equipment, and transportation events into the system
        continuously. See the Simulator section for all 20 available scenarios.
      </Paragraph>

      <SubHeading>Default Ports</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Service</th>
              <th style={thStyle}>URL</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}>
              <td style={tdStyle}>Frontend</td>
              <td style={tdStyle}>https://localhost</td>
              <td style={tdStyle}>Main application (self-signed TLS)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>API Docs</td>
              <td style={tdStyle}>https://localhost/api/docs</td>
              <td style={tdStyle}>Swagger UI (via nginx proxy)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Backend API</td>
              <td style={tdStyle}>http://localhost:8000</td>
              <td style={tdStyle}>Direct access (development)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>PostgreSQL</td>
              <td style={tdStyle}>localhost:5432</td>
              <td style={tdStyle}>Database (development)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Redis</td>
              <td style={tdStyle}>localhost:6379</td>
              <td style={tdStyle}>Cache and task queue</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SubHeading>Navigation</SubHeading>
      <Paragraph>
        KEYSTONE uses a sidebar navigation with the following pages:
      </Paragraph>
      <BulletList
        items={[
          'DASHBOARD -- Commander, S-4, and S-3 readiness views',
          'MAP -- Interactive COP with military symbology and tile layers',
          'SUPPLY -- All 10 NATO supply classes with status tracking',
          'EQUIPMENT -- Fleet readiness aggregates and individual asset tracking',
          'TRANSPORTATION -- Convoy management, route planning, movement tracking',
          'INGESTION -- Upload mIRC logs, Excel, route files (GeoJSON/GPX/KML/KMZ)',
          'DATA SOURCES -- Configure and monitor external data feeds',
          'REPORTS -- Generate and export 7 report types',
          'ALERTS -- View and acknowledge system alerts by severity',
          'ADMIN -- User management, units, classification, map tile configuration',
          'DOCS -- This documentation page',
        ]}
      />

      <Paragraph>
        The unit selector in the sidebar scopes all data to your selected unit
        and its subordinates in the organizational hierarchy.
      </Paragraph>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Architecture
// ---------------------------------------------------------------------------

function ArchitectureSection() {
  return (
    <div>
      <SectionHeading>Architecture</SectionHeading>

      <Paragraph>
        KEYSTONE follows a modern full-stack architecture with a Python backend,
        React frontend, and supporting infrastructure services. All containers
        are hardened per the DoD Container Hardening Guide.
      </Paragraph>

      <SubHeading>Technology Stack</SubHeading>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <FeatureCard
          title="Backend"
          description="Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Pydantic 2, Uvicorn, spaCy NLP"
        />
        <FeatureCard
          title="Frontend"
          description="React 18, TypeScript 5.3, Vite 5, Zustand, TanStack Query/Table, Tailwind CSS, Recharts"
        />
        <FeatureCard
          title="Database"
          description="PostgreSQL 15 with PostGIS 3.4 for geospatial queries and MGRS support"
        />
        <FeatureCard
          title="Cache / Queue"
          description="Redis 7 for Celery task queue and session caching"
        />
        <FeatureCard
          title="Maps"
          description="react-leaflet with milsymbol for APP-6D (MIL-STD-2525D) 15-character SIDCs"
        />
        <FeatureCard
          title="Infrastructure"
          description="Docker, nginx-unprivileged (TLS + tile proxy), Alembic migrations, GitHub Actions CI/CD"
        />
      </div>

      <SubHeading>System Components</SubHeading>
      <CodeBlock>{`  Browser (React SPA)
      |
      | HTTPS (443)
      v
  nginx (frontend container)
      |
      |--- /           --> serves static SPA files
      |--- /api/*      --> proxy to backend:8000
      |--- /tiles/*    --> proxy to tile sources (or local tileserver)
      |
      v
  FastAPI (backend container, port 8000)
      |
      |--- SQLAlchemy (async) --> PostgreSQL + PostGIS
      |--- Celery worker      --> Redis (task queue)
      |
      v
  PostgreSQL (db container, port 5432)
  Redis (redis container, port 6379)
  Simulator (demo profile, posts to backend API)`}</CodeBlock>

      <SubHeading>Data Flow</SubHeading>
      <BulletList
        items={[
          'Logistics data enters via file upload (mIRC, Excel, route files), TAK integration, manual entry, or simulator',
          'Schema mapping normalizes external fields to KEYSTONE canonical format',
          'Celery workers process ingested data asynchronously',
          'Dashboard aggregates readiness metrics per unit echelon',
          'Map overlay displays unit positions with NATO military symbols',
          'Alerts fire when supply or readiness drops below configurable thresholds',
          'Reports aggregate data into structured LOGSTAT and other standard formats',
        ]}
      />

      <SubHeading>Security Architecture</SubHeading>
      <BulletList
        items={[
          'JWT bearer token authentication (HS256) on all API endpoints with configurable 8-hour expiry',
          'Role-based access control with 6 roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER',
          'Unit hierarchy scoping -- users see only their unit and its subordinates',
          'nginx enforces HSTS, CSP, X-Frame-Options, X-Content-Type-Options headers',
          'Containers run as non-root (UID 1001) with read-only filesystems, no-new-privileges, minimal capabilities',
          'All external tile requests proxy through nginx to prevent CSP violations and data leakage',
          'Pydantic 2 input validation on all API inputs; parameterized SQL via SQLAlchemy',
          'Classification banner system for UNCLASSIFIED through TS//SCI per IC/DoD standards',
          'Cosign keyless image signing with SBOM attestation in CI pipeline',
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Features Overview
// ---------------------------------------------------------------------------

function FeaturesSection() {
  return (
    <div>
      <SectionHeading>Features</SectionHeading>

      <Paragraph>
        KEYSTONE provides a comprehensive logistics Common Operating Picture
        with the following capabilities. Each feature card below corresponds to
        a module accessible from the sidebar navigation.
      </Paragraph>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <FeatureCard
          title="Commander Dashboard"
          description="High-level readiness overview showing supply, equipment, and personnel status across all subordinate units with 30-second readiness assessment and trend indicators."
        />
        <FeatureCard
          title="S-4 (Logistics) View"
          description="Detailed supply class breakdowns (I-X), shortfall analysis, consumption rate tracking, days-of-supply calculations, and reorder point management."
        />
        <FeatureCard
          title="S-3 (Operations) View"
          description="Operational readiness metrics, equipment availability rates, fleet MC/NMC breakdown, and maintenance status for mission planning."
        />
        <FeatureCard
          title="Interactive COP Map"
          description="Full-screen Leaflet map with APP-6D military symbols (15-char SIDCs), unit positions, supply points, route overlays, convoy tracking, MGRS/lat-lon coordinates, three tile layers (OSM, satellite, topo), and distance measurement."
        />
        <FeatureCard
          title="Equipment Tracking"
          description="Fleet-level readiness aggregates by TAMCN. Individual asset detail pages with 5 tabs: Overview, Maintenance History, Faults, Drivers, and Convoy assignments."
        />
        <FeatureCard
          title="Maintenance Work Orders"
          description="Full CRUD lifecycle: create work orders, transition status (OPEN > IN_PROGRESS > AWAITING_PARTS > COMPLETE), manage parts with sourcing, track labor by type, assign priority and category."
        />
        <FeatureCard
          title="Supply Management"
          description="All 10 NATO supply classes with on-hand vs. required quantities, days-of-supply, traffic-light status (GREEN/AMBER/RED), consumption trend charts, class breakdown, and DOS calculator."
        />
        <FeatureCard
          title="Transportation & Convoys"
          description="Convoy map with route overlays, movement tracker (PLANNED > EN_ROUTE > COMPLETE), route planner modal, throughput charts, and vehicle/personnel allocation."
        />
        <FeatureCard
          title="Data Ingestion"
          description="Upload mIRC chat logs (NLP extraction), Excel LOGSTAT templates, route files (GeoJSON/GPX/KML/KMZ). Schema mapping wizard for new formats."
        />
        <FeatureCard
          title="Report Generation"
          description="7 report types: LOGSTAT, Readiness, Supply Status, Equipment Status, Maintenance Summary, Movement Summary, Personnel Strength. Draft/Final workflow with export."
        />
        <FeatureCard
          title="Alert System"
          description="Automatic alerts for low supply, low readiness, delayed convoys, and anomaly detection. Three severity levels (CRITICAL, WARNING, INFO) with acknowledgement tracking."
        />
        <FeatureCard
          title="Unit Hierarchy"
          description="Complete active-duty USMC organizational structure (~403 units). All three MEFs, MARFORRES, MARSOC, Supporting Establishment. Echelons from HQMC to company level."
        />
        <FeatureCard
          title="TAK Integration"
          description="Push and pull Cursor-on-Target (CoT) events to/from TAK Server for interoperability with ATAK/WinTAK field devices."
        />
        <FeatureCard
          title="Classification Banners"
          description="Admin-configurable classification level from UNCLASSIFIED through TS//SCI with color-coded banners at top and bottom of every page per IC/DoD standards."
        />
        <FeatureCard
          title="Responsive Design"
          description="Optimized layouts for desktop, tablet, and mobile. Collapsible sidebar, responsive grid systems, scrollable tables, and full-screen map mode."
        />
        <FeatureCard
          title="Demo Mode"
          description="Full static site deployment with mock data and no backend dependency. Auto-deployed to GitHub Pages. Toggle with VITE_DEMO_MODE=true."
        />
      </div>

      <InfoBox title="Future Capability">
        GCSS-MC (Global Combat Support System -- Marine Corps) integration is
        planned as a future capability for automated supply and equipment
        synchronization from authoritative Marine Corps logistics systems.
      </InfoBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Equipment & Maintenance
// ---------------------------------------------------------------------------

function EquipmentSection() {
  return (
    <div>
      <SectionHeading>Equipment & Maintenance</SectionHeading>

      <Paragraph>
        The Equipment module provides fleet-level readiness aggregates and
        individual asset tracking with a comprehensive maintenance workflow.
      </Paragraph>

      <SubHeading>Equipment List (Fleet View)</SubHeading>
      <Paragraph>
        The main Equipment page displays a readiness table showing all equipment
        types aggregated by TAMCN (Table of Authorized Materiel Control Number).
        Each row shows:
      </Paragraph>
      <BulletList
        items={[
          'Equipment type/nomenclature and TAMCN',
          'Total possessed, mission capable (MC), and not mission capable (NMC) counts',
          'NMC breakdown: NMC-M (maintenance) vs NMC-S (supply)',
          'Readiness percentage with color-coded status',
        ]}
      />
      <Paragraph>
        Below the readiness table, you will find the Maintenance Queue (showing
        current open work orders) and a Readiness Trend chart.
      </Paragraph>

      <SubHeading>Individual Equipment Detail</SubHeading>
      <Paragraph>
        Click any equipment item to open its detail page. The detail page shows
        the bumper number, equipment type, serial number, unit, TAMCN, and
        current status (FMC, NMC_M, NMC_S, DEADLINED, ADMIN). Five tabs provide
        detailed information:
      </Paragraph>
      <BulletList
        items={[
          'OVERVIEW -- Equipment specifications, current status, mileage, assigned driver, and key dates',
          'MAINTENANCE -- Full work order history with ability to create new work orders and manage existing ones',
          'FAULTS -- Report new faults (SAFETY, MAJOR, MINOR, COSMETIC severity), resolve existing faults, link faults to work orders',
          'DRIVERS -- Assign/release drivers (Primary or A-Driver), view assignment history with dates',
          'CONVOYS -- View convoy and movement assignment history for this equipment',
        ]}
      />

      <SubHeading>Maintenance Work Order Workflow</SubHeading>
      <Paragraph>
        Work orders track maintenance from request through completion with full
        lifecycle management:
      </Paragraph>

      <InfoBox title="Work Order Status Flow">
        OPEN &rarr; IN_PROGRESS &rarr; AWAITING_PARTS (optional) &rarr; COMPLETE
      </InfoBox>

      <Paragraph>
        <strong>Creating a Work Order:</strong> Click the "CREATE WORK ORDER"
        button from the Maintenance tab. Fill in:
      </Paragraph>
      <BulletList
        items={[
          'Work Order Number (auto-generated as WO-YYYY-NNNN)',
          'Priority: URGENT (1), PRIORITY (2), or ROUTINE (3)',
          'Category: CORRECTIVE, PREVENTIVE, MODIFICATION, or INSPECTION',
          'Description of the maintenance requirement',
          'Equipment ID, Unit ID, Assigned mechanic, Location, Estimated completion date',
        ]}
      />

      <Paragraph>
        <strong>Managing a Work Order:</strong> Click any work order to open the
        detail modal. From there you can:
      </Paragraph>
      <BulletList
        items={[
          'Transition status forward (OPEN > IN_PROGRESS > AWAITING_PARTS > COMPLETE) or revert to previous status',
          'Edit work order details: description, priority, category, assigned mechanic, location, estimated completion',
          'Add Parts: specify NSN/part number, description, quantity, source (ON_HAND, ORDERED, CANNIBALIZED), and status (NEEDED, ON_ORDER, RECEIVED, INSTALLED)',
          'Edit or delete individual parts as they are received or installed',
          'Add Labor entries: type (INSPECTION, REPAIR, PMCS, MODIFICATION), personnel name, hours worked, and date',
          'Edit or delete labor entries',
          'Delete the entire work order if created in error',
        ]}
      />

      <SubHeading>Fault Tracking</SubHeading>
      <Paragraph>
        The Faults tab on the equipment detail page tracks all reported faults
        for an individual asset:
      </Paragraph>
      <BulletList
        items={[
          'Report a new fault with severity (SAFETY, MAJOR, MINOR, COSMETIC), description, and reporter name',
          'Safety and Major faults are displayed with red/amber indicators for immediate visibility',
          'Resolve faults by clicking the RESOLVE button, which records the resolution timestamp',
          'Faults linked to work orders display the work order ID for cross-reference',
        ]}
      />

      <SubHeading>Driver Assignment</SubHeading>
      <Paragraph>
        The Drivers tab manages personnel assignments to individual equipment:
      </Paragraph>
      <BulletList
        items={[
          'Assign a driver by Personnel ID with optional name and Primary/A-Driver designation',
          'Current (active) assignments are highlighted; released assignments show historical dates',
          'Release a driver by clicking the RELEASE button, which records the release date',
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Reports
// ---------------------------------------------------------------------------

function ReportsSection() {
  return (
    <div>
      <SectionHeading>Reports</SectionHeading>

      <Paragraph>
        The Reports page provides automated report generation, a structured
        report viewer, and export capabilities for standard USMC logistics
        reports.
      </Paragraph>

      <SubHeading>Report Types</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Contents</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['LOGSTAT', 'Supply status, equipment readiness, open WOs, active movements, personnel strength'],
              ['READINESS', 'MC/NMC rates by equipment type, individual status breakdown, deadlined items'],
              ['SUPPLY STATUS', 'All 10 supply classes with on-hand, required, fill rate, avg DOS, critical items'],
              ['EQUIPMENT STATUS', 'Fleet readiness by type, NMC-M vs NMC-S, individual breakdown, top deadlined items'],
              ['MAINTENANCE', 'WO counts by status, avg completion time, total labor hours, parts on order, top issues'],
              ['MOVEMENTS', 'Active/planned/completed counts, vehicles and personnel in transit, recent completions'],
              ['PERSONNEL', 'Total assigned vs active, status breakdown (present/deployed/leave/TAD/medical), by rank and MOS'],
            ].map(([type, desc]) => (
              <tr key={type} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{type}</td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Generating a Report</SubHeading>
      <BulletList
        items={[
          'Select the report type from the dropdown on the left panel',
          'Choose the unit scope (I MEF, 1st MarDiv, 1st Marines, or specific battalions)',
          'Optionally set a date range (defaults to last 7 days)',
          'Click GENERATE REPORT -- the system aggregates current data and produces a structured report',
        ]}
      />

      <SubHeading>Viewing and Managing Reports</SubHeading>
      <Paragraph>
        Generated reports appear in the right panel with a structured viewer
        that includes type-specific sections:
      </Paragraph>
      <BulletList
        items={[
          'Report header with type, unit, and generation timestamp',
          'Summary statistics with large metric cards (readiness %, totals, etc.)',
          'Tabular breakdowns by supply class, equipment type, status, rank, or MOS',
          'Color-coded status indicators (GREEN/AMBER/RED) matching the traffic-light system',
          'Critical items highlighted in red for immediate attention',
        ]}
      />

      <SubHeading>Report Workflow</SubHeading>
      <BulletList
        items={[
          'Reports are generated in READY status',
          'Click FINALIZE to mark a report as official (status changes to FINALIZED)',
          'Click EXPORT to download the report as a text/JSON file for offline distribution or submission to higher HQ',
          'Report history is maintained with author and timestamp for each report',
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Administration
// ---------------------------------------------------------------------------

function AdminSection() {
  return (
    <div>
      <SectionHeading>Administration</SectionHeading>

      <Paragraph>
        The Admin page (accessible to ADMIN role users) provides system
        configuration through four tabs: Users, Units, Classification, and Map
        Tiles.
      </Paragraph>

      <SubHeading>User Management</SubHeading>
      <BulletList
        items={[
          'View all system users with username, name, role, unit assignment, and active status',
          'Create new users with username, full name, email, password, role, and unit assignment',
          'Edit existing users to change role, unit assignment, or account details',
          'Activate or deactivate user accounts (deactivated users cannot log in)',
          '6 available roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER',
        ]}
      />

      <SubHeading>Unit Management</SubHeading>
      <BulletList
        items={[
          'Interactive tree view of the complete USMC organizational hierarchy (~403 units)',
          'All three MEFs (I, II, III), MARFORRES, MARSOC, and Supporting Establishment',
          'Echelons from HQMC down to company level with UICs and geographic coordinates',
          'Create new subordinate units with proper echelon validation (e.g., battalions under regiments)',
          'Edit unit properties: name, abbreviation, UIC, echelon, coordinates, MGRS',
        ]}
      />

      <SubHeading>Classification Settings</SubHeading>
      <Paragraph>
        Configure the classification level displayed on the banners at the top
        and bottom of every page:
      </Paragraph>
      <BulletList
        items={[
          'UNCLASSIFIED (green banner)',
          'CUI -- Controlled Unclassified Information (amber banner)',
          'CONFIDENTIAL (blue banner)',
          'SECRET (red banner)',
          'TOP SECRET (orange banner)',
          'TOP SECRET//SCI (yellow text on red banner)',
        ]}
      />
      <Paragraph>
        The classification setting is stored server-side and applies to all
        users. A live preview shows exactly how the banner will appear before
        saving.
      </Paragraph>

      <SubHeading>Map Tile Settings</SubHeading>
      <Paragraph>
        Configure tile layer sources for the three map layers:
      </Paragraph>
      <BulletList
        items={[
          'OpenStreetMap -- default general-purpose street map',
          'Satellite -- aerial/satellite imagery layer',
          'Topographic -- contour and terrain map',
          'Each layer can point to online tile servers or local tile servers for air-gapped deployments',
          'Tile URL templates use standard {z}/{x}/{y} placeholders',
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Deployment
// ---------------------------------------------------------------------------

function DeploymentSection() {
  return (
    <div>
      <SectionHeading>Deployment</SectionHeading>

      <Paragraph>
        KEYSTONE supports multiple deployment models, from local development to
        air-gapped classified networks. All containers are hardened per the DoD
        Container Hardening Guide with non-root users, read-only filesystems,
        and minimal capabilities.
      </Paragraph>

      <SubHeading>Deployment Options</SubHeading>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <DeploymentOption
          title="Docker Compose (Recommended)"
          description="Single command brings up the full stack: PostgreSQL, Redis, Backend, Celery, Frontend. Suitable for development, demos, and single-server production."
          guide="docker-compose.yml"
        />
        <DeploymentOption
          title="Air-Gapped / SIPR / Classified"
          description="Fully offline deployment with pre-downloaded tile cache, internal PKI for TLS, and classification banner support. No external network required."
          guide="scripts/download-tiles.py"
        />
        <DeploymentOption
          title="Demo Mode (Static Site)"
          description="Build frontend with VITE_DEMO_MODE=true for a fully functional static site with mock data. No backend required. Auto-deployed to GitHub Pages."
          guide="deploy-pages.yml"
        />
      </div>

      <SubHeading>Docker Compose Services</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Service</th>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Port</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['db', 'postgis/postgis:15-3.4', '5432', 'PostgreSQL + PostGIS'],
              ['redis', 'redis:7-alpine', '6379', 'Cache and task queue'],
              ['backend', 'keystone-backend', '8000', 'FastAPI (Uvicorn)'],
              ['celery_worker', 'keystone-backend', '--', 'Background tasks'],
              ['frontend', 'keystone-frontend', '80/443', 'nginx + React SPA'],
              ['simulator', 'keystone-backend', '--', 'Demo profile only'],
            ].map(([name, img, port, notes]) => (
              <tr key={name} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
                <td style={tdStyle}>{img}</td>
                <td style={tdStyle}>{port}</td>
                <td style={tdStyle}>{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Air-Gapped Tile Cache</SubHeading>
      <Paragraph>
        Pre-download map tiles for your area of operations using the included
        script:
      </Paragraph>
      <CodeBlock>{`python scripts/download-tiles.py \\
  --bbox 33.0,-117.6,33.5,-117.0 \\
  --zoom 8-14 \\
  --output ./tiles \\
  --source osm`}</CodeBlock>
      <Paragraph>
        Both nginx and the Vite dev server proxy tile requests through{' '}
        <InlineCode>/tiles/&#123;osm,satellite,topo&#125;</InlineCode>,
        allowing seamless use of cached tiles in disconnected environments.
      </Paragraph>

      <SubHeading>Environment Variables</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Variable</th>
              <th style={thStyle}>Required</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['DATABASE_URL', 'Yes', 'Async PostgreSQL connection (postgresql+asyncpg://...)'],
              ['DATABASE_URL_SYNC', 'Yes', 'Sync PostgreSQL connection for Celery workers'],
              ['REDIS_URL', 'Yes', 'Redis connection string'],
              ['SECRET_KEY', 'Yes (prod)', 'JWT signing key (MUST be random in production)'],
              ['ENV_MODE', 'No', '"development" (default) or "production"'],
              ['CORS_ORIGINS', 'No', 'JSON array of allowed CORS origins'],
              ['ACCESS_TOKEN_EXPIRE_MINUTES', 'No', 'JWT expiry in minutes (default: 480 = 8 hours)'],
              ['ALLOW_PRIVATE_TAK_HOSTS', 'No', 'Allow TAK connections to RFC1918 addresses (default: true)'],
              ['VITE_DEMO_MODE', 'No', 'Build frontend as static demo site (default: false)'],
              ['VITE_BASE_PATH', 'No', 'Base URL path for GitHub Pages (default: /)'],
            ].map(([name, req, desc]) => (
              <tr key={name} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
                <td style={tdStyle}>{req}</td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>CI/CD Pipeline</SubHeading>
      <Paragraph>
        KEYSTONE uses a 5-phase DevSecOps pipeline via GitHub Actions:
      </Paragraph>
      <BulletList
        items={[
          'Phase 1 -- Lint: Backend (ruff + mypy), Frontend (tsc -b)',
          'Phase 2 -- Build + Scan: Docker image builds, Grype/Trivy CVE scans, Semgrep SAST, CodeQL',
          'Phase 3 -- Test + DAST: Backend pytest, Frontend vitest, ZAP dynamic security testing',
          'Phase 4 -- Sign + Attest: Cosign keyless image signing, SBOM generation',
          'Phase 5 -- Compliance Gate: Final gate aggregating all prior results',
        ]}
      />
    </div>
  );
}

function DeploymentOption({
  title,
  description,
  guide,
}: {
  title: string;
  description: string;
  guide: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-bright)',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {guide}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: API Reference
// ---------------------------------------------------------------------------

function ApiReferenceSection() {
  return (
    <div>
      <SectionHeading>API Reference</SectionHeading>

      <Paragraph>
        KEYSTONE exposes a RESTful API under{' '}
        <InlineCode>/api/v1/</InlineCode>. Full interactive documentation
        is available via Swagger UI when the backend is running.
      </Paragraph>

      <InfoBox title="Interactive API Docs">
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-accent)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          Open Swagger UI
          <ExternalLink size={14} />
        </a>
        {' '}&mdash; Try out API endpoints directly in your browser with
        authentication support. Also available at{' '}
        <InlineCode>/api/redoc</InlineCode> for a read-only view.
      </InfoBox>

      <SubHeading>API Groups</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Prefix</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['/api/v1/auth', 'Login, token refresh, user CRUD'],
              ['/api/v1/dashboard', 'Commander readiness, sustainability projections'],
              ['/api/v1/supply', 'Supply status CRUD, class I-X tracking'],
              ['/api/v1/equipment', 'Fleet readiness aggregates by TAMCN'],
              ['/api/v1/equipment/individual', 'Serial-level tracking: faults, drivers, history'],
              ['/api/v1/maintenance', 'Work orders, parts, labor tracking (full CRUD)'],
              ['/api/v1/transportation', 'Movement lifecycle, convoy manifests'],
              ['/api/v1/personnel', 'Personnel roster, weapons, ammo loads'],
              ['/api/v1/map', 'Unit positions, supply points, routes, convoys'],
              ['/api/v1/reports', 'Generate/list/finalize 7 report types'],
              ['/api/v1/alerts', 'Alert management and acknowledgement'],
              ['/api/v1/ingestion', 'File upload: mIRC, Excel, route files'],
              ['/api/v1/data-sources', 'External source configuration and monitoring'],
              ['/api/v1/schema-mapping', 'Canonical field mapping for ingestion'],
              ['/api/v1/tak', 'TAK server connections and CoT data'],
              ['/api/v1/settings', 'System settings (classification, etc.)'],
              ['/api/v1/units', 'USMC unit hierarchy (read)'],
            ].map(([prefix, desc]) => (
              <tr key={prefix} style={trStyle}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{prefix}</td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Authentication</SubHeading>
      <Paragraph>
        Obtain a JWT token by posting credentials to the login endpoint:
      </Paragraph>
      <CodeBlock>{`POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}`}</CodeBlock>
      <Paragraph>
        Include the token in subsequent requests via the Authorization header:
      </Paragraph>
      <CodeBlock>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}</CodeBlock>
      <Paragraph>
        Tokens expire after 8 hours by default (configurable via{' '}
        <InlineCode>ACCESS_TOKEN_EXPIRE_MINUTES</InlineCode>). All endpoints
        except <InlineCode>/health</InlineCode> and{' '}
        <InlineCode>/api/v1/auth/login</InlineCode> require authentication.
      </Paragraph>

      <SubHeading>Common Response Patterns</SubHeading>
      <BulletList
        items={[
          '200 OK -- Successful GET/PUT/PATCH requests',
          '201 Created -- Successful POST creation',
          '204 No Content -- Successful DELETE',
          '400 Bad Request -- Validation errors (Pydantic schema failures)',
          '401 Unauthorized -- Missing or expired JWT token',
          '403 Forbidden -- Insufficient role or unit scope',
          '404 Not Found -- Resource does not exist',
          '422 Unprocessable Entity -- Request body validation failed',
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Simulator
// ---------------------------------------------------------------------------

function SimulatorSection() {
  return (
    <div>
      <SectionHeading>Simulator</SectionHeading>

      <Paragraph>
        KEYSTONE includes a built-in event-driven simulator that generates
        realistic logistics data for demonstrations, training, and development
        testing. The simulator posts data through the same API endpoints used
        by real data sources, exercising all ingestion, validation, and
        processing logic.
      </Paragraph>

      <SubHeading>Running the Simulator</SubHeading>
      <CodeBlock>{`# Start with Docker Compose demo profile
docker compose --profile demo up -d

# View simulator output
docker compose logs -f simulator

# Or run standalone against any KEYSTONE instance
cd backend
python -m simulator run --scenario=steel_guardian --speed=60`}</CodeBlock>

      <SubHeading>Available Scenarios (20)</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Scenarios</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Pre-Deployment (CONUS)', 'steel_guardian, itx, steel_knight, comptuex'],
              ['Indo-Pacific', 'cobra_gold, balikatan, resolute_dragon, ssang_yong, kamandag, valiant_shield, rimpac, island_sentinel'],
              ['Europe / Africa / ME', 'african_lion, cold_response, native_fury'],
              ['Americas / Maritime', 'unitas'],
              ['Crisis Response', 'trident_spear'],
              ['Reserve Component', 'reserve_itx'],
              ['Deployment / Garrison', 'pacific_fury, iron_forge'],
            ].map(([cat, scenarios]) => (
              <tr key={cat} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{cat}</td>
                <td style={tdStyle}>{scenarios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>CLI Options</SubHeading>
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <th style={thStyle}>Flag / Env Var</th>
              <th style={thStyle}>Default</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['--scenario / SIM_SCENARIO', 'steel_guardian', 'Scenario name from the catalog above'],
              ['--speed / SIM_SPEED', '60', 'Speed multiplier (60 = 1 sim-minute per real-second)'],
              ['--url / KEYSTONE_URL', 'http://localhost:8000', 'KEYSTONE API base URL'],
              ['--username', 'simulator', 'API username for authentication'],
              ['--password / SIM_PASSWORD', '--', 'API password'],
              ['--log-level', 'INFO', 'Logging level (DEBUG, INFO, WARNING, ERROR)'],
              ['--max-events-per-tick', '50', 'Max events processed per simulation tick'],
            ].map(([flag, def, desc]) => (
              <tr key={flag} style={trStyle}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{flag}</td>
                <td style={tdStyle}>{def}</td>
                <td style={tdStyle}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading>Simulated Events</SubHeading>
      <Paragraph>
        Each scenario consists of named phases with different operational tempos
        (LOW, MEDIUM, HIGH). The simulator generates:
      </Paragraph>
      <BulletList
        items={[
          'Supply consumption reports across all 10 NATO supply classes (I-X)',
          'Equipment breakdowns with probability scaled to operational tempo (LOW 3%, MEDIUM 8%, HIGH 15% per unit/day)',
          'Resupply convoys with manifests, vehicles, and personnel assignments',
          'LOGSTAT and readiness report submissions',
          'Phase transitions with tempo changes',
          'Map position updates for unit movements',
          'Alert generation when thresholds are crossed',
        ]}
      />

      <SubHeading>List Scenarios</SubHeading>
      <CodeBlock>{`cd backend
python -m simulator list

# Output shows all 20 scenarios grouped by category:
# Pre-Deployment Training (CONUS):
#   steel_guardian       Exercise Steel Guardian, 29 Palms      [7d, 6u]
#   itx                  Integrated Training Exercise            [21d, 8u]
#   ...`}</CodeBlock>

      <InfoBox title="Note">
        The simulator submits data through the same API endpoints used by real
        data sources. This means all ingestion, validation, RBAC, and processing
        logic is fully exercised during simulation.
      </InfoBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Security
// ---------------------------------------------------------------------------

function SecuritySection() {
  return (
    <div>
      <SectionHeading>Security</SectionHeading>

      <Paragraph>
        KEYSTONE is designed for deployment across classification domains with
        defense-in-depth security. The platform follows DoD Container Hardening
        Guide (CHG) requirements and implements STIG-aligned controls.
      </Paragraph>

      <SubHeading>Authentication and Authorization</SubHeading>
      <BulletList
        items={[
          'JWT bearer token authentication (HS256) with configurable expiry (default 8 hours)',
          'Role-based access control with 6 roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER',
          'Unit hierarchy scoping -- users can only access data for their assigned unit and its subordinates',
          'Seed users are automatically blocked from creation when ENV_MODE is not "development"',
          'SECRET_KEY must be changed from the default value in production deployments',
        ]}
      />

      <SubHeading>Container Hardening (DoD CHG)</SubHeading>
      <BulletList
        items={[
          'All containers run as non-root users (UID 1001)',
          'Read-only root filesystems with targeted tmpfs mounts for /tmp',
          'security_opt: no-new-privileges:true on all containers',
          'cap_drop: ALL with only minimal capabilities added (CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID for database/Redis)',
          'Multi-stage Docker builds to minimize image attack surface',
          'nginx-unprivileged base image for the frontend container',
          'Health checks on all services for orchestrator integration',
        ]}
      />

      <SubHeading>Network Security</SubHeading>
      <BulletList
        items={[
          'TLS termination at nginx with self-signed certificates (replace with org PKI in production)',
          'Strict Transport Security (HSTS) header enforcement',
          'Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options headers',
          'All external tile requests proxied through nginx to prevent CSP violations and data leakage',
          'CORS origin whitelist (configurable via CORS_ORIGINS environment variable)',
        ]}
      />

      <SubHeading>Supply Chain Security</SubHeading>
      <BulletList
        items={[
          'Cosign keyless image signing on all container images pushed to GHCR',
          'SBOM (Software Bill of Materials) generation and attestation',
          'Grype and Trivy vulnerability scanning on every CI build',
          'Semgrep SAST and CodeQL static analysis',
          'ZAP DAST (Dynamic Application Security Testing) on every pipeline run',
          'Dependency review on all pull requests',
        ]}
      />

      <SubHeading>Input Validation</SubHeading>
      <BulletList
        items={[
          'Pydantic 2 schema validation on all API request bodies',
          'Parameterized SQL via SQLAlchemy (no raw SQL string interpolation)',
          'File upload validation with allowed directory restrictions (ALLOWED_DATA_DIRS)',
          'TAK server connection restrictions with ALLOW_PRIVATE_TAK_HOSTS control',
        ]}
      />

      <SubHeading>Classification System</SubHeading>
      <Paragraph>
        KEYSTONE supports configurable classification banners per IC/DoD
        standards. The classification level is set by administrators via the
        Admin page and applies globally to all users:
      </Paragraph>
      <BulletList
        items={[
          'UNCLASSIFIED -- Green banner',
          'CUI (Controlled Unclassified Information) -- Amber banner',
          'CONFIDENTIAL -- Blue banner',
          'SECRET -- Red banner',
          'TOP SECRET -- Orange banner',
          'TOP SECRET//SCI -- Yellow text on red banner',
        ]}
      />

      <WarningBox title="Production Checklist">
        Before deploying to production: (1) Change SECRET_KEY to a random value,
        (2) Set ENV_MODE=production to disable seed users, (3) Replace self-signed
        TLS certificates with organizational PKI, (4) Review and restrict
        CORS_ORIGINS, (5) Set appropriate classification level.
      </WarningBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION: Troubleshooting
// ---------------------------------------------------------------------------

function TroubleshootingSection() {
  return (
    <div>
      <SectionHeading>Troubleshooting</SectionHeading>

      <SubHeading>Services will not start</SubHeading>
      <CodeBlock>{`# Check container status and health
docker compose ps

# View logs for a specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db`}</CodeBlock>

      <SubHeading>Database connection errors</SubHeading>
      <Paragraph>
        If the backend reports database connection failures:
      </Paragraph>
      <BulletList
        items={[
          'Verify PostgreSQL is healthy: docker compose exec db pg_isready -U keystone',
          'Check that port 5432 is not already in use by a local PostgreSQL instance',
          'Ensure DATABASE_URL matches the db service credentials in docker-compose.yml',
          'Wait for the db health check to pass before starting the backend (docker compose handles this via depends_on)',
        ]}
      />

      <SubHeading>Frontend shows blank page or errors</SubHeading>
      <BulletList
        items={[
          'Clear browser cache and hard reload (Ctrl+Shift+R)',
          'Check browser console (F12) for JavaScript errors',
          'Verify the backend is reachable: curl http://localhost:8000/health',
          'Check nginx logs: docker compose logs frontend',
          'Ensure the backend health check has passed before the frontend starts',
        ]}
      />

      <SubHeading>Map tiles not loading</SubHeading>
      <BulletList
        items={[
          'Tiles are proxied through nginx to avoid CSP issues -- check nginx logs',
          'In air-gapped environments, ensure cached tiles are available at the configured path',
          'Admin > Map Tiles can switch between online and local tile sources',
          'Verify the tile URL template uses correct {z}/{x}/{y} placeholders',
        ]}
      />

      <SubHeading>API returns 401 Unauthorized</SubHeading>
      <BulletList
        items={[
          'JWT tokens expire after 8 hours by default (ACCESS_TOKEN_EXPIRE_MINUTES=480)',
          'Log in again to obtain a fresh token',
          'Verify SECRET_KEY has not changed between token issuance and validation',
          'Check that the user account is still active (not deactivated in Admin)',
        ]}
      />

      <SubHeading>Reports fail to generate</SubHeading>
      <BulletList
        items={[
          'Ensure there is data in the system for the selected unit and date range',
          'Check backend logs for specific error messages: docker compose logs backend',
          'Verify the Celery worker is running: docker compose logs celery_worker',
          'Try generating with a broader date range or a higher-echelon unit',
        ]}
      />

      <SubHeading>Simulator not producing data</SubHeading>
      <BulletList
        items={[
          'Verify the simulator container is running: docker compose --profile demo ps',
          'Check simulator logs: docker compose logs simulator',
          'Ensure the backend is healthy before the simulator starts (it depends_on backend)',
          'The simulator authenticates as the "simulator" user -- ensure this user exists or ENV_MODE=development',
        ]}
      />

      <SubHeading>Celery tasks not processing</SubHeading>
      <CodeBlock>{`# Check Celery worker status
docker compose exec celery_worker celery -A app.tasks:celery_app inspect ping

# View Celery logs
docker compose logs celery_worker

# Verify Redis is reachable
docker compose exec redis redis-cli ping`}</CodeBlock>

      <SubHeading>Resetting to a clean state</SubHeading>
      <CodeBlock>{`# Stop all services and remove volumes (deletes all data)
docker compose down -v

# Rebuild and start fresh
docker compose up -d --build`}</CodeBlock>

      <InfoBox title="Getting Help">
        If you encounter issues not covered here, check the backend logs for
        detailed error messages. Most errors include structured context that
        points to the root cause. For CI/CD issues, review the GitHub Actions
        workflow runs.
      </InfoBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared table styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: 'var(--color-text)',
  fontSize: 12,
};

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
};

// ---------------------------------------------------------------------------
// Section registry and main component
// ---------------------------------------------------------------------------

const sectionComponents: Record<Section, () => JSX.Element> = {
  'getting-started': GettingStartedSection,
  architecture: ArchitectureSection,
  features: FeaturesSection,
  equipment: EquipmentSection,
  reports: ReportsSection,
  admin: AdminSection,
  deployment: DeploymentSection,
  'api-reference': ApiReferenceSection,
  simulator: SimulatorSection,
  security: SecuritySection,
  troubleshooting: TroubleshootingSection,
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>('getting-started');
  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 80px)' }}>
      {/* Sidebar Navigation */}
      <nav
        style={{
          width: 220,
          minWidth: 220,
          borderRight: '1px solid var(--color-border)',
          padding: '20px 0',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 8,
          }}
        >
          <BookOpen size={16} style={{ color: 'var(--color-accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '2px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            Documentation
          </span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              backgroundColor:
                activeSection === item.id
                  ? 'var(--color-bg-hover)'
                  : 'transparent',
              borderLeft:
                activeSection === item.id
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
              color:
                activeSection === item.id
                  ? 'var(--color-text-bright)'
                  : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: activeSection === item.id ? 600 : 400,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all var(--transition)',
            }}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 40px',
          maxWidth: 900,
        }}
      >
        <ActiveComponent />
      </main>
    </div>
  );
}
