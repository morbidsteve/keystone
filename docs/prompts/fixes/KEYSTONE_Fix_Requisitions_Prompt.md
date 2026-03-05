# KEYSTONE Requisitions Module — Fix & Enhancement Prompt

**Project**: KEYSTONE USMC Logistics Intelligence System
**Module**: Requisitions Management (Frontend + Backend)
**Priority**: High
**Date**: 2026-03-05

---

## Overview

The KEYSTONE requisitions module requires three critical fixes and enhancements:

1. **Auto-Refresh After Approval** — Fix mutation invalidation so requisitions disappear from PENDING APPROVAL tab immediately
2. **Edit & Comment on Requisitions** — Add full requisition detail view with edit, comment, and audit trail
3. **Requisition Status Lifecycle** — Enable status progression through SUBMITTED → APPROVED → ORDERED → SHIPPED → RECEIVED

**Stack**:
- Frontend: React 18 + TypeScript + Tailwind CSS + TanStack Query + Zustand
- Backend: Python/FastAPI + SQLAlchemy async + PostgreSQL

---

## Issue #1: Auto-Refresh After Approval

### Root Cause
The `ApprovalQueue.tsx` component has inline `invalidateQueries`, but the query key structure may not match what `RequisitionsPage.tsx` uses when fetching requisitions for all three tabs.

### Current Problem
- User clicks "Approve" or "Deny" on a SUBMITTED requisition
- Mutation succeeds, but card doesn't disappear immediately
- User must manually refresh page to see updated state
- After creating a new requisition, the ALL REQUISITIONS tab doesn't auto-update

### Fix Implementation

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/requisitions/ApprovalQueue.tsx`

In `ApprovalCard` component, update the `invalidateAll` function:

```typescript
const invalidateAll = () => {
  // Invalidate ALL query keys that contain "requisitions"
  // This covers: all reqs, pending approval tab, inventory tab
  queryClient.invalidateQueries({
    queryKey: ['requisitions'],
    refetchType: 'all',  // Force refetch, don't just invalidate
  });
  // Also close any confirmation dialogs
  onRefresh?.();
};
```

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/RequisitionsPage.tsx`

Update the requisition fetch query to use a predictable key:

```typescript
const { data: requisitions = [] } = useQuery({
  queryKey: ['requisitions'],  // Single key for all, filters applied in API
  queryFn: () => getRequisitions(filters),
  staleTime: 5000,
  refetchOnWindowFocus: false,
});
```

When creating a new requisition or switching tabs, trigger an immediate refetch:

```typescript
// In CreateRequisitionModal onSuccess
onSuccess: (newReq) => {
  queryClient.invalidateQueries({
    queryKey: ['requisitions'],
    refetchType: 'all',
  });
  // Close modal
}

// When switching tabs, invalidate to show fresh pending count
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  queryClient.invalidateQueries({ queryKey: ['requisitions'] });
};
```

---

## Issue #2: Edit & Comment on Requisitions

### Backend Models & Endpoints

**Add to** `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/requisition.py`:

```python
class RequisitionComment(Base):
    """User comments on a requisition."""
    __tablename__ = "requisition_comments"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(
        Integer,
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="comments")
    user = relationship("User")


class RequisitionEdit(Base):
    """Audit trail of field edits on a requisition."""
    __tablename__ = "requisition_edits"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(
        Integer,
        ForeignKey("requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    field_name = Column(String(100), nullable=False)  # e.g., "quantity", "priority", "justification"
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=False)
    edited_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="edits")
    user = relationship("User")
```

Add relationships to `Requisition` model:

```python
class Requisition(Base):
    # ... existing columns ...

    comments = relationship(
        "RequisitionComment",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )
    edits = relationship(
        "RequisitionEdit",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )
```

**Add to** `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/schemas/requisition.py`:

