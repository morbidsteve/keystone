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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 0',
        paddingLeft: indent + 12,
        backgroundColor: hovered ? 'var(--color-bg-hover)' : 'transparent',
        transition: 'background-color var(--transition)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
        minHeight: 36,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Vertical tree line connector for depth > 0 */}
      {node.depth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: indent - 12,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'var(--color-border)',
          }}
        />
      )}

      {/* Horizontal connector line from vertical to node */}
      {node.depth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: indent - 12,
            top: '50%',
            width: 10,
            height: 1,
            backgroundColor: 'var(--color-border)',
          }}
        />
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={hasChildren ? onToggle : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: hasChildren ? 'pointer' : 'default',
          color: hasChildren ? 'var(--color-text-muted)' : 'transparent',
        }}
        tabIndex={hasChildren ? 0 : -1}
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span style={{ width: 12, display: 'inline-block' }} />
        )}
      </button>

      {/* Echelon badge */}
      <span
        style={{
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.5px',
          padding: '1px 5px',
          borderRadius: 2,
          border: `1px solid ${isCustom ? 'var(--color-warning)' : 'var(--color-accent)'}`,
          color: isCustom ? 'var(--color-warning)' : 'var(--color-accent)',
          backgroundColor: isCustom
            ? 'rgba(250, 176, 5, 0.08)'
            : 'rgba(77, 171, 247, 0.08)',
          minWidth: 32,
          textAlign: 'center',
        }}
      >
        {abbrev}
      </span>

      {/* Unit name + optional abbreviation */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-bright)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.name}
        {node.abbreviation && (
          <span
            style={{
              fontWeight: 400,
              color: 'var(--color-text-muted)',
              fontSize: 11,
              marginLeft: 6,
            }}
          >
            ({node.abbreviation})
          </span>
        )}
        {isCustom && node.customEchelonName && (
          <span
            style={{
              fontStyle: 'italic',
              color: 'var(--color-warning)',
              fontSize: 10,
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            {node.customEchelonName}
          </span>
        )}
      </span>

      {/* UIC */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.5px',
          flexShrink: 0,
          marginRight: 12,
        }}
      >
        {node.uic}
      </span>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
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
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}
      >
        No units configured.
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
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
