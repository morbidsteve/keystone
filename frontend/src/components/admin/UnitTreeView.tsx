import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit3, Trash2 } from 'lucide-react';
import { Echelon, type Unit } from '@/lib/types';
import { ECHELON_ABBREVIATIONS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnitTreeViewProps {
  units: Unit[];
  onAddChild: (parentId: string, parentEchelon: Echelon) => void;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

interface TreeNode extends Unit {
  childNodes: TreeNode[];
  depth: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTree(units: Unit[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const u of units) {
    byId.set(u.id, { ...u, childNodes: [], depth: 0 });
  }

  const roots: TreeNode[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.childNodes.push(node);
    } else {
      roots.push(node);
    }
  }

  // Assign depths recursively
  function assignDepth(node: TreeNode, depth: number) {
    node.depth = depth;
    for (const child of node.childNodes) {
      assignDepth(child, depth + 1);
    }
  }
  for (const root of roots) {
    assignDepth(root, 0);
  }

  return roots;
}

function collectAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  function walk(node: TreeNode) {
    ids.push(node.id);
    for (const child of node.childNodes) walk(child);
  }
  for (const node of nodes) walk(node);
  return ids;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  cursor: 'pointer',
};

const deleteBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  borderColor: 'var(--color-danger)',
  color: 'var(--color-danger)',
};

const controlBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.5px',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// TreeNodeRow
// ---------------------------------------------------------------------------

interface TreeNodeRowProps {
  node: TreeNode;
  expanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onAddChild: (parentId: string, parentEchelon: Echelon) => void;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

function TreeNodeRow({
  node,
  expanded,
  hasChildren,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: TreeNodeRowProps) {
  const [hovered, setHovered] = useState(false);

  const isCustom = node.echelon === Echelon.CUSTOM;
  const abbrev = ECHELON_ABBREVIATIONS[node.echelon] ?? node.echelon;
  const indent = node.depth * 24;

  return (
    <div
      className="flex items-center gap-2 border-b border-b-[var(--color-border)] relative min-h-[36px]" style={{ padding: '6px 12px 6px 0', paddingLeft: indent + 12, backgroundColor: hovered ? 'var(--color-bg-hover)' : 'transparent', transition: 'background-color var(--transition)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Vertical tree line connector for depth > 0 */}
      {node.depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-[var(--color-border)]" style={{ left: indent - 12 }}
        />
      )}

      {/* Horizontal connector line from vertical to node */}
      {node.depth > 0 && (
        <div
          className="absolute w-[10px] h-[1px] bg-[var(--color-border)]" style={{ left: indent - 12, top: '50%' }}
        />
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={hasChildren ? onToggle : undefined}
        className="flex items-center justify-center w-[16px] h-[16px] shrink-0 bg-transparent border-0 p-0" style={{ cursor: hasChildren ? 'pointer' : 'default', color: hasChildren ? 'var(--color-text-muted)' : 'transparent' }}
        tabIndex={hasChildren ? 0 : -1}
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span className="w-[12px] inline-block" />
        )}
      </button>

      {/* Echelon badge */}
      <span
        className="shrink-0 font-[var(--font-mono)] text-[9px] font-bold tracking-[0.5px] py-px px-1.5 rounded-[2px] min-w-[32px] text-center" style={{ border: `1px solid ${isCustom ? 'var(--color-warning)' : 'var(--color-accent)'}`, color: isCustom ? 'var(--color-warning)' : 'var(--color-accent)', backgroundColor: isCustom
            ? 'rgba(250, 176, 5, 0.08)'
            : 'rgba(77, 171, 247, 0.08)' }}
      >
        {abbrev}
      </span>

      {/* Unit name + optional abbreviation */}
      <span
        className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] flex-1 min-w-[0px] overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {node.name}
        {node.abbreviation && (
          <span
            className="font-normal text-[var(--color-text-muted)] text-[11px] ml-1.5"
          >
            ({node.abbreviation})
          </span>
        )}
        {isCustom && node.customEchelonName && (
          <span
            className="text-[var(--color-warning)] text-[10px] font-normal ml-2 italic"
          >
            {node.customEchelonName}
          </span>
        )}
      </span>

      {/* UIC */}
      <span
        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] tracking-[0.5px] shrink-0 mr-3"
      >
        {node.uic}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          style={actionBtnStyle}
          onClick={() => onAddChild(node.id, node.echelon as Echelon)}
          title="Add sub-unit"
        >
          <Plus size={9} /> ADD CHILD
        </button>
        <button
          style={actionBtnStyle}
          onClick={() => onEdit(node)}
          title="Edit unit"
        >
          <Edit3 size={9} /> EDIT
        </button>
        <button
          style={deleteBtnStyle}
          onClick={() => onDelete(node)}
          title="Delete unit"
        >
          <Trash2 size={9} /> DELETE
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UnitTreeView
// ---------------------------------------------------------------------------

export default function UnitTreeView({
  units,
  onAddChild,
  onEdit,
  onDelete,
}: UnitTreeViewProps) {
  const roots = useMemo(() => buildTree(units), [units]);
  const allIds = useMemo(() => collectAllIds(roots), [roots]);
  const rootIds = useMemo(() => roots.map((r) => r.id), [roots]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(rootIds),
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(allIds));
  const collapseAll = () => setExpandedIds(new Set(rootIds));

  // Render tree rows in pre-order
  const rows: React.ReactNode[] = [];

  function renderNode(node: TreeNode) {
    const expanded = expandedIds.has(node.id);
    const hasChildren = node.childNodes.length > 0;

    rows.push(
      <TreeNodeRow
        key={node.id}
        node={node}
        expanded={expanded}
        hasChildren={hasChildren}
        onToggle={() => toggle(node.id)}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    if (expanded && hasChildren) {
      for (const child of node.childNodes) {
        renderNode(child);
      }
    }
  }

  for (const root of roots) {
    renderNode(root);
  }

  if (units.length === 0) {
    return (
      <div
        className="p-6 text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px]"
      >
        No units configured.
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div
        className="flex gap-1.5 py-2 px-3 border-b border-b-[var(--color-border)]"
      >
        <button style={controlBtnStyle} onClick={expandAll}>
          EXPAND ALL
        </button>
        <button style={controlBtnStyle} onClick={collapseAll}>
          COLLAPSE ALL
        </button>
      </div>

      {/* Tree rows */}
      <div>{rows}</div>
    </div>
  );
}