```python
class RequisitionCommentCreate(BaseModel):
    comment_text: str

class RequisitionCommentOut(BaseModel):
    id: int
    user_id: int
    user_name: str  # Join in endpoint
    comment_text: str
    created_at: datetime

class RequisitionEditOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    field_name: str
    old_value: str | None
    new_value: str
    edited_at: datetime

class RequisitionUpdate(BaseModel):
    quantity_requested: int | None = None
    priority: RequisitionPriority | None = None
    justification: str | None = None
    delivery_location: str | None = None
    # Only allow edits for DRAFT and SUBMITTED status
```

**Add to** `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/requisitions.py`:

```python
from sqlalchemy.orm import Session
from app.models.requisition import Requisition, RequisitionComment, RequisitionEdit
from app.schemas.requisition import RequisitionCommentCreate, RequisitionCommentOut, RequisitionEditOut, RequisitionUpdate
from app.auth import get_current_user

# POST /api/v1/requisitions/{id}/comments
@router.post("/{req_id}/comments", response_model=RequisitionCommentOut)
async def add_comment(
    req_id: int,
    data: RequisitionCommentCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """Add a comment to a requisition (any authorized user)."""
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    comment = RequisitionComment(
        requisition_id=req_id,
        user_id=user.id,
        comment_text=data.comment_text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Fetch user name for response
    comment_user = db.query(User).filter(User.id == comment.user_id).first()
    return RequisitionCommentOut(
        id=comment.id,
        user_id=comment.user_id,
        user_name=comment_user.full_name if comment_user else "Unknown",
        comment_text=comment.comment_text,
        created_at=comment.created_at,
    )

# GET /api/v1/requisitions/{id}/comments
@router.get("/{req_id}/comments", response_model=list[RequisitionCommentOut])
async def list_comments(
    req_id: int,
    db: Session = Depends(get_db),
):
    """Fetch all comments on a requisition (newest first)."""
    comments = db.query(RequisitionComment).filter(
        RequisitionComment.requisition_id == req_id
    ).order_by(RequisitionComment.created_at.desc()).all()

    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        result.append(RequisitionCommentOut(
            id=comment.id,
            user_id=comment.user_id,
            user_name=user.full_name if user else "Unknown",
            comment_text=comment.comment_text,
            created_at=comment.created_at,
        ))
    return result

# PUT /api/v1/requisitions/{id}
@router.put("/{req_id}", response_model=RequisitionOut)
async def update_requisition(
    req_id: int,
    data: RequisitionUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Edit a requisition (DRAFT/SUBMITTED only).
    Authorization: Requester (own only), Approver (any), Admin (any).
    """
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    # Only allow editing DRAFT and SUBMITTED
    if req.status not in [RequisitionStatus.DRAFT, RequisitionStatus.SUBMITTED]:
        raise HTTPException(status_code=400, detail=f"Cannot edit {req.status} requisition")

    # Authorization: requester (own), approver (any), admin (any)
    is_requester = user.id == req.requested_by_id
    is_approver = user.role in ["APPROVER", "ADMIN"]
    if not (is_requester or is_approver):
        raise HTTPException(status_code=403, detail="Not authorized to edit this requisition")

    # Track changes
    edits = []
    if data.quantity_requested is not None and data.quantity_requested != req.quantity_requested:
        edits.append(RequisitionEdit(
            requisition_id=req_id,
            user_id=user.id,
            field_name="quantity_requested",
            old_value=str(req.quantity_requested),
            new_value=str(data.quantity_requested),
        ))
        req.quantity_requested = data.quantity_requested

    if data.priority is not None and data.priority != req.priority:
        edits.append(RequisitionEdit(
            requisition_id=req_id,
            user_id=user.id,
            field_name="priority",
            old_value=req.priority.value,
            new_value=data.priority.value,
        ))
        req.priority = data.priority

    if data.justification is not None and data.justification != req.justification:
        edits.append(RequisitionEdit(
            requisition_id=req_id,
            user_id=user.id,
            field_name="justification",
            old_value=req.justification or "",
            new_value=data.justification,
        ))
        req.justification = data.justification

    if data.delivery_location is not None and data.delivery_location != req.delivery_location:
        edits.append(RequisitionEdit(
            requisition_id=req_id,
            user_id=user.id,
            field_name="delivery_location",
            old_value=req.delivery_location or "",
            new_value=data.delivery_location,
        ))
        req.delivery_location = data.delivery_location

    req.updated_at = func.now()
    db.add_all(edits)
    db.commit()
    db.refresh(req)

    return format_requisition_out(req, db)

# GET /api/v1/requisitions/{id}/history
@router.get("/{req_id}/history", response_model=dict)
async def get_requisition_history(
    req_id: int,
    db: Session = Depends(get_db),
):
    """Fetch full audit trail: status changes + field edits."""
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    status_history = db.query(RequisitionStatusHistory).filter(
        RequisitionStatusHistory.requisition_id == req_id
    ).order_by(RequisitionStatusHistory.changed_at.asc()).all()

    edit_history = db.query(RequisitionEdit).filter(
        RequisitionEdit.requisition_id == req_id
    ).order_by(RequisitionEdit.edited_at.asc()).all()

    # Format status history
    status_items = []
    for item in status_history:
        user = db.query(User).filter(User.id == item.changed_by_id).first()
        status_items.append({
            "type": "STATUS_CHANGE",
            "timestamp": item.changed_at,
            "user_id": item.changed_by_id,
            "user_name": user.full_name if user else "Unknown",
            "from_status": item.from_status.value if item.from_status else None,
            "to_status": item.to_status.value,
            "notes": item.notes,
        })

    # Format edit history
    edit_items = []
    for item in edit_history:
        user = db.query(User).filter(User.id == item.user_id).first()
        edit_items.append({
            "type": "FIELD_EDIT",
            "timestamp": item.edited_at,
            "user_id": item.user_id,
            "user_name": user.full_name if user else "Unknown",
            "field_name": item.field_name,
            "old_value": item.old_value,
            "new_value": item.new_value,
        })

    # Merge and sort by timestamp
    all_history = status_items + edit_items
    all_history.sort(key=lambda x: x["timestamp"])

    return {
        "requisition_id": req_id,
        "status": req.status.value,
        "history": all_history,
    }
```

