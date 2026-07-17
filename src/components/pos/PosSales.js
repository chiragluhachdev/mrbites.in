import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { RefreshCw, Download, Store, Receipt, Wallet, Banknote, Smartphone, CreditCard, MoreHorizontal, User } from 'lucide-react';
import { orderAPI } from '../../api';
import { rupees, rupeesShort, formatDateTime, dayKey, downloadCsv } from '../../format';

// POS money is collected by the vendor at the counter, so this page is purely a
// record of what was rung up — no settlement, no platform cut. It reads the POS
// lane of the shared orders store and never touches the online/settlement side.

const METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];
const methodLabel = (id) => METHODS.find((m) => m.id === id)?.label || 'Other';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'all', label: 'All time' },
];

const PosSales = () => {
  // The server-confirmed vendor from the layout, not the editable localStorage
  // copy — this page exists only for outlets an admin granted POS to.
  const { vendor, resolved } = useOutletContext() || {};
  const restaurantId = vendor?.restaurantId;
  const posEnabled = vendor?.posEnabled === true;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('today');
  const [method, setMethod] = useState('all'); // payment-method filter

  const load = useCallback(async () => {
    if (!restaurantId || !posEnabled) return;
    setLoading(true);
    try {
      const data = await orderAPI.getByRestaurant(restaurantId, { source: 'POS', limit: 200 });
      setOrders(data.orders || []);
    } catch (err) {
      console.error('POS sales load failed', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, posEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  // Range first (today vs all), then the method chip narrows the visible list.
  const inRange = useMemo(() => {
    if (range === 'all') return orders;
    const today = dayKey();
    return orders.filter((o) => dayKey(o.createdAt) === today);
  }, [orders, range]);

  const visible = useMemo(
    () => (method === 'all' ? inRange : inRange.filter((o) => o.posPaymentMethod === method)),
    [inRange, method]
  );

  // Totals + per-method breakdown are always over the selected range (not the
  // method chip) so the chips can show their own share.
  const summary = useMemo(() => {
    const gross = inRange.reduce((s, o) => s + (o.total || 0), 0);
    const byMethod = {};
    METHODS.forEach((m) => (byMethod[m.id] = { count: 0, gross: 0 }));
    inRange.forEach((o) => {
      const k = byMethod[o.posPaymentMethod] ? o.posPaymentMethod : 'other';
      byMethod[k].count += 1;
      byMethod[k].gross += o.total || 0;
    });
    return { gross, count: inRange.length, avg: inRange.length ? gross / inRange.length : 0, byMethod };
  }, [inRange]);

  const exportCsv = () => {
    const rows = visible.map((o) => ({
      id: String(o._id).slice(-6),
      time: formatDateTime(o.createdAt),
      customer: o.customer?.name || '',
      method: methodLabel(o.posPaymentMethod),
      items: (o.items || [])
        .map((it) => {
          const mods = it.modifiers?.length ? ` (${it.modifiers.map((m) => m.name).join(', ')})` : '';
          return `${it.qty}× ${it.name}${mods}`;
        })
        .join('; '),
      total: o.total,
    }));
    downloadCsv(
      `pos-sales-${range}-${dayKey()}.csv`,
      [
        { key: 'id', label: 'Sale' },
        { key: 'time', label: 'Time' },
        { key: 'customer', label: 'Customer' },
        { key: 'method', label: 'Payment' },
        { key: 'items', label: 'Items' },
        { key: 'total', label: 'Total' },
      ],
      rows
    );
  };

  // Access decisions come after every hook — an early return above them would
  // change the hook count between renders and break the component outright.
  //
  // Wait for the server's answer before deciding: acting on the cached flag would
  // either flash this page at an outlet without POS, or bounce one that has it.
  if (!resolved && !vendor) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }
  // Navigating straight to /pos-sales without POS lands back on the dashboard.
  if (resolved && !posEnabled) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-gray-900 tracking-tight leading-tight truncate">POS Sales</h1>
              <p className="text-xs text-gray-400 font-medium">Counter payments · collected by you</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCsv}
              disabled={!visible.length}
              className="p-2 md:px-3 md:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2 text-sm font-semibold"
              title="Export CSV"
            >
              <Download size={16} /> <span className="hidden md:inline">Export</span>
            </button>
            <button
              onClick={load}
              className="p-2 md:px-3 md:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Range toggle */}
        <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 mb-4">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                range === r.id ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <SummaryCard label="Collected" value={rupees(summary.gross)} icon={<Wallet size={16} />} strong />
          <SummaryCard label="Sales" value={summary.count} icon={<Receipt size={16} />} />
          <SummaryCard label="Avg sale" value={rupeesShort(summary.avg)} icon={<Store size={16} />} />
          <SummaryCard
            label="Top method"
            value={
              METHODS.reduce(
                (best, m) => (summary.byMethod[m.id].gross > best.gross ? { id: m.id, gross: summary.byMethod[m.id].gross } : best),
                { id: '—', gross: 0 }
              ).id === '—'
                ? '—'
                : methodLabel(
                    METHODS.reduce(
                      (best, m) => (summary.byMethod[m.id].gross > best.gross ? { id: m.id, gross: summary.byMethod[m.id].gross } : best),
                      { id: 'cash', gross: -1 }
                    ).id
                  )
            }
            icon={<Banknote size={16} />}
          />
        </div>

        {/* Method chips (filter + breakdown) */}
        <div className="flex flex-wrap gap-2 mb-5">
          <MethodChip active={method === 'all'} onClick={() => setMethod('all')} label="All" count={summary.count} gross={summary.gross} />
          {METHODS.map((m) => (
            <MethodChip
              key={m.id}
              active={method === m.id}
              onClick={() => setMethod(m.id)}
              label={m.label}
              icon={m.icon}
              count={summary.byMethod[m.id].count}
              gross={summary.byMethod[m.id].gross}
            />
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Receipt size={30} className="text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-700">No POS sales {range === 'today' ? 'today' : 'yet'}</h3>
            <p className="text-sm text-gray-400 mt-1">Counter sales you complete on the terminal show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((o) => (
              <SaleCard key={o._id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, strong }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
    </div>
    <p className={`tabular-nums ${strong ? 'text-2xl font-extrabold text-gray-900' : 'text-xl font-bold text-gray-800'}`}>{value}</p>
  </div>
);

const MethodChip = ({ active, onClick, label, icon: Icon, count, gross }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
      active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
    }`}
  >
    {Icon && <Icon size={15} />}
    <span>{label}</span>
    <span className="text-xs text-gray-400 tabular-nums">
      {count} · {rupeesShort(gross)}
    </span>
  </button>
);

const SaleCard = ({ order }) => {
  const method = METHODS.find((m) => m.id === order.posPaymentMethod);
  const MethodIcon = method?.icon || MoreHorizontal;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">#{String(order._id).slice(-6)}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
              <MethodIcon size={12} /> {methodLabel(order.posPaymentMethod)}
            </span>
            {order.customer?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                <User size={12} /> {order.customer.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className="text-lg font-extrabold text-gray-900 tabular-nums shrink-0">{rupees(order.total)}</span>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 space-y-1.5">
        {(order.items || []).map((it, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <span className="font-semibold text-gray-800">
                <span className="text-gray-400">{it.qty}×</span> {it.name}
              </span>
              {it.modifiers?.length > 0 && (
                <span className="block text-[11px] text-gray-500 leading-snug">{it.modifiers.map((m) => m.name).join(' · ')}</span>
              )}
              {it.note && <span className="block text-[11px] text-amber-600 italic leading-snug">“{it.note}”</span>}
            </div>
            <span className="text-gray-500 tabular-nums shrink-0">{rupees((it.price || 0) * (it.qty || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PosSales;
