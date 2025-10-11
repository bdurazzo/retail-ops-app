import React, { useEffect, useState } from 'react';
import { OrdersProductFacets } from '../../services/OrdersProductFacets.js';

export default function ProductQuickCard({ title, time, onConfirm }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selected, setSelected] = useState({ skus: new Set(), colors: new Set(), sizes: new Set() });

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setState({ loading: true, error: null, data: null });
        const data = await OrdersProductFacets.summarizeByProductName({ text: title, time });
        if (!abort) setState({ loading: false, error: null, data });
      } catch (e) {
        if (!abort) setState({ loading: false, error: e?.message || 'Failed to summarize', data: null });
      }
    })();
    return () => { abort = true; };
  }, [title, time?.startYYYYMM, time?.endYYYYMM]);

  const toggle = (group, value) => {
    setSelected(prev => {
      const next = { ...prev, [group]: new Set(prev[group]) };
      if (next[group].has(value)) next[group].delete(value); else next[group].add(value);
      return next;
    });
  };

  const selectAll = (group, values) => setSelected(prev => ({ ...prev, [group]: new Set(values) }));
  const clearAll = (group) => setSelected(prev => ({ ...prev, [group]: new Set() }));

  if (state.loading) return <div className="text-xs text-gray-500">Summarizing from orders…</div>;
  if (state.error) return <div className="text-xs text-red-600">{state.error}</div>;
  if (!state.data) return <div className="text-xs text-gray-500">No data.</div>;

  const { title: name, total, skus, colors, sizes } = state.data;

  const emit = () => {
    onConfirm?.({
      title: name,
      skus: Array.from(selected.skus),
      colors: Array.from(selected.colors),
      sizes: Array.from(selected.sizes),
    });
  };

  const List = ({ label, items, group, cap = 16 }) => {
    const values = items.slice(0, cap).map(i => i.value);
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] text-gray-500">{label}</div>
          <div className="flex gap-2">
            <button className="text-[10px] text-blue-600" onClick={() => selectAll(group, values)}>All</button>
            <button className="text-[10px] text-gray-600" onClick={() => clearAll(group)}>None</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[420px]">
          {values.length ? values.map((v, i) => (
            <button
              key={`${group}-${i}`}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${selected[group].has(v) ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
              onClick={() => toggle(group, v)}
              title={`${v}`}
            >
              {v}
            </button>
          )) : <span className="text-[11px] text-gray-400">—</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-3 p-3 border border-gray-200 rounded bg-white">
      <div className="flex-1 space-y-2">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-[11px] text-gray-600">Matches in range: {total}</div>
        <List label="SKUs" items={skus} group="skus" cap={20} />
        <div className="flex gap-6">
          <List label="Colors" items={colors} group="colors" />
          <List label="Sizes" items={sizes} group="sizes" />
        </div>
        <div className="pt-1">
          <button
            className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            onClick={emit}
          >
            Use Selection
          </button>
        </div>
      </div>
    </div>
  );
}

