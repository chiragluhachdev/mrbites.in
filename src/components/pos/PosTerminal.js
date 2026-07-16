import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, StickyNote, Loader, Utensils } from 'lucide-react';
import { rupees } from '../../format';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'other', label: 'Other' },
];

// A cart line's identity: item + the exact options chosen (POS items are usually
// plain, so this is just the item id).
const lineKeyFor = (item) => String(item.id);

/**
 * The 75% counter POS: search + category rail + menu grid on the left, the live
 * bill on the right. Rings up walk-in sales against the existing menu.
 */
const PosTerminal = ({ outletName, sections, loading, onComplete }) => {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [noteFor, setNoteFor] = useState(null); // lineKey whose note field is open
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(() => ['All', ...sections.map((s) => s.title)], [sections]);

  const items = useMemo(() => {
    const all = sections.flatMap((s) => s.data.map((i) => ({ ...i, category: s.title })));
    const q = query.trim().toLowerCase();
    return all.filter(
      (i) =>
        (activeCat === 'All' || i.category === activeCat) &&
        (!q || i.name.toLowerCase().includes(q))
    );
  }, [sections, activeCat, query]);

  const addItem = (item) => {
    const key = lineKeyFor(item);
    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, id: item.id, name: item.name, price: item.price, qty: 1, note: '' }];
    });
  };

  const changeQty = (key, delta) =>
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0)
    );
  const removeLine = (key) => setCart((prev) => prev.filter((l) => l.key !== key));
  const setNote = (key, note) => setCart((prev) => prev.map((l) => (l.key === key ? { ...l, note } : l)));

  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const complete = async () => {
    if (!cart.length || submitting) return;
    setSubmitting(true);
    try {
      await onComplete({
        items: cart.map((l) => ({ itemId: l.id, name: l.name, price: l.price, qty: l.qty, note: l.note || undefined })),
        posPaymentMethod: payment,
        customer: customer.trim() ? { name: customer.trim() } : undefined,
      });
      setCart([]);
      setCustomer('');
      setNoteFor(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex h-full min-w-0">
      {/* Menu side */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Category rail */}
          <div className="w-32 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`w-full text-left px-3 py-3 text-xs font-semibold border-l-2 transition-colors ${
                  activeCat === c
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader className="animate-spin text-brand-600" size={28} />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-20">
                <Utensils size={28} className="mb-2" />
                <p className="text-sm font-medium">No items here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden text-left hover:border-brand-400 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Utensils size={22} />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-sm font-bold text-brand-700 mt-1">{rupees(item.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill side */}
      <div className="w-[340px] shrink-0 border-l border-gray-200 bg-white flex flex-col h-full">
        <div className="shrink-0 px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Current Sale</h2>
          <p className="text-xs text-gray-400 font-medium">{outletName} · counter</p>
        </div>

        <div className="flex-1 flex flex-col min-h-0 justify-start pb-14">
          <div className="shrink min-h-0 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-300 py-10">
                <Utensils size={30} className="mb-2" />
              <p className="text-sm font-medium text-gray-400">Tap items to add them</p>
            </div>
          ) : (
            cart.map((l) => (
              <div key={l.key} className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{l.name}</p>
                    <p className="text-xs text-gray-400">{rupees(l.price)} each</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{rupees(l.price * l.qty)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => changeQty(l.key, -1)} className="w-7 h-7 rounded-md border border-gray-200 bg-white flex items-center justify-center text-brand-600 hover:bg-brand-50">
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                    <button onClick={() => changeQty(l.key, 1)} className="w-7 h-7 rounded-md border border-gray-200 bg-white flex items-center justify-center text-brand-600 hover:bg-brand-50">
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNoteFor(noteFor === l.key ? null : l.key)}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                        l.note ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title="Item note"
                    >
                      <StickyNote size={13} />
                    </button>
                    <button onClick={() => removeLine(l.key)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {noteFor === l.key && (
                  <input
                    autoFocus
                    value={l.note}
                    onChange={(e) => setNote(l.key, e.target.value)}
                    placeholder="e.g. no onion, extra spicy"
                    className="w-full mt-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
                {l.note && noteFor !== l.key && <p className="text-xs text-gray-400 italic mt-1">“{l.note}”</p>}
              </div>
            ))
          )}
        </div>

          {/* Checkout */}
          <div className="shrink-0 border-t border-gray-200 p-3 space-y-3 bg-white">
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payment method</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      payment === m.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">
                Total {count > 0 ? `· ${count} item${count > 1 ? 's' : ''}` : ''}
              </span>
              <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{rupees(total)}</span>
            </div>

            <button
              onClick={complete}
              disabled={!cart.length || submitting}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader size={17} className="animate-spin" /> : `Complete Sale · ${rupees(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosTerminal;