### Frontend: RequisitionDetail Component

**Create** `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/requisitions/RequisitionDetail.tsx`:

```typescript
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, History, FileText, X, Send, Edit2, Check } from 'lucide-react';
import type { Requisition, RequisitionPriority } from '@/lib/types';
import {
  getRequisition,
  updateRequisition,
  addComment,
  listComments,
  getRequisitionHistory,
} from '@/api/requisitions';

interface RequisitionDetailProps {
  requisitionId: number;
  onClose: () => void;
}

interface CommentType {
  id: number;
  user_id: number;
  user_name: string;
  comment_text: string;
  created_at: string;
}

interface HistoryItem {
  type: 'STATUS_CHANGE' | 'FIELD_EDIT';
  timestamp: string;
  user_id: number;
  user_name: string;
  from_status?: string | null;
  to_status?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
}

export default function RequisitionDetail({ requisitionId, onClose }: RequisitionDetailProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [editMode, setEditMode] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Local form state for editing
  const [editForm, setEditForm] = useState({
    quantity_requested: 0,
    priority: '' as RequisitionPriority,
    justification: '',
    delivery_location: '',
  });

  // Fetch requisition
  const { data: req, isLoading } = useQuery({
    queryKey: ['requisition', requisitionId],
    queryFn: () => getRequisition(requisitionId),
    onSuccess: (data) => {
      setEditForm({
        quantity_requested: data.quantity_requested,
        priority: data.priority,
        justification: data.justification || '',
        delivery_location: data.delivery_location || '',
      });
    },
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['requisition', requisitionId, 'comments'],
    queryFn: () => listComments(requisitionId),
  });

  // Fetch history
  const { data: historyData } = useQuery({
    queryKey: ['requisition', requisitionId, 'history'],
    queryFn: () => getRequisitionHistory(requisitionId),
  });

  // Update requisition mutation
  const updateMut = useMutation({
    mutationFn: () => updateRequisition(requisitionId, editForm),
    onSuccess: () => {
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['requisition', requisitionId] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisition', requisitionId, 'history'] });
    },
  });

  // Add comment mutation
  const commentMut = useMutation({
    mutationFn: () => addComment(requisitionId, { comment_text: newComment }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['requisition', requisitionId, 'comments'] });
    },
  });

  if (isLoading || !req) return <div>Loading...</div>;

  const statusColors = {
    DRAFT: '#999',
    SUBMITTED: '#3b82f6',
    APPROVED: '#10b981',
    DENIED: '#ef4444',
    SOURCING: '#f59e0b',
    BACKORDERED: '#f59e0b',
    SHIPPED: '#8b5cf6',
    RECEIVED: '#10b981',
    CANCELED: '#6b7280',
  };

  const priorityLabel = (p: RequisitionPriority) => {
    if (p === '01') return 'ROUTINE';
    if (p === '02') return 'URGENT';
    if (p === '03') return 'EMERGENCY';
    return `PRI ${p}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: '90%',
        maxWidth: 900,
        maxHeight: '90vh',
        backgroundColor: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}>
              {req.requisition_number}
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}>
              Status: <span style={{ color: statusColors[req.status as keyof typeof statusColors] }}>
                {req.status}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
        }}>
          {['details', 'comments', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: activeTab === tab ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                backgroundColor: activeTab === tab ? 'var(--color-accent)' : 'transparent',
                backgroundColor: activeTab === tab ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab === 'details' && <FileText size={12} style={{ marginRight: 6 }} />}
              {tab === 'comments' && <MessageCircle size={12} style={{ marginRight: 6 }} />}
              {tab === 'history' && <History size={12} style={{ marginRight: 6 }} />}
              {tab === 'details' && 'Details'}
              {tab === 'comments' && 'Comments'}
              {tab === 'history' && 'History'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px',
        }}>
          {activeTab === 'details' && (
            <div>
              {!editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Nomenclature</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>
                        {req.nomenclature}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>NSN</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>
                        {req.nsn || '--'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Quantity Requested</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>
                        {req.quantity_requested} {req.unit_of_issue}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Priority</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>
                        {priorityLabel(req.priority)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Justification</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text)',
                      padding: '8px 10px',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      minHeight: 60,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {req.justification || '(no justification)'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Delivery Location</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)' }}>
                      {req.delivery_location || '--'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['DRAFT', 'SUBMITTED'].includes(req.status) && (
                      <button
                        onClick={() => setEditMode(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          backgroundColor: 'color-mix(in srgb, #3b82f6 10%, transparent)',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Quantity Requested
                    </label>
                    <input
                      type="number"
                      value={editForm.quantity_requested}
                      onChange={(e) => setEditForm({ ...editForm, quantity_requested: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--color-text)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        marginTop: 4,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as RequisitionPriority })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--color-text)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        marginTop: 4,
                      }}
                    >
                      {Array.from({ length: 15 }, (_, i) => {
                        const p = String(i + 1).padStart(2, '0') as RequisitionPriority;
                        return <option key={p} value={p}>{priorityLabel(p)}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Justification
                    </label>
                    <textarea
                      value={editForm.justification}
                      onChange={(e) => setEditForm({ ...editForm, justification: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        marginTop: 4,
                        minHeight: 80,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Delivery Location
                    </label>
                    <input
                      type="text"
                      value={editForm.delivery_location}
                      onChange={(e) => setEditForm({ ...editForm, delivery_location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--color-text)',
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        marginTop: 4,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => updateMut.mutate()}
                      disabled={updateMut.isPending}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#10b981',
                        border: '1px solid #10b981',
                        backgroundColor: 'color-mix(in srgb, #10b981 10%, transparent)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        opacity: updateMut.isPending ? 0.6 : 1,
                      }}
                    >
                      <Check size={11} /> Save
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'transparent',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      commentMut.mutate();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <button
                  onClick={() => commentMut.mutate()}
                  disabled={commentMut.isPending || !newComment.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    backgroundColor: 'color-mix(in srgb, #3b82f6 10%, transparent)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    opacity: commentMut.isPending ? 0.6 : 1,
                  }}
                >
                  <Send size={11} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment: CommentType) => (
                    <div key={comment.id} style={{
                      padding: '10px',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius)',
                      borderLeft: '3px solid var(--color-accent)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--color-text)',
                        }}>
                          {comment.user_name}
                        </span>
                        <span style={{
                          fontSize: 9,
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {comment.comment_text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!historyData || historyData.history.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No history yet
                </p>
              ) : (
                historyData.history.map((item: HistoryItem, idx: number) => (
                  <div key={idx} style={{
                    padding: '10px',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius)',
                    borderLeft: item.type === 'STATUS_CHANGE' ? '3px solid #10b981' : '3px solid #3b82f6',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 600,
                        color: item.type === 'STATUS_CHANGE' ? '#10b981' : '#3b82f6',
                        textTransform: 'uppercase',
                      }}>
                        {item.type === 'STATUS_CHANGE' ? 'Status Change' : 'Field Edit'}
                      </span>
                      <span style={{
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text)',
                    }}>
                      By <strong>{item.user_name}</strong>
                    </p>
                    {item.type === 'STATUS_CHANGE' && (
                      <p style={{
                        margin: '6px 0 0 0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text)',
                      }}>
                        {item.from_status && `${item.from_status} → `}{item.to_status}
                        {item.notes && ` (${item.notes})`}
                      </p>
                    )}
                    {item.type === 'FIELD_EDIT' && (
                      <p style={{
                        margin: '6px 0 0 0',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--color-text)',
                      }}>
                        <strong>{item.field_name}</strong>: {item.old_value} → {item.new_value}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Add API functions to `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/api/requisitions.ts`:

```typescript
export async function addComment(
  id: number,
  data: { comment_text: string },
): Promise<any> {
  if (isDemoMode) {
    await mockDelay();
    return { id: Math.random(), user_id: 10, user_name: 'SSgt Martinez', ...data, created_at: new Date().toISOString() };
  }
  const response = await apiClient.post(`/requisitions/${id}/comments`, data);
  return response.data.data;
}

export async function listComments(id: number): Promise<any[]> {
  if (isDemoMode) {
    await mockDelay();
    return [];
  }
  const response = await apiClient.get(`/requisitions/${id}/comments`);
  return response.data.data;
}

export async function getRequisitionHistory(id: number): Promise<any> {
  if (isDemoMode) {
    await mockDelay();
    return { requisition_id: id, status: 'SUBMITTED', history: [] };
  }
  const response = await apiClient.get(`/requisitions/${id}/history`);
  return response.data.data;
}

export async function updateRequisition(
  id: number,
  data: Partial<Requisition>,
): Promise<Requisition> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_REQUISITIONS.find((r) => r.id === id);
    if (!req) throw new Error(`Requisition ${id} not found`);
    Object.assign(req, data);
    req.updated_at = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.put(`/requisitions/${id}`, data);
  return response.data.data;
}
```

### Integration: Update RequisitionsPage & RequisitionTable

Update `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/RequisitionsPage.tsx` to support opening the detail modal:

```typescript
// Add state at top
const [selectedRequisitionId, setSelectedRequisitionId] = useState<number | null>(null);

// In the render, add the detail modal
{selectedRequisitionId && (
  <RequisitionDetail
    requisitionId={selectedRequisitionId}
    onClose={() => setSelectedRequisitionId(null)}
  />
)}

// Pass click handler to table
<RequisitionTable
  requisitions={filteredReqs}
  onRowClick={(req) => setSelectedRequisitionId(req.id)}
/>
```

Update table row styling to be clickable:

```typescript
// In RequisitionTable component, make rows clickable
<tr
  onClick={() => onRowClick?.(requisition)}
  style={{
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
>
  {/* cells */}
</tr>
```

---

## Issue #3: Requisition Status Updates Through Lifecycle

### Backend Endpoints

**Add to** `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/requisitions.py`:

```python
# Update status progression endpoints
@router.post("/{req_id}/update-status", response_model=RequisitionOut)
async def update_status(
    req_id: int,
    data: RequisitionStatusUpdate,  # new_status, order_number, tracking_info, received_qty, notes
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Update requisition status through its lifecycle.
    Only supply (S-4) staff and admins can update status.
    """
    req = db.query(Requisition).filter(Requisition.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    # Authorization: APPROVER or ADMIN only
    if user.role not in ["APPROVER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only supply staff can update status")

    # Validate status transition
    allowed_transitions = {
        RequisitionStatus.APPROVED: [RequisitionStatus.SOURCING, RequisitionStatus.DENIED],
        RequisitionStatus.SOURCING: [RequisitionStatus.BACKORDERED, RequisitionStatus.SHIPPED],
        RequisitionStatus.BACKORDERED: [RequisitionStatus.SOURCING, RequisitionStatus.SHIPPED],
        RequisitionStatus.SHIPPED: [RequisitionStatus.RECEIVED],
    }

    if req.status not in allowed_transitions or data.new_status not in allowed_transitions.get(req.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {req.status} to {data.new_status}"
        )

    old_status = req.status
    req.status = data.new_status

    # Update timestamps based on new status
    if data.new_status == RequisitionStatus.SHIPPED:
        req.shipped_at = func.now()
        if data.tracking_info:
            # Store tracking info in notes or new field
            req.cancel_reason = data.tracking_info  # Reuse field for demo
    elif data.new_status == RequisitionStatus.RECEIVED:
        req.received_at = func.now()
        req.actual_delivery_date = datetime.date.today()
        if data.received_qty:
            req.quantity_issued = data.received_qty

    req.updated_at = func.now()

    # Log status change in history
    history = RequisitionStatusHistory(
        requisition_id=req_id,
        from_status=old_status,
        to_status=data.new_status,
        changed_by_id=user.id,
        notes=data.notes,
    )
    db.add(history)
    db.commit()
    db.refresh(req)

    return format_requisition_out(req, db)
```

Add schema:

```python
class RequisitionStatusUpdate(BaseModel):
    new_status: RequisitionStatus
    order_number: str | None = None
    tracking_info: str | None = None
    received_qty: int | None = None
    notes: str | None = None
```

### Frontend: Status Stepper in RequisitionDetail

Add status progression section to the detail modal:

```typescript
// In RequisitionDetail, add status progression visualization
const statusFlow = ['SUBMITTED', 'APPROVED', 'SOURCING', 'SHIPPED', 'RECEIVED'];
const currentIdx = statusFlow.indexOf(req.status);

<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '16px 0',
  padding: '12px',
  backgroundColor: 'var(--color-bg)',
  borderRadius: 'var(--radius)',
}}>
  {statusFlow.map((status, idx) => (
    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        backgroundColor: idx < currentIdx ? '#10b981' : idx === currentIdx ? '#3b82f6' : 'var(--color-bg-elevated)',
        color: idx <= currentIdx ? 'white' : 'var(--color-text-muted)',
        border: `1px solid ${idx <= currentIdx ? 'transparent' : 'var(--color-border)'}`,
      }}>
        {idx < currentIdx ? '✓' : idx + 1}
      </div>
      {idx < statusFlow.length - 1 && (
        <div style={{
          width: 20,
          height: 2,
          backgroundColor: idx < currentIdx ? '#10b981' : 'var(--color-border)',
        }} />
      )}
    </div>
  ))}
</div>
```

---

## Testing Checklist

### Manual Testing Steps

**Issue #1 (Auto-Refresh)**:
1. Go to PENDING APPROVAL tab → see requisition card
2. Click APPROVE → enter qty → CONFIRM
3. Card disappears immediately (no page refresh needed)
4. Switch to ALL REQUISITIONS tab → new req appears

**Issue #2 (Edit & Comment)**:
1. Click a requisition row → detail modal opens
2. Click EDIT button (for DRAFT/SUBMITTED only)
3. Change quantity/priority/justification
4. Click SAVE → changes applied, modal closes, requisitions list updates
5. Click same req again → see DETAILS tab with updated values
6. Switch to COMMENTS tab → add comment, verify it appears
7. Switch to HISTORY tab → see status changes and field edits with timestamps

**Issue #3 (Status Lifecycle)**:
1. Admin/S-4 opens APPROVED requisition detail
2. In DETAILS tab, see status stepper: SUBMITTED → APPROVED → SOURCING → SHIPPED → RECEIVED
3. Click "Update Status" button → dropdown with next valid states
4. Select "SHIPPED" → enter tracking info
5. Status changes, timestamps update, history logged
6. Repeat for RECEIVED, verify qty received captured

### Unit Test Checklist (Tester Agent)

**Backend**:
- `go test ./...` in `backend/` — all tests pass
- Test mutation validation: can't edit APPROVED/SHIPPED/RECEIVED
- Test authorization: requester can edit own, approver can edit any, others denied
- Test history logging: every edit creates RequisitionEdit entry with old/new values
- Test status transitions: invalid transitions rejected with 400

**Frontend**:
- `npx vitest run` in `frontend/` — all tests pass
- RequisitionDetail modal opens on row click
- Edit form only shows for DRAFT/SUBMITTED statuses
- Comments add correctly and appear immediately
- History tab displays all status changes and field edits in chronological order
- Approval/deny mutations invalidate correctly

---

## Acceptance Criteria

- [ ] After approve/deny, requisition disappears from PENDING APPROVAL tab without manual page refresh
- [ ] Creating a new requisition shows immediately in ALL REQUISITIONS tab
- [ ] Authorized users can open requisition detail modal and view all fields
- [ ] Edit button visible only for DRAFT and SUBMITTED status
- [ ] Edits trigger history log with field names, old/new values, and timestamp
- [ ] Comment section allows adding/viewing comments with user name and date
- [ ] History tab shows chronological list of all status changes and field edits
- [ ] Status stepper visualizes progression: SUBMITTED → APPROVED → SOURCING → SHIPPED → RECEIVED
- [ ] Supply staff (S-4) can update status to next valid state with order/tracking info
- [ ] All mutations auto-refresh relevant query keys
- [ ] Modal uses fixed centered positioning (not scrollable parent)
- [ ] All modals follow project's monospace typography and color variable styling
- [ ] Authorization checks enforced: requesters, approvers, admins have appropriate access
- [ ] Build passes: `go vet`, `go build`, `npx tsc -b`, `npx vitest run`
- [ ] No security findings in code review (injection, XSS, SSRF, auth bypasses)
- [ ] Smoke tests pass: services healthy, API endpoints respond 200 OK

---

## Files to Create/Modify

### Backend
- `backend/app/models/requisition.py` — add RequisitionComment, RequisitionEdit models + relationships
- `backend/app/schemas/requisition.py` — add comment/edit/status update schemas
- `backend/app/api/requisitions.py` — add comment, history, update endpoints

### Frontend
- `frontend/src/components/requisitions/RequisitionDetail.tsx` — new detail modal with tabs (details/comments/history)
- `frontend/src/components/requisitions/ApprovalQueue.tsx` — fix invalidation logic
- `frontend/src/api/requisitions.ts` — add comment/history/update API functions
- `frontend/src/pages/RequisitionsPage.tsx` — integrate detail modal, fix query key consistency
- `frontend/src/components/requisitions/RequisitionTable.tsx` — make rows clickable

---

## Notes for Developers

1. **Query Key Consistency**: All requisition fetches must use `['requisitions']` as the base key. Filters are applied in the API call, not in the query key structure.

2. **Mutation Invalidation**: Always use `refetchType: 'all'` to force immediate refetch after mutations, not just mark as stale.

3. **Modal Positioning**: Use `position: 'fixed'` with centered overlay pattern already shown in ApprovalQueue examples. Avoid making modals children of scrollable containers.

4. **Authorization Checks**: Use `user.role` to check APPROVER, ADMIN, or requester. Roles come from `get_current_user` dependency.

5. **Timestamps**: Always use `datetime.datetime.now(timezone=UTC)` in Python and `new Date().toISOString()` in TypeScript.

6. **History Logging**: Every field edit should create a RequisitionEdit entry with the user_id, old_value, and new_value. Status changes auto-log via RequisitionStatusHistory.

---

**Created**: 2026-03-05
**Revision**: 1.0
