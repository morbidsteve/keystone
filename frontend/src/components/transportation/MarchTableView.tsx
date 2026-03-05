// =============================================================================
// MarchTableView — Display march table data for a convoy plan
// =============================================================================

import { ArrowLeft, Printer, Fuel, Clock, MapPin } from 'lucide-react';
import type { MarchTableData } from '@/lib/types';
import Card from '@/components/ui/Card';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarchTableViewProps {
  marchTable: MarchTableData;
  planName: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarchTableView({
  marchTable,
  planName,
  onBack,
}: MarchTableViewProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    backgroundColor: 'var(--color-bg-elevated)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={12} /> BACK
          </button>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
            }}
          >
            MARCH TABLE — {planName}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
          }}
        >
          <Printer size={12} /> PRINT
        </button>
      </div>

      {/* SP / RP prominent display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderTop: '3px solid #4ade80',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            <MapPin size={14} style={{ color: '#4ade80' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
              }}
            >
              START POINT (SP)
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: '#4ade80',
            }}
          >
            {formatDate(marchTable.sp_time)}
          </div>
        </div>
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderTop: '3px solid #f87171',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
            <MapPin size={14} style={{ color: '#f87171' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
              }}
            >
              RELEASE POINT (RP)
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: '#f87171',
            }}
          >
            {formatDate(marchTable.rp_time)}
          </div>
        </div>
      </div>

      {/* Checkpoint table */}
      <Card title="CHECKPOINTS">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>#</th>
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Leg (km)</th>
                <th style={headerCellStyle}>Cumulative (km)</th>
                <th style={headerCellStyle}>ETA</th>
                <th style={headerCellStyle}>Speed (kph)</th>
              </tr>
            </thead>
            <tbody>
              {marchTable.checkpoints.map((cp, idx) => {
                const isHalt = cp.name.toUpperCase().includes('HALT');
                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: isHalt ? 'rgba(250, 204, 21, 0.05)' : undefined,
                    }}
                  >
                    <td style={{ ...cellStyle, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 600,
                        color: isHalt ? '#facc15' : 'var(--color-text-bright)',
                      }}
                    >
                      {cp.name}
                    </td>
                    <td style={cellStyle}>{cp.distance_km}</td>
                    <td style={cellStyle}>{cp.cumulative_distance_km}</td>
                    <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>
                      {formatDate(cp.time)}
                    </td>
                    <td style={cellStyle}>{cp.speed_kph || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={10} /> TOTAL DISTANCE
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {marchTable.total_distance_km} km
          </div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Clock size={10} /> TOTAL DURATION
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {marchTable.total_duration_hours}h
          </div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
            }}
          >
            MARCH SPEED
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {marchTable.march_speed_kph} kph
          </div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
            }}
          >
            CATCH-UP SPEED
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {marchTable.catch_up_speed_kph} kph
          </div>
        </div>
      </div>

      {/* Fuel estimate */}
      {marchTable.fuel_estimate && (
        <Card>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Fuel size={12} /> FUEL ESTIMATE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginBottom: 2,
                }}
              >
                TOTAL (GAL)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fb923c',
                }}
              >
                {marchTable.fuel_estimate.total_gallons}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginBottom: 2,
                }}
              >
                TOTAL (L)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fb923c',
                }}
              >
                {marchTable.fuel_estimate.total_liters}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginBottom: 2,
                }}
              >
                PER VEHICLE (GAL)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fb923c',
                }}
              >
                {marchTable.fuel_estimate.per_vehicle_gallons}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
