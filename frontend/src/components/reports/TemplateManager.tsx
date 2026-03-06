import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Loader, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { ReportTemplate } from '@/lib/types';
import { ReportType, ReportClassification } from '@/lib/types';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/api/reports';

const REPORT_TYPE_OPTIONS = [
  ReportType.LOGSTAT,
  ReportType.SITREP,
  ReportType.PERSTAT,
  ReportType.SPOTREP,
  ReportType.READINESS,
  ReportType.SUPPLY_STATUS,
  ReportType.EQUIPMENT_STATUS,
  ReportType.MAINTENANCE_SUMMARY,
  ReportType.MOVEMENT_SUMMARY,
  ReportType.PERSONNEL_STRENGTH,
  ReportType.INTSUM,
  ReportType.COMMAND_BRIEF,
  ReportType.AAR,
];

const CLASSIFICATION_OPTIONS = [
  ReportClassification.UNCLASS,
  ReportClassification.CUI,
  ReportClassification.SECRET,
  ReportClassification.TS,
  ReportClassification.TS_SCI,
];

const SECTION_OPTIONS = [
  'HEADER',
  'SITUATION',
  'PERSONNEL_STRENGTH',
  'LOGISTICS_SUMMARY',
  'SUPPLY_CLASS_I',
  'SUPPLY_CLASS_III',
  'SUPPLY_CLASS_V',
  'SUPPLY_CLASS_IX',
  'EQUIPMENT_STATUS',
  'MAINTENANCE_STATUS',
  'MOVEMENT_STATUS',
  'COMMANDER_ASSESSMENT',
  'FOOTER',
];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>(ReportType.SITREP);
  const [formDescription, setFormDescription] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formSections, setFormSections] = useState<string[]>(['HEADER', 'FOOTER']);
  const [formClassification, setFormClassification] = useState<string>(ReportClassification.CUI);
  const [formIsDefault, setFormIsDefault] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType(ReportType.SITREP);
    setFormDescription('');
    setFormBody('');
    setFormSections(['HEADER', 'FOOTER']);
    setFormClassification(ReportClassification.CUI);
    setFormIsDefault(false);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (t: ReportTemplate) => {
    setFormName(t.name);
    setFormType(t.report_type);
    setFormDescription(t.description || '');
    setFormBody(t.template_body);
    setFormSections([...t.sections]);
    setFormClassification(t.classification_default);
    setFormIsDefault(t.is_default);
    setEditingId(t.id);
    setShowForm(true);
  };

  const toggleSection = (section: string) => {
    setFormSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  };

  const handleSave = async () => {
    if (!formName || !formType) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateTemplate(editingId, {
          name: formName,
          report_type: formType,
          description: formDescription || undefined,
          template_body: formBody,
          sections: formSections,
          classification_default: formClassification,
          is_default: formIsDefault,
        });
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTemplate({
          name: formName,
          report_type: formType,
          description: formDescription || undefined,
          template_body: formBody,
          sections: formSections,
          classification_default: formClassification,
          is_default: formIsDefault,
        });
        setTemplates((prev) => [...prev, created]);
      }
      resetForm();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // ignore
    }
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

  const smallBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 6px',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
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
      title="REPORT TEMPLATES"
      headerRight={
        !showForm ? (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-1 py-1 px-2.5 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px] cursor-pointer"
          >
            <Plus size={10} /> ADD TEMPLATE
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        {/* Add/Edit Form */}
        {showForm && (
          <div
            className="p-3 bg-[var(--color-bg)] border border-[var(--color-accent)] rounded-[var(--radius)] flex flex-col gap-2.5"
          >
            <div
              className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-accent)] tracking-[1px]"
            >
              {editingId ? 'EDIT TEMPLATE' : 'NEW TEMPLATE'}
            </div>

            <div className="grid gap-2 grid-cols-2">
              <div>
                <label style={labelStyle}>NAME</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Template name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>REPORT TYPE</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  style={inputStyle}
                >
                  {REPORT_TYPE_OPTIONS.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>DESCRIPTION</label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                style={inputStyle}
              />
            </div>

            <div className="grid gap-2 grid-cols-2">
              <div>
                <label style={labelStyle}>CLASSIFICATION</label>
                <select
                  value={formClassification}
                  onChange={(e) => setFormClassification(e.target.value)}
                  style={inputStyle}
                >
                  {CLASSIFICATION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label
                  className="flex items-center gap-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  DEFAULT TEMPLATE
                </label>
              </div>
            </div>

            <div>
              <label style={labelStyle}>TEMPLATE BODY</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Template body content..."
                rows={4}
                className="min-h-[60px]"
              />
            </div>

            <div>
              <label style={labelStyle}>SECTIONS</label>
              <div
                className="flex flex-wrap gap-1.5 p-2 bg-[var(--color-bg-surface)] rounded-[var(--radius)] border border-[var(--color-border)]"
              >
                {SECTION_OPTIONS.map((section) => (
                  <label
                    key={section}
                    className="flex items-center gap-1 py-[3px] px-2 rounded-[var(--radius)] font-[var(--font-mono)] text-[8px] cursor-pointer tracking-[0.5px]" style={{ backgroundColor: formSections.includes(section)
                        ? 'rgba(59,130,246,0.15)'
                        : 'var(--color-bg)', border: formSections.includes(section)
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--color-border)', color: formSections.includes(section)
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)' }}
                  >
                    <input
                      type="checkbox"
                      checked={formSections.includes(section)}
                      onChange={() => toggleSection(section)}
                      className="w-[10px] h-[10px] accent-[var(--color-accent)]"
                    />
                    {section}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                disabled={saving || !formName}
                className="flex items-center gap-1 py-1.5 px-3.5 rounded-[var(--radius)] font-[var(--font-mono)] text-[9px] font-semibold tracking-[1px]" style={{ backgroundColor: !formName || saving ? 'var(--color-bg-surface)' : 'var(--color-accent)', border: !formName || saving ? '1px solid var(--color-border)' : 'none', color: !formName || saving ? 'var(--color-text-muted)' : 'var(--color-bg)', cursor: !formName || saving ? 'not-allowed' : 'pointer' }}
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

        {/* Template Table */}
        {loading ? (
          <div
            className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] p-4 text-center"
          >
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div
            className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] p-4 text-center"
          >
            No templates configured yet. Click ADD TEMPLATE to create one.
          </div>
        ) : (
          <div className="overflow-auto">
            <table
              className="w-full border-collapse"
            >
              <thead>
                <tr>
                  <th style={thStyle}>NAME</th>
                  <th style={thStyle}>TYPE</th>
                  <th style={thStyle}>CLASSIFICATION</th>
                  <th style={thStyle}>DEFAULT</th>
                  <th style={thStyle}>SECTIONS</th>
                  <th style={thStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-1.5">
                        <FileText
                          size={12}
                          className="text-[var(--color-text-muted)] shrink-0"
                        />
                        <div>
                          <div
                            className="font-semibold text-[var(--color-text-bright)]"
                          >
                            {t.name}
                          </div>
                          {t.description && (
                            <div
                              className="text-[8px] text-[var(--color-text-muted)] mt-px"
                            >
                              {t.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        className="py-0.5 px-1.5 rounded-[var(--radius)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[8px] tracking-[0.5px]"
                      >
                        {t.report_type}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        className="py-0.5 px-1.5 rounded-[var(--radius)] text-[8px] tracking-[0.5px]" style={{ backgroundColor: t.classification_default === 'SECRET' ||
                            t.classification_default === 'TS' ||
                            t.classification_default === 'TS_SCI'
                              ? 'rgba(239,68,68,0.1)'
                              : 'var(--color-bg)', border: t.classification_default === 'SECRET' ||
                            t.classification_default === 'TS' ||
                            t.classification_default === 'TS_SCI'
                              ? '1px solid rgba(239,68,68,0.3)'
                              : '1px solid var(--color-border)', color: t.classification_default === 'SECRET' ||
                            t.classification_default === 'TS' ||
                            t.classification_default === 'TS_SCI'
                              ? 'var(--color-red, #ef4444)'
                              : 'var(--color-text-muted)' }}
                      >
                        {t.classification_default}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {t.is_default && (
                        <span
                          className="py-0.5 px-1.5 rounded-[var(--radius)] bg-[rgba(34,197,94,0.1)] text-[var(--color-green, #22c55e)] text-[8px] tracking-[0.5px]" style={{ border: '1px solid rgba(34,197,94,0.3)' }}
                        >
                          YES
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span className="text-[9px] text-[var(--color-text-muted)]">
                        {t.sections.length} sections
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(t)} style={smallBtnStyle}>
                          <Edit2 size={9} /> EDIT
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-[var(--color-red, #ef4444)]"
                        >
                          <Trash2 size={9} /> DEL
                        </button>
                      </div>
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
