import { Trash2, Plus, Package, Search } from 'lucide-react';
import { SupplyClass } from '@/lib/types';
import type { SupplyCatalogItem } from '@/lib/types';
import SupplySelector from '@/components/catalog/SupplySelector';
import type { CargoItem, SupplyRecord } from './types';
import { inputStyle, smallBtnStyle, addBtnStyle, labelStyle } from './types';
import { SectionHeader } from './RouteForm';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CargoManagerProps {
  expanded: boolean;
  onToggle: () => void;
  cargoItems: CargoItem[];
  originSupply: SupplyRecord[];
  onSetCargoItems: React.Dispatch<React.SetStateAction<CargoItem[]>>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CargoManager({
  expanded,
  onToggle,
  cargoItems,
  originSupply,
  onSetCargoItems,
}: CargoManagerProps) {
  return (
    <div>
      <SectionHeader
        title="CARGO MANIFEST"
        expanded={expanded}
        onToggle={onToggle}
        count={cargoItems.length}
      />
      {expanded && (
        <div className="pt-2">
          {cargoItems.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-1 items-center mb-1" style={{ gridTemplateColumns: '100px 1fr 60px 60px 24px' }}
            >
              <select
                value={item.supplyClass}
                onChange={e => {
                  const next = [...cargoItems];
                  next[idx] = { ...next[idx], supplyClass: e.target.value as SupplyClass };
                  onSetCargoItems(next);
                }}
                className="text-[10px]"
              >
                {Object.values(SupplyClass).map(sc => (
                  <option key={sc} value={sc}>
                    CL {sc}
                  </option>
                ))}
              </select>
              <input
                value={item.description}
                onChange={e => {
                  const next = [...cargoItems];
                  next[idx] = { ...next[idx], description: e.target.value };
                  onSetCargoItems(next);
                }}
                placeholder="Description"
                className="text-[10px]"
              />
              <input
                type="number"
                min={0}
                value={item.quantity}
                onChange={e => {
                  const next = [...cargoItems];
                  next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 0 };
                  onSetCargoItems(next);
                }}
                className="text-[10px]"
              />
              <select
                value={item.unit}
                onChange={e => {
                  const next = [...cargoItems];
                  next[idx] = { ...next[idx], unit: e.target.value };
                  onSetCargoItems(next);
                }}
                className="text-[10px]"
              >
                <option value="T">T</option>
                <option value="GAL">GAL</option>
                <option value="EA">EA</option>
                <option value="CASES">CASES</option>
              </select>
              <button
                onClick={() => onSetCargoItems(prev => prev.filter((_, i) => i !== idx))}
                style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onSetCargoItems(prev => [
                ...prev,
                { supplyClass: SupplyClass.I, description: '', quantity: 0, unit: 'EA' },
              ])
            }
            style={{ ...addBtnStyle, marginBottom: 8 }}
          >
            <Plus size={11} /> ADD CARGO
          </button>

          {/* Catalog Lookup */}
          <div
            className="mb-2 p-2 bg-[rgba(77,171,247,0.03)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div className="mb-1">
              <Search size={10} className="align-middle mr-1" />
              CATALOG LOOKUP
            </div>
            <SupplySelector
              value={null}
              onChange={(item: SupplyCatalogItem | null) => {
                if (item) {
                  const scMap: Record<string, SupplyClass> = {
                    I: SupplyClass.I, II: SupplyClass.II, III: SupplyClass.III,
                    IIIA: SupplyClass.IIIA, IV: SupplyClass.IV, V: SupplyClass.V,
                    VI: SupplyClass.VI, VII: SupplyClass.VII, VIII: SupplyClass.VIII,
                    IX: SupplyClass.IX, X: SupplyClass.X,
                  };
                  onSetCargoItems(prev => [
                    ...prev,
                    {
                      supplyClass: scMap[item.supplyClass] || SupplyClass.I,
                      description: item.commonName || item.nomenclature,
                      quantity: 0,
                      unit: item.unitOfIssue === 'GL' ? 'GAL' : item.unitOfIssue === 'CS' || item.unitOfIssue === 'BX' || item.unitOfIssue === 'BD' || item.unitOfIssue === 'CO' || item.unitOfIssue === 'KT' ? 'CASES' : 'EA',
                    },
                  ]);
                }
              }}
              placeholder="Search supply catalog by NSN, name..."
            />
          </div>

          {/* Available at Origin */}
          {originSupply.length > 0 && (
            <div
              className="mt-1 p-2 bg-[rgba(77,171,247,0.05)] border border-[var(--color-border)] rounded-[var(--radius)]"
            >
              <div className="mb-1">
                <Package size={10} className="align-middle mr-1" />
                AVAILABLE AT ORIGIN
              </div>
              {Object.values(SupplyClass).map(sc => {
                const items = originSupply.filter(s => s.supplyClass === sc);
                if (items.length === 0) return null;
                return items.map(s => (
                  <div
                    key={s.id}
                    onClick={() =>
                      onSetCargoItems(prev => [
                        ...prev,
                        { supplyClass: sc, description: s.item, quantity: 0, unit: 'EA' },
                      ])
                    }
                    className="flex justify-between py-0.5 px-1 text-[9px] font-[var(--font-mono)] cursor-pointer text-[var(--color-text-muted)] rounded-[2px]"
                    onMouseEnter={e =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <span>
                      CL {sc}: {s.item}
                    </span>
                    <span>
                      {s.onHand} OH / {s.dos.toFixed(1)} DOS
                    </span>
                  </div>
                ));
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
