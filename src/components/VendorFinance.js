import React, { useState, useEffect, useCallback } from 'react';
import { financeAPI } from '../api';
import { rupees, formatDateTime, RANGE_PRESETS, dayKey, formatDay } from '../format';
import { exportPdf, exportDoc } from '../report';
import ExportMenu, { EXPORT_ICONS } from './ExportMenu';
import { IndianRupee, Clock, CheckCircle2, Loader, Landmark, RefreshCw, Info } from 'lucide-react';

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
 * What the vendor is owed and what has been paid across.
 *
 * MR-Bites deducts nothing, so there is no fee card here — gross sales and net
 * earnings are the same number, and saying so once is clearer than showing a
 * "− ₹0" line on every screen.
 */
const VendorFinance = () => {
  const [range, setRange] = useState({ id: 'today', ...RANGE_PRESETS[0].get() });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (r) => {
    try {
      setError('');
      setData(await financeAPI.vendor({ from: r.from, to: r.to }));
    } catch (err) {
      console.error('Vendor finance failed', err);
      setError(err.response?.data?.message || 'Could not load your earnings.');
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

  const applyPreset = (preset) => setRange({ id: preset.id, ...preset.get() });
  const applyCustom = (patch) => setRange((prev) => ({ ...prev, id: 'custom', ...patch }));

  const payout = data?.outlet?.payout;
  const hasPayout = payout && (payout.accountHolder || payout.ifsc);

  const rangeLabel = `${formatDay(range.from)}${range.from !== range.to ? ` – ${formatDay(range.to)}` : ''}`;
  const fileStem = `mrbites-earnings-${range.from}${range.from !== range.to ? `_to_${range.to}` : ''}`;

  const buildReport = () => ({
    title: 'Earnings Report',
    subtitle: data?.outlet?.name || 'Your outlet',
    meta: [
      { label: 'Period', value: rangeLabel },
      { label: 'Paid orders', value: String(data?.sales.orders ?? 0) },
    ],
    summary: [
      { label: 'Sales in period', value: rupees(data?.sales.gross || 0) },
      { label: 'Pending settlement', value: rupees(data?.pendingSettlement.amount || 0) },
      { label: 'Total settled', value: rupees(data?.totalSettled.amount || 0) },
    ],
    columns: [
      { key: 'paidAt', label: 'Paid at' },
      { key: 'customer', label: 'Customer' },
      { key: 'items', label: 'Items', align: 'center' },
      { key: 'settlement', label: 'Settlement', align: 'center' },
      { key: 'amount', label: 'You earn', align: 'right' },
    ],
    rows: (data?.orders || []).map((o) => ({
      paidAt: new Date(o.paidAt).toLocaleString('en-IN'),
      customer: o.customer?.name || 'Guest',
      items: o.items,
      settlement: o.settlementStatus,
      amount: rupees(o.total),
    })),
    note: 'MR Bites takes no commission — you keep the full amount of every order. Payouts are settled by bank transfer.',
  });

  const exportItems = [
    { label: 'PDF', icon: EXPORT_ICONS.pdf, onClick: () => exportPdf(buildReport()) },
    { label: 'Word (.doc)', icon: EXPORT_ICONS.doc, onClick: () => exportDoc(fileStem, buildReport()) },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payments & Earnings</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            How you get paid — MR-Bites takes no commission, so you keep 100% of every order.
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 mb-6 flex flex-wrap items-center gap-2">
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
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-semibold">
          {error}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-medium mb-4">
            Showing {formatDay(range.from)}
            {range.from !== range.to ? ` – ${formatDay(range.to)}` : ''} · {data.sales.orders} paid order
            {data.sales.orders === 1 ? '' : 's'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatCard
              icon={IndianRupee}
              label="Sales in this period"
              value={rupees(data.sales.gross)}
              hint={`${data.sales.orders} paid order${data.sales.orders === 1 ? '' : 's'}`}
            />
            <StatCard
              icon={Clock}
              label="Pending settlement"
              value={rupees(data.pendingSettlement.amount)}
              hint={`${data.pendingSettlement.orders} order${
                data.pendingSettlement.orders === 1 ? '' : 's'
              } awaiting payout`}
              tone="highlight"
            />
            <StatCard
              icon={CheckCircle2}
              label="Total settled"
              value={rupees(data.totalSettled.amount)}
              hint={data.totalSettled.orders ? `${data.totalSettled.orders} orders paid out` : 'Nothing settled yet'}
            />
          </div>

          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info size={18} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-900">How settlement works</p>
              <p className="text-xs text-brand-800 font-medium mt-0.5 leading-relaxed">
                Students and teachers make secure online payments, which are collected in the MR-Bites account. Funds are automatically settled to your registered bank account according to the scheduled payout cycle.
              </p>
            </div>
          </div>

          {/* Order earnings */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Order earnings</h2>
              <span className="text-xs font-semibold text-gray-400">Customer paid → your earnings</span>
            </div>

            {data.orders.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No paid orders in this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Paid at</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold text-center">Items</th>
                      <th className="px-5 py-3 font-semibold text-center">Settlement</th>
                      <th className="px-5 py-3 font-semibold text-right">You earn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(o.paidAt)}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{o.customer?.name || 'Guest'}</p>
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

          {/* Payout account */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <Landmark size={16} className="text-gray-400" />
              <h2 className="font-bold text-gray-900">Payout bank account</h2>
              <span className="text-xs text-gray-400 font-medium ml-auto">Edit in Settings</span>
            </div>

            {hasPayout ? (
              <dl className="divide-y divide-gray-100">
                {[
                  ['Account holder', payout.accountHolder],
                  ['Bank', payout.bankName],
                  ['IFSC', payout.ifsc],
                  ['Account number', payout.accountNumberLast4 ? `•••• ${payout.accountNumberLast4}` : '—'],
                  ['PAN', payout.pan],
                ].map(([label, value]) => (
                  <div key={label} className="px-5 py-3 flex items-center justify-between gap-4">
                    <dt className="text-sm text-gray-500 font-medium">{label}</dt>
                    <dd className="text-sm font-bold text-gray-900 truncate">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500 font-medium">No payout account on file.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add your bank details in Settings so an admin can pay your earnings across.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorFinance;
