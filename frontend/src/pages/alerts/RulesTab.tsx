import { useState } from 'react';
import { Plus, Power, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import type { AlertRule } from '@/lib/types';
import { getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule } from '@/api/alerts';
import { useToast } from '@/hooks/useToast';

const OPERATOR_LABELS: Record<string, string> = {
  LT: '<', LTE: '<=', GT: '>', GTE: '>=', EQ: '=', NEQ: '!=',
};

export default function RulesTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: rules = [] } = useQuery<AlertRule[]>({
    queryKey: ['alert-rules'],
    queryFn: () => getAlertRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AlertRule>) => createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      setShowCreateForm(false);
      toast.success('Alert rule created');
    },
    onError: () => {
      toast.danger('Failed to create alert rule');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: AlertRule) => updateAlertRule(rule.id, { is_active: !rule.is_active }),
    onSuccess: (_data, rule) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success(`Rule ${rule.is_active ? 'disabled' : 'enabled'}`);
    },
    onError: () => {
      toast.danger('Failed to update alert rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule deleted');
    },
    onError: () => {
      toast.danger('Failed to delete alert rule');
    },
  });

  const [scopeType, setScopeType] = useState('ANY_UNIT');
  const [metricType, setMetricType] = useState('DOS');
  const [autoRecommend, setAutoRecommend] = useState(false);
  const [notifyRoles, setNotifyRoles] = useState<string[]>([]);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const notifyRolesArr = notifyRoles.length > 0 ? notifyRoles : undefined;
    const supplyClass = formData.get('supply_class') as string;
    const metricItemFilter = supplyClass ? { supply_class: supplyClass } : undefined;
    createMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      alert_type: formData.get('alert_type') as string,
      severity: formData.get('severity') as string,
      metric: formData.get('metric') as string,
      operator: formData.get('operator') as AlertRule['operator'],
      threshold_value: Number(formData.get('threshold_value')),
      cooldown_minutes: Number(formData.get('cooldown_minutes') || 60),
      is_scope_all: scopeType === 'ANY_UNIT',
      is_active: true,
      scope_type: scopeType,
      scope_echelon: scopeType === 'ECHELON' ? (formData.get('scope_echelon') as string) : undefined,
      scope_unit_id: scopeType === 'SPECIFIC_UNIT' ? Number(formData.get('scope_unit_id')) : undefined,
      include_subordinates: scopeType === 'SUBORDINATES',
      metric_type: metricType,
      metric_item_filter: metricItemFilter,
      notify_roles: notifyRolesArr,
      check_interval_minutes: Number(formData.get('check_interval_minutes') || 15),
      auto_recommend: autoRecommend,
      recommend_type: autoRecommend ? (formData.get('recommend_type') as string) : undefined,
      recommend_source_unit_id: autoRecommend && formData.get('recommend_source_unit_id') ? Number(formData.get('recommend_source_unit_id')) : undefined,
      recommend_assign_to_role: autoRecommend ? (formData.get('recommend_assign_to_role') as string) : undefined,
    });
  };

  const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 11,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    width: '100%',
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
          {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
        </span>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 py-1.5 px-3 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[#fff] font-[var(--font-mono)] text-[10px] tracking-[1px] cursor-pointer transition-all duration-[var(--transition)]"
        >
          <Plus size={12} />
          NEW RULE
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card title="CREATE ALERT RULE">
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
            {/* Basic Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">NAME</label>
                <input name="name" required style={inputStyle} placeholder="e.g. Supply DOS < 3 Days" />
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">DESCRIPTION</label>
                <input name="description" style={inputStyle} placeholder="Optional description" />
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">ALERT TYPE</label>
                <select name="alert_type" required style={inputStyle}>
                  <option value="LOW_DOS">LOW_DOS</option>
                  <option value="LOW_READINESS">LOW_READINESS</option>
                  <option value="PM_OVERDUE">PM_OVERDUE</option>
                  <option value="EQUIPMENT_DEADLINED">EQUIPMENT_DEADLINED</option>
                  <option value="STRENGTH_BELOW_THRESHOLD">STRENGTH_BELOW_THRESHOLD</option>
                  <option value="FUEL_CRITICAL">FUEL_CRITICAL</option>
                  <option value="AMMO_BELOW_RSR">AMMO_BELOW_RSR</option>
                </select>
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">SEVERITY</label>
                <select name="severity" required style={inputStyle}>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">METRIC</label>
                <input name="metric" required style={inputStyle} placeholder="e.g. supply_dos" />
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">OPERATOR</label>
                <select name="operator" required style={inputStyle}>
                  <option value="LT">&lt; (Less Than)</option>
                  <option value="LTE">&lt;= (Less or Equal)</option>
                  <option value="GT">&gt; (Greater Than)</option>
                  <option value="GTE">&gt;= (Greater or Equal)</option>
                  <option value="EQ">= (Equal)</option>
                  <option value="NEQ">!= (Not Equal)</option>
                </select>
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">THRESHOLD</label>
                <input name="threshold_value" type="number" step="any" required style={inputStyle} placeholder="e.g. 3" />
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">COOLDOWN (min)</label>
                <input name="cooldown_minutes" type="number" defaultValue={60} style={inputStyle} />
              </div>
            </div>

            {/* Scope Section */}
            <div className="border-t border-t-[var(--color-border)] pt-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-2">SCOPE</div>
              <div className="flex gap-4 flex-wrap mb-2">
                {(['ANY_UNIT', 'SPECIFIC_UNIT', 'ECHELON', 'SUBORDINATES'] as const).map((st) => (
                  <label key={st} className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text)] cursor-pointer">
                    <input type="radio" name="scope_type_radio" checked={scopeType === st} onChange={() => setScopeType(st)} className="accent-[var(--color-accent)]" />
                    {st.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {scopeType === 'SPECIFIC_UNIT' && (
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">UNIT ID</label>
                    <input name="scope_unit_id" type="number" style={inputStyle} placeholder="Unit ID" />
                  </div>
                )}
                {scopeType === 'ECHELON' && (
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">ECHELON</label>
                    <select name="scope_echelon" style={inputStyle}>
                      <option value="MEF">MEF</option>
                      <option value="DIVISION">DIVISION</option>
                      <option value="REGIMENT">REGIMENT</option>
                      <option value="BATTALION">BATTALION</option>
                      <option value="COMPANY">COMPANY</option>
                      <option value="PLATOON">PLATOON</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Metric Type & Item Filter */}
            <div className="border-t border-t-[var(--color-border)] pt-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-2">METRIC CONFIGURATION</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">METRIC TYPE</label>
                  <select value={metricType} onChange={(e) => setMetricType(e.target.value)} style={inputStyle}>
                    <option value="DOS">DOS</option>
                    <option value="READINESS_PCT">READINESS_PCT</option>
                    <option value="ON_HAND_QTY">ON_HAND_QTY</option>
                    <option value="FILL_RATE">FILL_RATE</option>
                    <option value="MAINTENANCE_BACKLOG">MAINTENANCE_BACKLOG</option>
                    <option value="FUEL_LEVEL">FUEL_LEVEL</option>
                  </select>
                </div>
                {(metricType === 'DOS' || metricType === 'ON_HAND_QTY') && (
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">SUPPLY CLASS FILTER</label>
                    <input name="supply_class" style={inputStyle} placeholder="e.g. V, III, IX" />
                  </div>
                )}
                <div>
                  <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">CHECK INTERVAL (min)</label>
                  <input name="check_interval_minutes" type="number" defaultValue={15} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Notify Roles */}
            <div className="border-t border-t-[var(--color-border)] pt-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1.5px] mb-2">NOTIFY ROLES</div>
              <div className="flex gap-4 flex-wrap">
                {['S4', 'CO', 'XO', 'BN_CDR'].map((role) => (
                  <label key={role} className="flex items-center gap-1.5 font-[var(--font-mono)] text-[11px] text-[var(--color-text)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) setNotifyRoles([...notifyRoles, role]);
                        else setNotifyRoles(notifyRoles.filter(r => r !== role));
                      }}
                      className="accent-[var(--color-accent)]"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-Recommend */}
            <div className="border-t border-t-[var(--color-border)] pt-3">
              <label className="flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--color-text)] cursor-pointer mb-2">
                <input type="checkbox" checked={autoRecommend} onChange={(e) => setAutoRecommend(e.target.checked)} className="accent-[var(--color-accent)]" />
                AUTO-RECOMMEND ACTION
              </label>
              {autoRecommend && (
                <div className="grid gap-3 grid-cols-3">
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">RECOMMEND TYPE</label>
                    <select name="recommend_type" style={inputStyle}>
                      <option value="RESUPPLY">RESUPPLY</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="FUEL_DELIVERY">FUEL_DELIVERY</option>
                      <option value="PERSONNEL_MOVE">PERSONNEL_MOVE</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">SOURCE UNIT ID</label>
                    <input name="recommend_source_unit_id" type="number" style={inputStyle} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] block mb-1">ASSIGN TO ROLE</label>
                    <select name="recommend_assign_to_role" style={inputStyle}>
                      <option value="S4">S4</option>
                      <option value="CO">CO</option>
                      <option value="XO">XO</option>
                      <option value="BN_CDR">BN_CDR</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-1.5 px-3.5 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[10px] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="py-1.5 px-3.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[#fff] font-[var(--font-mono)] text-[10px] cursor-pointer"
              >
                CREATE RULE
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Rules Table */}
      <Card title="ALERT RULES">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-[var(--font-mono)]">
            <thead>
              <tr>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>SEVERITY</th>
                <th style={thStyle}>SCOPE</th>
                <th style={thStyle}>METRIC TYPE</th>
                <th style={thStyle}>METRIC</th>
                <th style={thStyle}>CONDITION</th>
                <th style={thStyle}>COOLDOWN</th>
                <th style={thStyle}>ACTIVE</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="font-medium">
                    {rule.name}
                  </td>
                  <td style={tdStyle}>{rule.alert_type}</td>
                  <td style={tdStyle}>
                    <span style={{
                      color: rule.severity === 'CRITICAL' ? 'var(--color-danger)' :
                        rule.severity === 'WARNING' ? 'var(--color-warning)' : 'var(--color-info)',
                    }}>
                      {rule.severity}
                    </span>
                  </td>
                  <td style={tdStyle}>{rule.scope_type || (rule.is_scope_all ? 'ANY_UNIT' : 'SPECIFIC')}</td>
                  <td style={tdStyle}>{rule.metric_type || '--'}</td>
                  <td style={tdStyle}>{rule.metric}</td>
                  <td style={tdStyle}>{OPERATOR_LABELS[rule.operator] || rule.operator} {rule.threshold_value}</td>
                  <td style={tdStyle}>{rule.cooldown_minutes}m</td>
                  <td style={tdStyle}>
                    <span className="inline-block w-[8px] h-[8px]" style={{ borderRadius: '50%', backgroundColor: rule.is_active ? 'var(--color-success, #22c55e)' : 'var(--color-text-muted)' }} />
                  </td>
                  <td style={tdStyle}>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleMutation.mutate(rule)}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                        className="flex items-center py-[3px] px-1.5 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer transition-all duration-[var(--transition)]"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.color = 'var(--color-accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Power size={12} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(rule.id)}
                        title="Delete rule"
                        className="flex items-center py-[3px] px-1.5 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] cursor-pointer transition-all duration-[var(--transition)]"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-danger)';
                          e.currentTarget.style.color = 'var(--color-danger)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
