import { Wrench, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { MaintenanceWorkOrder, MaintenanceLabor } from './types';
import { LaborType } from './types';
import { thStyle, tdStyle, smallBtnStyle, inlineTdInput, inlineTdSelect } from './types';

interface LaborFormData {
  personnelId: string;
  laborType: LaborType;
  hours: number;
  date: string;
  notes: string;
}

interface WorkOrderLaborProps {
  wo: MaintenanceWorkOrder;
  totalLaborHours: number;
  addingLabor: boolean;
  editingLaborId: string | null;
  laborForm: LaborFormData;
  laborSaving: boolean;
  onLaborFormChange: (form: LaborFormData) => void;
  onStartAdd: () => void;
  onStartEdit: (labor: MaintenanceLabor) => void;
  onSave: () => void;
  onCancelAdd: () => void;
  onCancelEdit: () => void;
  onDelete: (laborId: string) => void;
}

export default function WorkOrderLabor({
  wo,
  totalLaborHours,
  addingLabor,
  editingLaborId,
  laborForm,
  laborSaving,
  onLaborFormChange,
  onStartAdd,
  onStartEdit,
  onSave,
  onCancelAdd,
  onCancelEdit,
  onDelete,
}: WorkOrderLaborProps) {
  const renderFormRow = (isNew: boolean) => (
    <tr>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} type="date" value={laborForm.date} onChange={(e) => onLaborFormChange({ ...laborForm, date: e.target.value })} />
      </td>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={laborForm.personnelId} onChange={(e) => onLaborFormChange({ ...laborForm, personnelId: e.target.value })} placeholder="Personnel ID" />
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={laborForm.laborType} onChange={(e) => onLaborFormChange({ ...laborForm, laborType: e.target.value as LaborType })}>
          {Object.values(LaborType).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td style={tdStyle(true, 'right')}>
        <input className="text-right" type="number" min={0} step={0.5} value={laborForm.hours} onChange={(e) => onLaborFormChange({ ...laborForm, hours: Number(e.target.value) })} />
      </td>
      <td style={tdStyle()}>
        <input style={inlineTdInput} value={laborForm.notes} onChange={(e) => onLaborFormChange({ ...laborForm, notes: e.target.value })} placeholder="Notes" />
      </td>
      <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
        <button style={smallBtnStyle} disabled={laborSaving} onClick={onSave} title="Save">
          <Check size={12} className="text-[var(--color-success)]" />
        </button>
        <button style={smallBtnStyle} onClick={() => { isNew ? onCancelAdd() : onCancelEdit(); }} title="Cancel">
          <X size={12} className="text-[var(--color-danger)]" />
        </button>
      </td>
    </tr>
  );

  return (
    <div>
      <div
        className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5"
      >
        <Wrench size={10} />
        LABOR ({wo.laborEntries.length} entries, {totalLaborHours}h total)
        <button
          onClick={onStartAdd}
          disabled={addingLabor}
          className="border border-[var(--color-border)] rounded-[var(--radius)] py-0.5 px-2 gap-1 inline-flex items-center text-[var(--color-accent)] text-[9px] font-[var(--font-mono)] font-semibold tracking-[0.5px]" style={{ cursor: addingLabor ? 'not-allowed' : 'pointer' }}
        >
          <Plus size={9} />
          ADD LABOR
        </button>
      </div>
      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={thStyle()}>DATE</th>
              <th style={thStyle()}>PERSONNEL</th>
              <th style={thStyle()}>TYPE</th>
              <th style={thStyle('right')}>HOURS</th>
              <th style={thStyle()}>NOTES</th>
              <th style={thStyle()}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {wo.laborEntries.map((labor) =>
              editingLaborId === labor.id ? (
                renderFormRow(false)
              ) : (
                <tr key={labor.id}>
                  <td style={{ ...tdStyle(true), whiteSpace: 'nowrap' }}>
                    {labor.date}
                  </td>
                  <td className="text-[9px]">
                    {labor.personnelId}
                  </td>
                  <td className="uppercase text-[var(--color-text-muted)]">
                    {labor.laborType}
                  </td>
                  <td className="font-semibold">
                    {labor.hours}h
                  </td>
                  <td style={tdStyle()}>
                    {labor.notes || '---'}
                  </td>
                  <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
                    <button style={smallBtnStyle} onClick={() => onStartEdit(labor)} title="Edit Labor">
                      <Pencil size={11} className="text-[var(--color-accent)]" />
                    </button>
                    <button style={smallBtnStyle} onClick={() => onDelete(labor.id)} title="Delete Labor">
                      <Trash2 size={11} className="text-[var(--color-danger)]" />
                    </button>
                  </td>
                </tr>
              ),
            )}
            {addingLabor && renderFormRow(true)}
            {wo.laborEntries.length === 0 && !addingLabor && (
              <tr>
                <td colSpan={6} className="text-[var(--color-text-muted)] py-3 px-2.5">
                  No labor entries recorded.
                </td>
              </tr>
            )}
          </tbody>
          {wo.laborEntries.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  className="font-[var(--font-mono)] text-[9px] font-semibold py-2 px-2.5 text-right text-[var(--color-text-muted)] tracking-[1px]"
                >
                  TOTAL
                </td>
                <td
                  className="font-[var(--font-mono)] text-[11px] font-semibold py-2 px-2.5 text-right text-[var(--color-text-bright)]"
                >
                  {totalLaborHours}h
                </td>
                <td colSpan={2} className="border-b-0" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export type { LaborFormData };
