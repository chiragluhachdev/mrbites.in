import React, { useMemo, useState } from 'react';
import { X, Check } from 'lucide-react';
import { rupees } from '../../format';

// At the counter only groups that are switched on and still have a sellable
// option are worth asking about — an all-sold-out group would just be a dead end.
const activeGroups = (item) =>
  (item.modifiers || []).filter(
    (g) => g.active !== false && (g.options || []).some((o) => o.available !== false)
  );

/** True when adding this item should pop the customization sheet first. */
export const itemNeedsModifiers = (item) => activeGroups(item).length > 0;

/**
 * The counter-side customization sheet. Mirrors what the customer sees in the
 * app — pick-one / pick-many groups with per-option price deltas — so a POS sale
 * of a customized dish rings up at exactly the same price the app would charge.
 */
const PosModifierPicker = ({ item, onCancel, onAdd }) => {
  const groups = useMemo(() => activeGroups(item), [item]);

  // selected[gi] = array of chosen option indexes within that group.
  const [selected, setSelected] = useState(() => {
    const init = {};
    groups.forEach((g, gi) => {
      const chosen = [];
      (g.options || []).forEach((o, oi) => {
        if (o.available !== false && o.isDefault) chosen.push(oi);
      });
      if (g.type === 'single') {
        // A required single-choice with no marked default lands on the first
        // in-stock option, so the sheet is never in an un-addable state.
        if (chosen.length === 0 && g.required) {
          const first = (g.options || []).findIndex((o) => o.available !== false);
          if (first >= 0) chosen.push(first);
        }
        init[gi] = chosen.slice(0, 1);
      } else {
        init[gi] = chosen;
      }
    });
    return init;
  });

  const toggle = (gi, oi) => {
    const g = groups[gi];
    setSelected((prev) => {
      const cur = prev[gi] || [];
      if (g.type === 'single') {
        // Tapping the chosen one again clears it, unless the group is required.
        if (cur[0] === oi) return { ...prev, [gi]: g.required ? cur : [] };
        return { ...prev, [gi]: [oi] };
      }
      if (cur.includes(oi)) return { ...prev, [gi]: cur.filter((x) => x !== oi) };
      const max = Number(g.max) || 0;
      if (max > 0 && cur.length >= max) return prev; // at the cap — ignore
      return { ...prev, [gi]: [...cur, oi] };
    });
  };

  // The first unmet rule, shown in the footer and blocking Add.
  const problem = useMemo(() => {
    for (let gi = 0; gi < groups.length; gi += 1) {
      const g = groups[gi];
      const cur = selected[gi] || [];
      if (g.type === 'single') {
        if (g.required && cur.length === 0) return `Choose ${g.name}`;
      } else {
        const min = Number(g.min) || 0;
        if (cur.length < min) return `Pick ${min > 1 ? `at least ${min}` : 'at least one'} for ${g.name}`;
      }
    }
    return '';
  }, [groups, selected]);

  const unitPrice = useMemo(() => {
    let p = Number(item.price) || 0;
    groups.forEach((g, gi) => {
      (selected[gi] || []).forEach((oi) => {
        p += Number(g.options[oi].priceDiff) || 0;
      });
    });
    return p;
  }, [groups, selected, item.price]);

  const confirm = () => {
    if (problem) return;
    const modifiers = [];
    groups.forEach((g, gi) => {
      (selected[gi] || []).forEach((oi) => {
        const o = g.options[oi];
        modifiers.push({ group: g.name, name: o.name, priceDiff: Number(o.priceDiff) || 0 });
      });
    });
    onAdd({ modifiers, price: unitPrice });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Head */}
        <div className="shrink-0 flex items-start justify-between px-5 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight truncate">{item.name}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Base {rupees(item.price)}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {groups.map((g, gi) => {
            const cur = selected[gi] || [];
            const hint =
              g.type === 'single'
                ? g.required
                  ? 'Pick one'
                  : 'Pick one (optional)'
                : `Pick ${Number(g.min) || 0}${Number(g.max) ? `–${g.max}` : '+'}`;
            return (
              <div key={gi}>
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">{g.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{hint}</span>
                </div>
                <div className="space-y-1.5">
                  {(g.options || []).map((o, oi) => {
                    const disabled = o.available === false;
                    const on = cur.includes(oi);
                    return (
                      <button
                        key={oi}
                        disabled={disabled}
                        onClick={() => toggle(gi, oi)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          disabled
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : on
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 ${
                            g.type === 'single' ? 'rounded-full' : 'rounded-md'
                          } ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300'}`}
                        >
                          {on && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="flex-1 text-sm font-semibold text-gray-800">
                          {o.name}
                          {disabled && <span className="text-xs font-normal text-gray-400"> · sold out</span>}
                        </span>
                        {Number(o.priceDiff) > 0 && (
                          <span className="text-xs font-bold text-gray-500 tabular-nums">+{rupees(o.priceDiff)}</span>
                        )}
                        {Number(o.priceDiff) < 0 && (
                          <span className="text-xs font-bold text-gray-500 tabular-nums">{rupees(o.priceDiff)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Foot */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-200">
          <button
            onClick={confirm}
            disabled={!!problem}
            className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {problem || `Add · ${rupees(unitPrice)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosModifierPicker;
