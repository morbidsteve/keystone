import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, Loader, Clock, CalendarDays } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ReportTemplate, ReportSchedule } from '@/lib/types';
import { ScheduleFrequency } from '@/lib/types';
import { getTemplates, getSchedules, createSchedule, deleteSchedule } from '@/api/reports';
import { formatDate } from '@/lib/utils';

const FREQUENCY_OPTIONS = [
  { value: ScheduleFrequency.DAILY, label: 'DAILY' },
  { value: ScheduleFrequency.WEEKLY, label: 'WEEKLY' },
  { value: ScheduleFrequency.BIWEEKLY, label: 'BIWEEKLY' },
  { value: ScheduleFrequency.MONTHLY, label: 'MONTHLY' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const UNIT_OPTIONS = [
  { value: 1, label: 'I MEF' },
  { value: 2, label: '1ST MARDIV' },
  { value: 3, label: '1ST MARINES' },
  { value: 4, label: '1/1 BN' },
  { value: 5, label: '2/1 BN' },
  { value: 6, label: '3/1 BN' },
];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTemplateId, setFormTemplateId] = useState<number>(0);
  const [formUnitId, setFormUnitId] = useState<number>(3);
  const [formFrequency, setFormFrequency] = useState<ScheduleFrequency>(ScheduleFrequency.DAILY);
  const [formTimeOfDay, setFormTimeOfDay] = useState('06:00');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(1);
  const [formAutoDistribute, setFormAutoDistribute] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sData, tData] = await Promise.all([getSchedules(), getTemplates()]);
      setSchedules(sData);
      setTemplates(tData);
      if (tData.length > 0 && formTemplateId === 0) {
        setFormTemplateId(tData[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTemplateId(templates.length > 0 ? templates[0].id : 0);
    setFormUnitId(3);
    setFormFrequency(ScheduleFrequency.DAILY);
    setFormTimeOfDay('06:00');
    setFormDayOfWeek(1);
    setFormDayOfMonth(1);
    setFormAutoDistribute(false);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formTemplateId) return;
    setSaving(true);
    try {
      const data: Omit<ReportSchedule, 'id' | 'last_generated' | 'next_generation' | 'created_at' | 'updated_at'> = {
        template_id: formTemplateId,
        unit_id: formUnitId,
        frequency: formFrequency,
        time_of_day: formTimeOfDay,
        is_active: true,
        auto_distribute: formAutoDistribute,
      };
      if (formFrequency === ScheduleFrequency.WEEKLY || formFrequency === ScheduleFrequency.BIWEEKLY) {
        data.day_of_week = formDayOfWeek;
      }
      if (formFrequency === ScheduleFrequency.MONTHLY) {
        data.day_of_month = formDayOfMonth;
      }
      const created = await createSchedule(data);
      setSchedules((prev) => [...prev, created]);
      resetForm();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  };

  const getTemplateName = (templateId: number): string => {
    return templates.find((t) => t.id === templateId)?.name || `Template #${templateId}`;
  };

  const getUnitName = (unitId: number): string => {
    return UNIT_OPTIONS.find((u) => u.value === unitId)?.label || `Unit #${unitId}`;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    display: 'block',
    marginBottom: 3,
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--color-text)',
  };

  return (
    <Card
      title="REPORT SCHEDULES"
      headerRight={
        !showForm ? (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
          >
            <Plus size={10} /> ADD SCHEDULE
          </button>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Add Form */}
        {showForm && (
          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-accent)',
                letterSpacing: '1px',
              }}
            >
              NEW SCHEDULE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>TEMPLATE</label>
                <select
                  value={formTemplateId}
                  onChange={(e) => setFormTemplateId(Number(e.target.value))}
                  style={inputStyle}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.report_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>UNIT</label>
                <select
                  value={formUnitId}
                  onChange={(e) => setFormUnitId(Number(e.target.value))}
                  style={inputStyle}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>FREQUENCY</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as ScheduleFrequency)}
                  style={inputStyle}
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>TIME OF DAY</label>
                <input
                  type="time"
                  value={formTimeOfDay}
                  onChange={(e) => setFormTimeOfDay(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {(formFrequency === ScheduleFrequency.WEEKLY ||
              formFrequency === ScheduleFrequency.BIWEEKLY) && (
              <div>
                <label style={labelStyle}>DAY OF WEEK</label>
                <select
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                  style={inputStyle}
                >
                  {DAY_OF_WEEK_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formFrequency === ScheduleFrequency.MONTHLY && (
              <div>
                <label style={labelStyle}>DAY OF MONTH</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formAutoDistribute}
                onChange={(e) => setFormAutoDistribute(e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text)',
                }}
              >
                Auto-distribute after generation
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleSave}
                disabled={saving || !formTemplateId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  backgroundColor: !formTemplateId || saving ? 'var(--color-bg-surface)' : 'var(--color-accent)',
                  border: !formTemplateId || saving ? '1px solid var(--color-border)' : 'none',
                  borderRadius: 'var(--radius)',
                  color: !formTemplateId || saving ? 'var(--color-text-muted)' : 'var(--color-bg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1px',
                  cursor: !formTemplateId || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
                {saving ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                onClick={resetForm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                <X size={10} /> CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Schedule Table */}
        {loading ? (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              padding: 16,
              textAlign: 'center',
            }}
          >
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              padding: 16,
              textAlign: 'center',
            }}
          >
            No schedules configured yet. Click ADD SCHEDULE to create one.
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>TEMPLATE</th>
                  <th style={thStyle}>UNIT</th>
                  <th style={thStyle}>FREQUENCY</th>
                  <th style={thStyle}>TIME</th>
                  <th style={thStyle}>ACTIVE</th>
                  <th style={thStyle}>LAST GEN</th>
                  <th style={thStyle}>NEXT</th>
                  <th style={thStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarDays
                          size={12}
                          style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 600, color: 'var(--color-text-bright)' }}>
                          {getTemplateName(s.template_id)}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>{getUnitName(s.unit_id)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius)',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          fontSize: 8,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {s.frequency}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} style={{ color: 'var(--color-text-muted)' }} />
                        {s.time_of_day || '--:--'}
                        {s.day_of_week !== undefined &&
                          (s.frequency === ScheduleFrequency.WEEKLY ||
                            s.frequency === ScheduleFrequency.BIWEEKLY) && (
                            <span style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>
                              ({DAY_OF_WEEK_OPTIONS.find((d) => d.value === s.day_of_week)?.label || ''})
                            </span>
                          )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius)',
                          backgroundColor: s.is_active
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(255,255,255,0.05)',
                          border: s.is_active
                            ? '1px solid rgba(34,197,94,0.3)'
                            : '1px solid var(--color-border)',
                          color: s.is_active
                            ? 'var(--color-green, #22c55e)'
                            : 'var(--color-text-muted)',
                          fontSize: 8,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {s.is_active ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                        {s.last_generated ? formatDate(s.last_generated) : '--'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                        {s.next_generation ? formatDate(s.next_generation) : '--'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '3px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8,
                          color: 'var(--color-red, #ef4444)',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <Trash2 size={9} /> DEL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
