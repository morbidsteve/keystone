import { Package, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { MaintenanceWorkOrder, MaintenancePart } from './types';
import { PartSource, PartStatus, getPartStatusColor } from './types';
import { thStyle, tdStyle, smallBtnStyle, inlineTdInput, inlineTdSelect } from './types';

interface PartFormData {
  partNumber: string;
  nsn: string;
  nomenclature: string;
  quantity: number;
  unitCost: number;
  source: PartSource;
  status: PartStatus;
}

interface WorkOrderPartsProps {
  wo: MaintenanceWorkOrder;
  totalPartsCost: number;
  addingPart: boolean;
  editingPartId: string | null;
  partForm: PartFormData;
  partSaving: boolean;
  onPartFormChange: (form: PartFormData) => void;
  onStartAdd: () => void;
  onStartEdit: (part: MaintenancePart) => void;
  onSave: () => void;
  onCancelAdd: () => void;
  onCancelEdit: () => void;
  onDelete: (partId: string) => void;
}

export default function WorkOrderParts({
  wo,
  totalPartsCost,
  addingPart,
  editingPartId,
  partForm,
  partSaving,
  onPartFormChange,
  onStartAdd,
  onStartEdit,
  onSave,
  onCancelAdd,
  onCancelEdit,
  onDelete,
}: WorkOrderPartsProps) {
  const renderFormRow = (isNew: boolean) => (
    <tr>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={partForm.partNumber} onChange={(e) => onPartFormChange({ ...partForm, partNumber: e.target.value })} placeholder="Part #" />
      </td>
      <td style={tdStyle(true)}>
        <input style={inlineTdInput} value={partForm.nsn} onChange={(e) => onPartFormChange({ ...partForm, nsn: e.target.value })} placeholder="NSN" />
      </td>
      <td style={tdStyle()}>
        <input style={inlineTdInput} value={partForm.nomenclature} onChange={(e) => onPartFormChange({ ...partForm, nomenclature: e.target.value })} placeholder="Name" />
      </td>
      <td style={tdStyle(true, 'right')}>
        <input className="text-right" type="number" min={1} value={partForm.quantity} onChange={(e) => onPartFormChange({ ...partForm, quantity: Number(e.target.value) })} />
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={partForm.source} onChange={(e) => onPartFormChange({ ...partForm, source: e.target.value as PartSource })}>
          {Object.values(PartSource).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </td>
      <td style={tdStyle(true)}>
        <select style={inlineTdSelect} value={partForm.status} onChange={(e) => onPartFormChange({ ...partForm, status: e.target.value as PartStatus })}>
          {Object.values(PartStatus).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </td>
      <td style={tdStyle(true, 'right')}>
        <input className="text-right" type="number" min={0} step={0.01} value={partForm.unitCost} onChange={(e) => onPartFormChange({ ...partForm, unitCost: Number(e.target.value) })} />
      </td>
      <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
        <button style={smallBtnStyle} disabled={partSaving} onClick={onSave} title="Save">
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
        <Package size={10} />
        PARTS ({wo.parts.length})
        <button
          onClick={onStartAdd}
          disabled={addingPart}
          className="border border-[var(--color-border)] rounded-[var(--radius)] py-0.5 px-2 gap-1 inline-flex items-center text-[var(--color-accent)] text-[9px] font-[var(--font-mono)] font-semibold tracking-[0.5px]" style={{ cursor: addingPart ? 'not-allowed' : 'pointer' }}
        >
          <Plus size={9} />
          ADD PART
        </button>
      </div>
      <div
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={thStyle()}>PART #</th>
              <th style={thStyle()}>NSN</th>
              <th style={thStyle()}>NOMENCLATURE</th>
              <th style={thStyle('right')}>QTY</th>
              <th style={thStyle()}>SOURCE</th>
              <th style={thStyle()}>STATUS</th>
              <th style={thStyle('right')}>COST</th>
              <th style={thStyle()}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {wo.parts.map((part) =>
              editingPartId === part.id ? (
                renderFormRow(false)
              ) : (
                <tr key={part.id}>
                  <td style={{ ...tdStyle(true), color: 'var(--color-text-bright)' }}>
                    {part.partNumber}
                  </td>
                  <td className="text-[9px]">
                    {part.nsn || '---'}
                  </td>
                  <td style={tdStyle()}>
                    {part.nomenclature}
                  </td>
                  <td style={tdStyle(true, 'right')}>
                    {part.quantity}
                  </td>
                  <td className="text-[var(--color-text-muted)]">
                    {part.source.replace(/_/g, ' ')}
                  </td>
                  <td style={{ ...tdStyle(true), fontSize: 9, color: getPartStatusColor(part.status) }}>
                    {part.status.replace(/_/g, ' ')}
                  </td>
                  <td style={{ ...tdStyle(true, 'right'), color: 'var(--color-text)' }}>
                    {part.unitCost ? `$${(part.unitCost * part.quantity).toLocaleString()}` : '---'}
                  </td>
                  <td style={{ ...tdStyle(), whiteSpace: 'nowrap' }}>
                    <button style={smallBtnStyle} onClick={() => onStartEdit(part)} title="Edit Part">
                      <Pencil size={11} className="text-[var(--color-accent)]" />
                    </button>
                    <button style={smallBtnStyle} onClick={() => onDelete(part.id)} title="Delete Part">
                      <Trash2 size={11} className="text-[var(--color-danger)]" />
                    </button>
                  </td>
                </tr>
              ),
            )}
            {addingPart && renderFormRow(true)}
            {wo.parts.length === 0 && !addingPart && (
              <tr>
                <td colSpan={8} className="text-[var(--color-text-muted)] py-3 px-2.5">
                  No parts recorded.
                </td>
              </tr>
            )}
          </tbody>
          {wo.parts.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={6}
                  className="font-[var(--font-mono)] text-[9px] font-semibold py-2 px-2.5 text-right text-[var(--color-text-muted)] tracking-[1px]"
                >
                  TOTAL
                </td>
                <td
                  className="font-[var(--font-mono)] text-[11px] font-semibold py-2 px-2.5 text-right text-[var(--color-text-bright)]"
                >
                  ${totalPartsCost.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export type { PartFormData };
