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
            className="flex items-center gap-1 py-1 px-2.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] cursor-pointer"
          >
            <Plus size={10} /> ADD SCHEDULE
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {/* Add Form */}
        {showForm && (
          <div
            className="p-3 bg-[var(--color-bg)] border border-[var(--color-accent)] rounded-[var(--radius)] flex flex-col gap-2.5"
          >
            <div
              className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-accent)] tracking-[1px]"
            >
              NEW SCHEDULE
            </div>

            <div className="grid gap-2 grid-cols-2">
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

            <div className="grid gap-2 grid-cols-2">
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formAutoDistribute}
                onChange={(e) => setFormAutoDistribute(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              <span
                className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)]"
              >
                Auto-distribute after generation
              </span>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                disabled={saving || !formTemplateId}
                className="flex items-center gap-1 py-1.5 px-3.5 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px]" style={{ backgroundColor: !formTemplateId || saving ? 'var(--color-bg-surface)' : 'var(--color-accent)', border: !formTemplateId || saving ? '1px solid var(--color-border)' : 'none', color: !formTemplateId || saving ? 'var(--color-text-muted)' : 'var(--color-bg)', cursor: !formTemplateId || saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
                {saving ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-1 py-1.5 px-3.5 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[9px] tracking-[1px] cursor-pointer"
              >
                <X size={10} /> CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Schedule Table */}
        {loading ? (
          <div
            className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] p-4 text-center"
          >
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div
            className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] p-4 text-center"
          >
            No schedules configured yet. Click ADD SCHEDULE to create one.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse">
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
                      <div className="flex items-center gap-1.5">
                        <CalendarDays
                          size={12}
                          className="text-[var(--color-text-muted)] shrink-0"
                        />
                        <span className="font-semibold text-[var(--color-text-bright)]">
                          {getTemplateName(s.template_id)}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>{getUnitName(s.unit_id)}</td>
                    <td style={tdStyle}>
                      <span
                        className="py-0.5 px-1.5 rounded-[var(--radius)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[8px] tracking-[0.5px]"
                      >
                        {s.frequency}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-[var(--color-text-muted)]" />
                        {s.time_of_day || '--:--'}
                        {s.day_of_week !== undefined &&
                          (s.frequency === ScheduleFrequency.WEEKLY ||
                            s.frequency === ScheduleFrequency.BIWEEKLY) && (
                            <span className="text-[8px] text-[var(--color-text-muted)]">
                              ({DAY_OF_WEEK_OPTIONS.find((d) => d.value === s.day_of_week)?.label || ''})
                            </span>
                          )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        className="py-0.5 px-1.5 rounded-[var(--radius)] text-[8px] tracking-[0.5px]" style={{ backgroundColor: s.is_active
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(255,255,255,0.05)', border: s.is_active
                            ? '1px solid rgba(34,197,94,0.3)'
                            : '1px solid var(--color-border)', color: s.is_active
                            ? 'var(--color-green, #22c55e)'
                            : 'var(--color-text-muted)' }}
                      >
                        {s.is_active ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className="text-[9px] text-[var(--color-text-muted)]">
                        {s.last_generated ? formatDate(s.last_generated) : '--'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className="text-[9px] text-[var(--color-text-muted)]">
                        {s.next_generation ? formatDate(s.next_generation) : '--'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="flex items-center gap-[3px] py-[3px] px-1.5 bg-transparent rounded-[var(--radius)] cursor-pointer font-[var(--font-mono)] text-[8px] text-[var(--color-red, #ef4444)] tracking-[0.5px]" style={{ border: '1px solid rgba(239,68,68,0.3)' }}
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
