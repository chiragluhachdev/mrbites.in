import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { financeAPI } from '../api';
import { rupees, RANGE_PRESETS, dayKey, formatDay, formatDateTime, downloadCsv } from '../format';
import { exportPdf, exportDoc } from '../report';
import ExportMenu, { EXPORT_ICONS } from './ExportMenu';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Loader,
  Search,
  RefreshCw,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, hint, tone = 'default' }) => {
  const highlight = tone === 'highlight';
  return (
    <div
      className={`rounded-xl p-5 border shadow-sm ${
        highlight ? 'bg-brand-600 border-brand-600' : 'bg-white border-gray-200'
      }`}
    >
      <div className={`flex items-center gap-2 mb-2 ${highlight ? 'text-brand-50' : 'text-gray-500'}`}>
        <Icon size={15} />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      {hint && (
        <p className={`text-xs font-medium mt-1 ${highlight ? 'text-brand-100' : 'text-gray-400'}`}>{hint}</p>
      )}
    </div>
  );
};

/**
 * Collections and what is owed to each outlet.
 *
 * MR-Bites keeps nothing, so there is no commission or profit card: every rupee
 * collected is a rupee owed to a vendor. This screen exists to track which of
 * those rupees have actually been transferred.
 */
const AdminFinance = () => {
  const [range, setRange] = useState({ id: 'today', ...RANGE_PRESETS[0].get() });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settling, setSettling] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (r) => {
    try {
      setError('');
      setData(await financeAPI.admin({ from: r.from, to: r.to }));
    } catch (err) {
      console.error('Admin finance failed', err);
      setError(err.response?.data?.message || 'Could not load finance data.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(range);
      setLoading(false);
    })();
  }, [load, range]);

  const refresh = async () => {
    setRefreshing(true);
    await load(range);
    setRefreshing(false);
  };

  const settle = async (settlement) => {
    const ok = window.confirm(
      `Mark ${rupees(settlement.amount)} as paid to ${settlement.name}?\n\n` +
        `This records ${settlement.orders} order(s) as settled. Transfer the money from your bank first — ` +
        `this does not move any money itself.`
    );
    if (!ok) return;

    setSettling(settlement.restaurantId);
    setNotice('');
    try {
      const res = await financeAPI.settle(settlement.restaurantId);
      setNotice(res.message);
      await load(range);
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record the settlement.');
    } finally {
      setSettling(null);
    }
  };

  const applyPreset = (p) => setRange({ id: p.id, ...p.get() });
  const applyCustom = (patch) => setRange((prev) => ({ ...prev, id: 'custom', ...patch }));

  const orders = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter(
      (o) =>
        o.outlet.toLowerCase().includes(q) ||
        (o.customer?.name || '').toLowerCase().includes(q) ||
        (o.customer?.phone || '').includes(q) ||
        String(o.id).includes(q)
    );
  }, [data, query]);

  const rangeLabel = `${formatDay(range.from)}${range.from !== range.to ? ` – ${formatDay(range.to)}` : ''}`;
  const fileStem = `mrbites-finance-${range.from}${range.from !== range.to ? `_to_${range.to}` : ''}`;

  const csvRows = () =>
    orders.map((o) => ({
      paidAt: new Date(o.paidAt).toLocaleString('en-IN'),
      outlet: o.outlet,
      customerName: o.customer?.name || 'Guest',
      customerPhone: o.customer?.phone || '',
      items: o.items,
      total: o.total,
      status: o.status,
      settlementStatus: o.settlementStatus,
    }));

  const exportCsv = () => {
    downloadCsv(
      `${fileStem}.csv`,
      [
        { key: 'paidAt', label: 'Paid at' },
        { key: 'outlet', label: 'Outlet' },
        { key: 'customerName', label: 'Customer' },
        { key: 'customerPhone', label: 'Phone' },
        { key: 'items', label: 'Items' },
        { key: 'total', label: 'Amount (INR)' },
        { key: 'status', label: 'Order status' },
        { key: 'settlementStatus', label: 'Settlement' },
      ],
      csvRows()
    );
  };

  const buildReport = () => ({
    title: 'Finance Report',
    subtitle: 'Collections and vendor payouts across MR Bites',
    meta: [
      { label: 'Period', value: rangeLabel },
      { label: 'Paid orders', value: String(data?.totals.paidOrders ?? 0) },
    ],
    summary: [
      { label: 'Total collection', value: rupees(data?.totals.collection || 0) },
      { label: 'Payout due', value: rupees(data?.totals.payoutDue || 0) },
      { label: 'Settled payout', value: rupees(data?.totals.settledPayout || 0) },
      { label: 'Avg order value', value: rupees(data?.totals.avgOrderValue || 0) },
      { label: 'MR Bites keeps', value: rupees(0) },
    ],
    columns: [
      { key: 'paidAt', label: 'Paid at' },
      { key: 'outlet', label: 'Outlet' },
      { key: 'customer', label: 'Customer' },
      { key: 'items', label: 'Items', align: 'center' },
      { key: 'settlement', label: 'Settlement', align: 'center' },
      { key: 'amount', label: 'Amount', align: 'right' },
    ],
    rows: orders.map((o) => ({
      paidAt: new Date(o.paidAt).toLocaleString('en-IN'),
      outlet: o.outlet,
      customer: o.customer?.name || 'Guest',
      items: o.items,
      settlement: o.settlementStatus,
      amount: rupees(o.total),
    })),
    note: 'MR Bites charges no commission — every rupee collected is owed to the vendors and settled by bank transfer.',
  });

  const exportItems = [
    { label: 'PDF', icon: EXPORT_ICONS.pdf, onClick: () => exportPdf(buildReport()) },
    { label: 'Word (.doc)', icon: EXPORT_ICONS.doc, onClick: () => exportDoc(fileStem, buildReport()) },
    { label: 'CSV', icon: EXPORT_ICONS.csv, onClick: exportCsv },
  ];

  const totalToPay = data?.settlements.reduce((s, x) => s + x.amount, 0) || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Finance</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Collections and vendor payouts. MR-Bites takes no cut — everything collected is owed onward.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <ExportMenu disabled={!data} items={exportItems} />
        </div>
      </div>

      {/* Range */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-2 flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              range.id === p.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => applyCustom({ from: e.target.value })}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-xs text-gray-400 font-medium">to</span>
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={dayKey()}
            onChange={(e) => applyCustom({ to: e.target.value })}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader size={32} className="animate-spin text-brand-600" />
        </div>
      ) : error && !data ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-semibold">
          {error}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-medium mb-5 px-1">
            Showing {formatDay(range.from)}
            {range.from !== range.to ? ` – ${formatDay(range.to)}` : ''} · {data.totals.paidOrders} paid order
            {data.totals.paidOrders === 1 ? '' : 's'}
          </p>

          {notice && (
            <div className="bg-brand-50 border border-brand-200 text-brand-800 rounded-xl p-3 text-sm font-semibold mb-4">
              {notice}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              icon={IndianRupee}
              label="Total collection"
              value={rupees(data.totals.collection)}
              hint="Paid by students in this period"
            />
            <StatCard icon={ShoppingBag} label="Paid orders" value={data.totals.paidOrders} />
            <StatCard icon={TrendingUp} label="Avg order value" value={rupees(data.totals.avgOrderValue)} />
            <StatCard
              icon={Wallet}
              label="Vendor payout due"
              value={rupees(data.totals.payoutDue)}
              hint="Outstanding across all time"
              tone="highlight"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={CheckCircle2}
              label="Settled payout"
              value={rupees(data.totals.settledPayout)}
              hint="Already transferred to vendors"
            />
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 mb-2">What MR-Bites keeps</p>
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{rupees(0)}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">
                No commission, no fees — students pay the menu price and vendors receive all of it.
              </p>
            </div>
          </div>

          {/* Settlements */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-900">Vendor settlements</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Amounts owed to each outlet. Transfer the money, then mark it paid.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Total to pay</p>
                <p className="text-lg font-extrabold text-gray-900 tabular-nums">{rupees(totalToPay)}</p>
              </div>
            </div>

            {data.settlements.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                No pending settlements — every outlet is paid up.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.settlements.map((s) => (
                  <li key={s.restaurantId} className="px-5 py-4 flex flex-wrap items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <p className="font-bold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {s.orders} unsettled order{s.orders === 1 ? '' : 's'}
                      </p>
                    </div>
                    <p className="text-lg font-extrabold text-gray-900 tabular-nums">{rupees(s.amount)}</p>
                    <button
                      onClick={() => settle(s)}
                      disabled={settling === s.restaurantId}
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center gap-1.5 min-w-[96px] justify-center"
                    >
                      {settling === s.restaurantId ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Mark paid
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Orders */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-gray-900">Orders</h2>
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search outlet, customer or ID..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                {query ? 'No orders match your search.' : 'No paid orders in this range.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Paid at</th>
                      <th className="px-5 py-3 font-semibold">Outlet</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold text-center">Items</th>
                      <th className="px-5 py-3 font-semibold text-center">Settlement</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(o.paidAt)}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">{o.outlet}</td>
                        <td className="px-5 py-3">
                          <p className="text-gray-900">{o.customer?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-400">{o.customer?.phone}</p>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600">{o.items}</td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                              o.settlementStatus === 'settled'
                                ? 'bg-brand-50 text-brand-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {o.settlementStatus === 'settled' ? 'SETTLED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">
                          {rupees(o.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center font-medium mt-6">
            Settlements are manual bank transfers — marking one paid records that you sent it, and moves no
            money on its own.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminFinance;
