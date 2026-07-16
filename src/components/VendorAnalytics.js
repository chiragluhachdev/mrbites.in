import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { financeAPI, orderAPI } from '../api';
import AdminTrendChart from './AdminTrendChart';
import { rupees, rupeesShort, dayKey } from '../format';
import { ShoppingBag, IndianRupee, TrendingUp, Loader, RefreshCw, Utensils } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
      <Icon size={17} />
    </div>
    <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
    <p className="text-xs text-gray-500 font-semibold mt-0.5">{label}</p>
    {hint && <p className="text-[11px] text-gray-400 font-medium mt-1">{hint}</p>}
  </div>
);

/** Sales trends for the signed-in vendor's own outlet. */
const VendorAnalytics = () => {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState('orders');
  const [trend, setTrend] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (span) => {
    // Build the window locally so buckets line up with the vendor's calendar.
    const buckets = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.push({
        key: dayKey(d),
        label: d.toLocaleDateString('en-IN', span > 7 ? { day: 'numeric' } : { weekday: 'short' }),
        fullLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        orders: 0,
        revenue: 0,
      });
    }

    const [finance, all] = await Promise.all([
      financeAPI.vendor({ from: buckets[0].key, to: buckets[buckets.length - 1].key }),
      // The order list carries item names, which finance deliberately doesn't.
      orderAPI.getByRestaurant(JSON.parse(localStorage.getItem('vendor') || '{}').restaurantId),
    ]);

    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    finance.orders.forEach((o) => {
      const b = byKey[dayKey(o.paidAt)];
      if (!b) return;
      b.orders += 1;
      b.revenue += o.total;
    });

    setTrend(buckets);
    setOrders(all?.orders || []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load(days);
      } catch (err) {
        console.error('Vendor analytics failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [load, days]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load(days);
    } finally {
      setRefreshing(false);
    }
  };

  const totals = useMemo(() => {
    const o = trend.reduce((s, d) => s + d.orders, 0);
    const r = trend.reduce((s, d) => s + d.revenue, 0);
    return { orders: o, revenue: r, aov: o ? r / o : 0 };
  }, [trend]);

  // Best sellers across every order the outlet has, by quantity sold.
  const topItems = useMemo(() => {
    const counts = new Map();
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) =>
        (o.items || []).forEach((i) => {
          const entry = counts.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
          entry.qty += i.qty || 0;
          entry.revenue += (i.price || 0) * (i.qty || 0);
          counts.set(i.name, entry);
        })
      );
    return [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const chartData = useMemo(
    () =>
      trend.map((d) => ({
        label: d.label,
        fullLabel: d.fullLabel,
        value: metric === 'orders' ? d.orders : d.revenue,
      })),
    [trend, metric]
  );

  const maxQty = topItems[0]?.qty || 1;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">How your outlet is performing</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader size={32} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={ShoppingBag}
              label={`Orders · last ${days} days`}
              value={totals.orders}
              tone="text-blue-600 bg-blue-50"
            />
            <StatCard
              icon={IndianRupee}
              label={`Revenue · last ${days} days`}
              value={rupeesShort(totals.revenue)}
              hint="You keep all of it"
              tone="text-brand-600 bg-brand-50"
            />
            <StatCard
              icon={TrendingUp}
              label="Average order value"
              value={rupees(totals.aov)}
              tone="text-purple-600 bg-purple-50"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-bold text-gray-900">
                  {metric === 'orders' ? 'Orders' : 'Revenue'} — last {days} days
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {metric === 'orders' ? 'Paid orders per day' : 'Revenue per day, excluding cancelled'}
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['orders', 'revenue'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                      metric === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <AdminTrendChart data={chartData} format={metric === 'revenue' ? rupeesShort : (v) => v} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best sellers */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <Utensils size={15} className="text-gray-400" />
                <h2 className="font-bold text-gray-900">Best sellers</h2>
                <span className="text-xs text-gray-400 font-medium ml-auto">All time</span>
              </div>
              {topItems.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">No orders yet.</div>
              ) : (
                <ul className="p-4 space-y-3">
                  {topItems.map((item) => (
                    <li key={item.name}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-gray-800 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-gray-500 tabular-nums shrink-0">
                          {item.qty} sold · {rupeesShort(item.revenue)}
                        </span>
                      </div>
                      {/* Bar length is share of the top seller, so the eye can rank at a glance. */}
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-600"
                          style={{ width: `${Math.max((item.qty / maxQty) * 100, 3)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Status */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Order status</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Every order this outlet has received</p>
              </div>
              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">No orders yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {['pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
                    <li key={s} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">{s}</span>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">
                        {statusBreakdown[s] || 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorAnalytics;
