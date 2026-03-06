import { Clock, User, MapPin, Calendar, Tag, Wrench, Pencil } from 'lucide-react';
import type { MaintenanceWorkOrder, WorkOrderCategory } from './types';
import { WOCat } from './types';
import {
  sectionLabelStyle,
  valueStyle,
  inputStyle,
  formLabelStyle,
  selectStyle,
  actionBtnStyle,
} from './types';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface WorkOrderInfoProps {
  wo: MaintenanceWorkOrder;
  totalLaborHours: number;
  editMode: boolean;
  editSaving: boolean;
  editDescription: string;
  editPriority: number;
  editAssignedTo: string;
  editLocation: string;
  editCategory: WorkOrderCategory;
  editEstCompletion: string;
  onEditDescription: (v: string) => void;
  onEditPriority: (v: number) => void;
  onEditAssignedTo: (v: string) => void;
  onEditLocation: (v: string) => void;
  onEditCategory: (v: WorkOrderCategory) => void;
  onEditEstCompletion: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export default function WorkOrderInfo({
  wo,
  totalLaborHours,
  editMode,
  editSaving,
  editDescription,
  editPriority,
  editAssignedTo,
  editLocation,
  editCategory,
  editEstCompletion,
  onEditDescription,
  onEditPriority,
  onEditAssignedTo,
  onEditLocation,
  onEditCategory,
  onEditEstCompletion,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: WorkOrderInfoProps) {
  return (
    <>
      {/* Edit toggle */}
      <div className="flex justify-end">
        {!editMode ? (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5"
          >
            <Pencil size={10} />
            EDIT
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={onSaveEdit}
              disabled={editSaving}
              style={actionBtnStyle('var(--color-accent)', 'var(--color-bg)', editSaving)}
            >
              {editSaving ? 'SAVING...' : 'SAVE'}
            </button>
            <button
              onClick={onCancelEdit}
              disabled={editSaving}
              style={{
                ...actionBtnStyle('transparent', 'var(--color-text-muted)'),
                border: '1px solid var(--color-border)',
              }}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {editMode ? (
        <div>
          <label style={formLabelStyle}>DESCRIPTION</label>
          <textarea
            className="resize-y"
            value={editDescription}
            onChange={(e) => onEditDescription(e.target.value)}
          />
        </div>
      ) : (
        wo.description && (
          <div
            className="text-xs text-[var(--color-text)] leading-normal py-2.5 px-3 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            {wo.description}
          </div>
        )
      )}

      {/* Info Grid */}
      {editMode ? (
        <div
          className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
        >
          <div>
            <label style={formLabelStyle}>PRIORITY</label>
            <select
              style={selectStyle}
              value={editPriority}
              onChange={(e) => onEditPriority(Number(e.target.value))}
            >
              <option value={1}>URGENT</option>
              <option value={2}>PRIORITY</option>
              <option value={3}>ROUTINE</option>
            </select>
          </div>
          <div>
            <label style={formLabelStyle}>CATEGORY</label>
            <select
              style={selectStyle}
              value={editCategory}
              onChange={(e) => onEditCategory(e.target.value as WorkOrderCategory)}
            >
              <option value={WOCat.CORRECTIVE}>CORRECTIVE</option>
              <option value={WOCat.PREVENTIVE}>PREVENTIVE</option>
              <option value={WOCat.MODIFICATION}>MODIFICATION</option>
              <option value={WOCat.INSPECTION}>INSPECTION</option>
            </select>
          </div>
          <div>
            <label style={formLabelStyle}>ASSIGNED TO</label>
            <input
              style={inputStyle}
              value={editAssignedTo}
              onChange={(e) => onEditAssignedTo(e.target.value)}
              placeholder="Mechanic name"
            />
          </div>
          <div>
            <label style={formLabelStyle}>LOCATION</label>
            <input
              style={inputStyle}
              value={editLocation}
              onChange={(e) => onEditLocation(e.target.value)}
              placeholder="Bay / Motor Pool"
            />
          </div>
          <div>
            <label style={formLabelStyle}>EST. COMPLETION</label>
            <input
              style={inputStyle}
              type="date"
              value={editEstCompletion}
              onChange={(e) => onEditEstCompletion(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
        >
          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <Tag size={9} />
                Equipment ID
              </span>
            </div>
            <div style={valueStyle}>
              {wo.individualEquipmentId || wo.equipmentId || '---'}
            </div>
          </div>

          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <User size={9} />
                Assigned To
              </span>
            </div>
            <div style={valueStyle}>{wo.assignedTo || '---'}</div>
          </div>

          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <MapPin size={9} />
                Location
              </span>
            </div>
            <div style={valueStyle}>{wo.location || '---'}</div>
          </div>

          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <Calendar size={9} />
                Created
              </span>
            </div>
            <div style={valueStyle}>{formatDate(wo.createdAt)}</div>
          </div>

          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <Clock size={9} />
                Est. Completion
              </span>
            </div>
            <div style={valueStyle}>
              {wo.estimatedCompletion ? formatRelativeTime(wo.estimatedCompletion) : '---'}
            </div>
          </div>

          <div>
            <div style={sectionLabelStyle}>
              <span className="flex items-center gap-1">
                <Wrench size={9} />
                Actual Hours
              </span>
            </div>
            <div style={valueStyle}>{wo.actualHours ?? totalLaborHours}h</div>
          </div>

          {wo.completedAt && (
            <div>
              <div style={sectionLabelStyle}>
                <span className="flex items-center gap-1">
                  <Calendar size={9} />
                  Completed
                </span>
              </div>
              <div style={valueStyle}>{formatDate(wo.completedAt)}</div>
            </div>
          )}

          <div>
            <div style={sectionLabelStyle}>Unit</div>
            <div style={valueStyle}>{wo.unitId}</div>
          </div>
        </div>
      )}
    </>
  );
}
