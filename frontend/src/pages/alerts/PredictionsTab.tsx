import { useState } from 'react';
import { Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import type { LogisticsRecommendation } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { getRecommendations, approveRecommendation, denyRecommendation } from '@/api/predictions';
import { useToast } from '@/hooks/useToast';

const RECOMMENDATION_TYPE_COLORS: Record<string, string> = {
  RESUPPLY: 'var(--color-info)',
  MAINTENANCE: 'var(--color-warning)',
  FUEL_DELIVERY: '#eab308',
  PERSONNEL_MOVE: 'var(--color-success, #22c55e)',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--color-warning)',
  APPROVED: 'var(--color-success, #22c55e)',
  DENIED: 'var(--color-danger)',
  EXECUTED: 'var(--color-accent)',
  EXPIRED: 'var(--color-text-muted)',
};

interface RecommendedItem {
  [key: string]: string | number | boolean | null;
}

interface RecommendedVehicle {
  vehicle_type: string;
  status: string;
}

interface RecommendedPerson {
  rank: string;
  name: string;
  role: string;
}

export default function PredictionsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [denyNotes, setDenyNotes] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: recommendations = [] } = useQuery<LogisticsRecommendation[]>({
    queryKey: ['predictions', statusFilter === 'ALL' ? undefined : statusFilter],
    queryFn: () => getRecommendations(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => approveRecommendation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Recommendation approved');
    },
    onError: () => {
      toast.danger('Failed to approve recommendation');
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => denyRecommendation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast.success('Recommendation denied');
    },
    onError: () => {
      toast.danger('Failed to deny recommendation');
    },
  });

  const pendingCount = recommendations.filter(r => r.status === 'PENDING').length;
  const approvedCount = recommendations.filter(r => r.status === 'APPROVED').length;
  const deniedCount = recommendations.filter(r => r.status === 'DENIED').length;

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '1px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: color,
  });

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    backgroundColor: active ? 'var(--color-accent)' : 'transparent',
    border: active ? 'none' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: active ? '#fff' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  });

  const miniThStyle: React.CSSProperties = {
    padding: '4px 8px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
  };

  const miniTdStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: 10,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid-responsive-4col">
        {[
          { label: 'TOTAL', value: recommendations.length, color: 'var(--color-text-bright)' },
          { label: 'PENDING', value: pendingCount, color: 'var(--color-warning)' },
          { label: 'APPROVED', value: approvedCount, color: 'var(--color-success, #22c55e)' },
          { label: 'DENIED', value: deniedCount, color: 'var(--color-danger)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] py-3 px-4 text-center"
          >
            <div className="section-header mb-1">{stat.label}</div>
            <div className="font-[var(--font-mono)] text-[28px] font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'APPROVED', 'DENIED', 'EXECUTED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={filterBtnStyle(statusFilter === s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div className="flex flex-col gap-3">
        {recommendations.length === 0 ? (
          <Card title="PREDICTIONS">
            <div className="p-6 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
              No recommendations found
            </div>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.id} title={`REC-${String(rec.id).padStart(4, '0')}`}>
              <div className="flex flex-col gap-2.5">
                {/* Header row */}
                <div className="flex gap-2 items-center flex-wrap">
                  <span style={badgeStyle(RECOMMENDATION_TYPE_COLORS[rec.recommendation_type] || 'var(--color-text-muted)')}>
                    {rec.recommendation_type.replace(/_/g, ' ')}
                  </span>
                  <span style={badgeStyle(STATUS_COLORS[rec.status] || 'var(--color-text-muted)')}>
                    {rec.status}
                  </span>
                  {rec.assigned_to_role && (
                    <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px]">
                      ASSIGNED: {rec.assigned_to_role}
                    </span>
                  )}
                </div>

                <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-bright)] leading-normal">
                  {rec.description}
                </div>

                {rec.triggered_by_metric && (
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-warning)]">
                    TRIGGER: {rec.triggered_by_metric}
                  </div>
                )}

                {/* Items Table */}
                {rec.recommended_items && rec.recommended_items.length > 0 && (
                  <div>
                    <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-1">ITEMS</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-[var(--font-mono)]">
                        <thead>
                          <tr>
                            {Object.keys(rec.recommended_items[0] as RecommendedItem).map((key) => (
                              <th key={key} style={miniThStyle}>{key.toUpperCase().replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(rec.recommended_items as RecommendedItem[]).map((item, idx) => (
                            <tr key={idx}>
                              {Object.values(item).map((val, vidx) => (
                                <td key={vidx} style={miniTdStyle}>{typeof val === 'number' ? val.toLocaleString() : String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Vehicles */}
                {rec.recommended_vehicles && rec.recommended_vehicles.length > 0 && (
                  <div>
                    <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-1">VEHICLES</div>
                    <div className="flex gap-2 flex-wrap">
                      {(rec.recommended_vehicles as RecommendedVehicle[]).map((v, idx) => (
                        <div key={idx} className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
                          {v.vehicle_type} <span className="text-[9px]" style={{ color: v.status === 'FMC' ? 'var(--color-success, #22c55e)' : 'var(--color-danger)' }}>{v.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personnel */}
                {rec.recommended_personnel && rec.recommended_personnel.length > 0 && (
                  <div>
                    <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-1">PERSONNEL</div>
                    <div className="flex gap-2 flex-wrap">
                      {(rec.recommended_personnel as RecommendedPerson[]).map((p, idx) => (
                        <div key={idx} className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-text)]">
                          {p.rank} {p.name} <span className="text-[var(--color-text-muted)] text-[9px]">({p.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimates */}
                <div className="flex gap-4 flex-wrap">
                  {rec.estimated_cost != null && (
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                      COST: <span className="text-[var(--color-text-bright)]">${rec.estimated_cost.toLocaleString()}</span>
                    </div>
                  )}
                  {rec.estimated_weight != null && (
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                      WEIGHT: <span className="text-[var(--color-text-bright)]">{rec.estimated_weight.toLocaleString()} lbs</span>
                    </div>
                  )}
                  {rec.estimated_duration && (
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                      DURATION: <span className="text-[var(--color-text-bright)]">{rec.estimated_duration}</span>
                    </div>
                  )}
                  {rec.recommended_source && (
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                      SOURCE: <span className="text-[var(--color-text-bright)]">{rec.recommended_source}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {rec.notes && (
                  <div className="py-2 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] italic">
                    {rec.notes}
                  </div>
                )}

                {rec.decided_at && (
                  <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                    Decided {formatRelativeTime(rec.decided_at)}
                  </div>
                )}

                {/* Action Buttons for PENDING */}
                {rec.status === 'PENDING' && (
                  <div className="flex gap-2 items-center flex-wrap border-t border-t-[var(--color-border)] pt-2.5">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={denyNotes[rec.id] || ''}
                      onChange={(e) => setDenyNotes({ ...denyNotes, [rec.id]: e.target.value })}
                      className="flex-1 min-w-[150px] py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[10px]"
                    />
                    <button
                      onClick={() => approveMutation.mutate({ id: rec.id, notes: denyNotes[rec.id] })}
                      className="flex items-center gap-1 py-1.5 px-3.5 bg-[var(--color-success, #22c55e)] border-0 rounded-[var(--radius)] text-[#fff] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
                    >
                      <Check size={12} />
                      APPROVE & EXECUTE
                    </button>
                    <button
                      onClick={() => denyMutation.mutate({ id: rec.id, notes: denyNotes[rec.id] })}
                      className="flex items-center gap-1 py-1.5 px-3.5 bg-transparent border border-[var(--color-danger)] rounded-[var(--radius)] text-[var(--color-danger)] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
                    >
                      DENY
                    </button>
                  </div>
                )}

                {/* Timestamp */}
                {rec.created_at && (
                  <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                    Created {formatRelativeTime(rec.created_at)}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
