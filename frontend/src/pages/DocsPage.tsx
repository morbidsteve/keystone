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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Section =
  | 'getting-started'
  | 'architecture'
  | 'features'
  | 'deployment'
  | 'api-reference'
  | 'simulator'
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
  { id: 'deployment', label: 'Deployment', icon: Server },
  { id: 'api-reference', label: 'API Reference', icon: Code },
  { id: 'simulator', label: 'Simulator', icon: Activity },
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

function GettingStartedSection() {
  return (
    <div>
      <SectionHeading>Getting Started</SectionHeading>

      <Paragraph>
        KEYSTONE is a USMC logistics intelligence application that provides
        automated ingestion, analysis, and reporting of supply, equipment, and
        transportation data. It gives commanders and staff a real-time Common
        Operating Picture (COP) of their logistics posture.
      </Paragraph>

      <InfoBox title="Quick Start">
        The fastest way to get KEYSTONE running locally is with Docker Compose.
        You need Docker 24+ and Docker Compose v2 installed.
      </InfoBox>

      <SubHeading>1. Start the Stack</SubHeading>
      <CodeBlock>{`# Clone the repository
git clone https://github.com/morbidsteve/keystone.git
cd keystone

# Start all services
docker compose up -d

# Verify everything is healthy
docker compose ps`}</CodeBlock>

      <SubHeading>2. Access the Application</SubHeading>
      <Paragraph>
        Once all services are healthy, open your browser to{' '}
        <InlineCode>https://localhost</InlineCode>. In development mode,
        seed users are created automatically.
      </Paragraph>

      <SubHeading>3. Run the Simulator (Optional)</SubHeading>
      <Paragraph>
        To populate the system with realistic exercise data, start the demo
        profile:
      </Paragraph>
      <CodeBlock>{`docker compose --profile demo up -d`}</CodeBlock>
      <Paragraph>
        The simulator runs the Steel Guardian scenario at 60x speed, feeding
        supply, equipment, and transportation events into the system
        continuously.
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
              <td style={tdStyle}>Main application</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>API Docs</td>
              <td style={tdStyle}>https://localhost/api/docs</td>
              <td style={tdStyle}>Swagger UI</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Backend API</td>
              <td style={tdStyle}>http://localhost:8000</td>
              <td style={tdStyle}>Direct access (dev)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>PostgreSQL</td>
              <td style={tdStyle}>localhost:5432</td>
              <td style={tdStyle}>Database (dev)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <SectionHeading>Architecture</SectionHeading>

      <Paragraph>
        KEYSTONE follows a modern full-stack architecture with a Python backend,
        React frontend, and supporting infrastructure services.
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
          description="Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Pydantic, Celery"
        />
        <FeatureCard
          title="Frontend"
          description="React 18, TypeScript, Vite, Zustand, TanStack Query/Table, Tailwind CSS"
        />
        <FeatureCard
          title="Database"
          description="PostgreSQL 15 with PostGIS for geospatial data"
        />
        <FeatureCard
          title="Cache / Queue"
          description="Redis 7 for Celery task queue and caching"
        />
        <FeatureCard
          title="Maps"
          description="react-leaflet with milsymbol for NATO MIL-STD-2525D symbols"
        />
        <FeatureCard
          title="Infrastructure"
          description="Docker, nginx (TLS + tile proxy), GitHub Actions CI/CD"
        />
      </div>

      <SubHeading>System Components</SubHeading>
      <CodeBlock>{`
  Browser (React SPA)
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
  Redis (redis container, port 6379)`}</CodeBlock>

      <SubHeading>Data Flow</SubHeading>
      <BulletList
        items={[
          'Logistics reports (CSV, XML, JSON) are uploaded via the Ingestion page',
          'Schema mapping normalizes external fields to KEYSTONE canonical format',
          'Celery workers process ingested data asynchronously',
          'Dashboard aggregates readiness metrics per unit echelon',
          'Map overlay displays unit positions with NATO military symbols',
          'Alerts fire when readiness drops below configurable thresholds',
          'Reports generate formatted LOGSTAT and other standard reports',
        ]}
      />

      <SubHeading>Security Architecture</SubHeading>
      <BulletList
        items={[
          'JWT bearer token authentication on all API endpoints',
          'Role-based access control (COMMANDER, S4_STAFF, S3_STAFF, ANALYST, ADMIN)',
          'nginx enforces HSTS, CSP, X-Frame-Options, and other security headers',
          'Containers run as non-root with no-new-privileges and minimal capabilities',
          'All tile requests proxy through nginx to avoid CSP violations and data leakage',
          'Classification banner system for UNCLASSIFIED through TS//SCI',
        ]}
      />
    </div>
  );
}

function FeaturesSection() {
  return (
    <div>
      <SectionHeading>Features</SectionHeading>

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
          description="High-level readiness overview showing supply, equipment, and personnel status across all subordinate units with trend indicators."
        />
        <FeatureCard
          title="S-4 (Logistics) View"
          description="Detailed supply class breakdowns, shortfall analysis, and readiness percentages by supply category (I through X)."
        />
        <FeatureCard
          title="S-3 (Operations) View"
          description="Operational readiness metrics, equipment availability rates, and maintenance status for mission planning."
        />
        <FeatureCard
          title="Interactive COP Map"
          description="Full-screen map with NATO MIL-STD-2525D military symbols, unit positions, routes, and multiple tile layers (OSM, satellite, topo)."
        />
        <FeatureCard
          title="Equipment Tracking"
          description="Individual serial-number-level equipment tracking with maintenance history, readiness status, and TAMCN aggregation."
        />
        <FeatureCard
          title="Transportation Management"
          description="Convoy manifest creation, vehicle load planning, route tracking, and movement request management."
        />
        <FeatureCard
          title="Data Ingestion"
          description="Upload CSV, XML, or JSON logistics reports with automatic schema mapping to canonical KEYSTONE format."
        />
        <FeatureCard
          title="Alerts System"
          description="Configurable readiness threshold alerts with severity levels. Get notified when supply or equipment readiness drops."
        />
        <FeatureCard
          title="Reports"
          description="Generate formatted logistics reports (LOGSTAT, equipment status, etc.) with export capabilities."
        />
        <FeatureCard
          title="Unit Hierarchy"
          description="Full echelon tree from MEF down to squad level. Filter all data by selected unit scope."
        />
        <FeatureCard
          title="TAK Integration"
          description="Push and pull Cursor-on-Target (CoT) events to/from TAK Server for interoperability with ATAK/WinTAK."
        />
        <FeatureCard
          title="Classification Banners"
          description="Configurable classification level from UNCLASSIFIED through TS//SCI with color-coded banners on every page."
        />
      </div>
    </div>
  );
}

function DeploymentSection() {
  return (
    <div>
      <SectionHeading>Deployment</SectionHeading>

      <Paragraph>
        KEYSTONE supports multiple deployment models, from local development to
        air-gapped classified networks. Comprehensive deployment guides are
        available in the repository under{' '}
        <InlineCode>docs/deployment/</InlineCode>.
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
          title="Docker Compose"
          description="The simplest deployment method. Suitable for development, demos, and single-server production."
          guide="docs/deployment/docker-compose.md"
        />
        <DeploymentOption
          title="On-Premises / Bare Metal"
          description="Direct installation on physical or virtual servers with systemd services and nginx reverse proxy."
          guide="docs/deployment/on-premises.md"
        />
        <DeploymentOption
          title="Cloud (AWS / Azure / GCP)"
          description="Managed container services, databases, and caching. Auto-scaling and CDN for static assets."
          guide="docs/deployment/cloud.md"
        />
        <DeploymentOption
          title="Air-Gapped / SIPR / Classified"
          description="Fully offline deployment with local tile server, internal PKI, and classification banner support."
          guide="docs/deployment/air-gapped.md"
        />
        <DeploymentOption
          title="Kubernetes / Helm"
          description="Helm chart deployment with HPA, PVCs, ingress, secrets management, and monitoring."
          guide="docs/deployment/kubernetes.md"
        />
      </div>

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
            <tr style={trStyle}>
              <td style={tdStyle}>DATABASE_URL</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Async PostgreSQL connection string</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>REDIS_URL</td>
              <td style={tdStyle}>Yes</td>
              <td style={tdStyle}>Redis connection string</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>SECRET_KEY</td>
              <td style={tdStyle}>Yes (prod)</td>
              <td style={tdStyle}>JWT signing key (must be random in production)</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>ENV_MODE</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>
                &quot;development&quot; (default) or &quot;production&quot;
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>CORS_ORIGINS</td>
              <td style={tdStyle}>No</td>
              <td style={tdStyle}>JSON array of allowed origins</td>
            </tr>
          </tbody>
        </table>
      </div>
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

function ApiReferenceSection() {
  return (
    <div>
      <SectionHeading>API Reference</SectionHeading>

      <Paragraph>
        KEYSTONE exposes a RESTful API under{' '}
        <InlineCode>/api/v1/</InlineCode>. Full interactive documentation
        is available via Swagger UI.
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
        authentication support.
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
              ['/api/v1/auth', 'Login, token management'],
              ['/api/v1/dashboard', 'Readiness aggregation'],
              ['/api/v1/supply', 'Supply status CRUD'],
              ['/api/v1/equipment', 'Equipment readiness'],
              ['/api/v1/equipment/individual', 'Serial-level tracking'],
              ['/api/v1/transportation', 'Movement & convoys'],
              ['/api/v1/ingestion', 'File upload & parsing'],
              ['/api/v1/reports', 'Report generation'],
              ['/api/v1/alerts', 'Alert management'],
              ['/api/v1/units', 'Unit hierarchy'],
              ['/api/v1/map', 'Geospatial data'],
              ['/api/v1/personnel', 'Personnel strength'],
              ['/api/v1/tak', 'TAK Server integration'],
              ['/api/v1/settings', 'System configuration'],
              ['/api/v1/schema-mapping', 'Field mapping'],
              ['/api/v1/data-sources', 'External sources'],
              ['/api/v1/maintenance', 'Maintenance tracking'],
            ].map(([prefix, desc]) => (
              <tr key={prefix} style={trStyle}>
                <td style={tdStyle}>{prefix}</td>
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
        Include the token in subsequent requests:
      </Paragraph>
      <CodeBlock>{`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}</CodeBlock>
    </div>
  );
}

function SimulatorSection() {
  return (
    <div>
      <SectionHeading>Simulator</SectionHeading>

      <Paragraph>
        KEYSTONE includes a built-in simulator that generates realistic logistics
        data for demonstrations, training, and testing. The simulator creates
        supply status reports, equipment readiness updates, transportation
        requests, and alert conditions.
      </Paragraph>

      <SubHeading>Running the Simulator</SubHeading>
      <CodeBlock>{`# Start with Docker Compose demo profile
docker compose --profile demo up -d

# View simulator output
docker compose logs -f simulator`}</CodeBlock>

      <SubHeading>Configuration</SubHeading>
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
              <th style={thStyle}>Default</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}>
              <td style={tdStyle}>SIM_SPEED</td>
              <td style={tdStyle}>60</td>
              <td style={tdStyle}>
                Time multiplier (60 = 1 hour of data per minute)
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>SIM_SCENARIO</td>
              <td style={tdStyle}>steel_guardian</td>
              <td style={tdStyle}>Scenario name</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>KEYSTONE_URL</td>
              <td style={tdStyle}>http://backend:8000</td>
              <td style={tdStyle}>Backend API URL</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SubHeading>Steel Guardian Scenario</SubHeading>
      <Paragraph>
        The default scenario simulates a Marine Expeditionary Brigade (MEB)
        conducting a multi-phase exercise. It generates:
      </Paragraph>
      <BulletList
        items={[
          'Supply status reports across all ten supply classes (I-X)',
          'Equipment readiness fluctuations with maintenance events',
          'Transportation movement requests and convoy manifests',
          'Personnel strength changes and manning updates',
          'Readiness alerts when thresholds are crossed',
          'Map position updates for unit movements',
        ]}
      />

      <InfoBox title="Note">
        The simulator connects to the backend API and submits data through the
        same endpoints used by real data sources. This means all ingestion,
        validation, and processing logic is exercised during simulation.
      </InfoBox>
    </div>
  );
}

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
        ]}
      />

      <SubHeading>Frontend shows blank page or errors</SubHeading>
      <BulletList
        items={[
          'Clear browser cache and hard reload (Ctrl+Shift+R)',
          'Check browser console (F12) for JavaScript errors',
          'Verify the backend is reachable: curl http://localhost:8000/health',
          'Check nginx logs: docker compose logs frontend',
        ]}
      />

      <SubHeading>Map tiles not loading</SubHeading>
      <BulletList
        items={[
          'Tiles are proxied through nginx to avoid CSP issues',
          'Check nginx logs for tile proxy errors',
          'In air-gapped environments, ensure tileserver-gl is running with valid MBTiles',
          'Admin > Tile Layers can switch between online and local tile sources',
        ]}
      />

      <SubHeading>API returns 401 Unauthorized</SubHeading>
      <BulletList
        items={[
          'JWT tokens expire after 8 hours by default (ACCESS_TOKEN_EXPIRE_MINUTES=480)',
          'Log in again to obtain a fresh token',
          'Verify SECRET_KEY has not changed between token issuance and validation',
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
      <CodeBlock>{`# Stop all services and remove volumes
docker compose down -v

# Rebuild and start fresh
docker compose up -d --build`}</CodeBlock>

      <InfoBox title="Getting Help">
        If you encounter issues not covered here, check the backend logs for
        detailed error messages. Most errors include structured context that
        points to the root cause.
      </InfoBox>
    </div>
  );
}

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

const sectionComponents: Record<Section, () => JSX.Element> = {
  'getting-started': GettingStartedSection,
  architecture: ArchitectureSection,
  features: FeaturesSection,
  deployment: DeploymentSection,
  'api-reference': ApiReferenceSection,
  simulator: SimulatorSection,
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
