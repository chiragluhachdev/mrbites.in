import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI, authAPI, orderAPI } from '../api';
import { dayKey, formatDayKey } from '../format';
import AdminTrendChart from './AdminTrendChart';
import OutletEditor from './OutletEditor';
import {
  Eye,
  EyeOff,
  Plus,
  Store,
  Users,
  Loader,
  RefreshCw,
  IndianRupee,
  ShoppingBag,
  Pencil,
  X,
} from 'lucide-react';

// The business day is an IST day, and `dayKey` in format.js is the one place
// that decides what that means — for the backend too. A second copy here read
// the admin's own machine clock, so an admin travelling would bucket revenue
// into different days than the finance API did.
const localDayKey = dayKey;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metric, setMetric] = useState('orders');
  const [togglingId, setTogglingId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [waitTime, setWaitTime] = useState('10');
  const [rating, setRating] = useState('4.5');
  const [formPasskey, setFormPasskey] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState(null);

  const loadAll = useCallback(async () => {
    const [restaurantsRes, usersRes, ordersRes] = await Promise.allSettled([
      restaurantAPI.getAll(),
      authAPI.getAllUsers(),
      orderAPI.getAll(),
    ]);
    if (restaurantsRes.status === 'fulfilled') setRestaurants(restaurantsRes.value?.restaurants || []);
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value?.users || []);
    if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value?.orders || []);

    const failed = [restaurantsRes, usersRes, ordersRes].filter((r) => r.status === 'rejected');
    if (failed.length) console.error('Some admin data failed to load', failed.map((f) => f.reason));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const { todayOrders, todayRevenue, trend } = useMemo(() => {
    const todayKey = localDayKey(new Date());

    // Seven day buckets, oldest first, including days with no orders.
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key = localDayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
      days.push({
        key,
        label: formatDayKey(key, { weekday: 'short' }),
        fullLabel: formatDayKey(key, { day: 'numeric', month: 'short' }),
        orders: 0,
        revenue: 0,
      });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));

    let todayCount = 0;
    let todayRev = 0;

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const key = localDayKey(order.createdAt);
      const counts = order.status !== 'cancelled';
      const bucket = byKey[key];
      if (bucket) {
        bucket.orders += 1;
        if (counts) bucket.revenue += order.total || 0;
      }
      if (key === todayKey) {
        todayCount += 1;
        if (counts) todayRev += order.total || 0;
      }
    });

    return { todayOrders: todayCount, todayRevenue: todayRev, trend: days };
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

  const openOutlets = restaurants.filter((r) => r.isOpen).length;

  const resetCreateForm = () => {
    setName('');
    setLocation('');
    setImageFile(null);
    setImagePreview('');
    setDescription('');
    setWaitTime('10');
    setRating('4.5');
    setFormPasskey('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !imageFile) {
      alert('Name, location, and image are required.');
      return;
    }
    try {
      setSubmitting(true);
      const uploadRes = await restaurantAPI.uploadImage(imageFile);
      await restaurantAPI.createRestaurant({
        name: name.trim(),
        location: location.trim(),
        image: uploadRes.url,
        description: description.trim(),
        waitTime: Number(waitTime) || 0,
        rating: Number(rating) || 4.5,
        isOpen: true,
        ...(formPasskey && { vendorPasskey: formPasskey }),
      });
      resetCreateForm();
      setCreateOpen(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert('Error creating outlet: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOpenClose = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      await restaurantAPI.updateRestaurant(id, { isOpen: !currentStatus });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert('Could not update status');
    } finally {
      setTogglingId(null);
    }
  };


  const inputClass =
    'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  const kpis = [
    {
      label: 'Orders today',
      value: todayOrders,
      icon: ShoppingBag,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Revenue today',
      value: `₹${todayRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      tone: 'text-brand-600 bg-brand-50',
    },
    {
      label: 'Outlets open',
      value: `${openOutlets}/${restaurants.length}`,
      icon: Store,
      tone: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Registered users',
      value: users.length,
      icon: Users,
      tone: 'text-purple-600 bg-purple-50',
      onClick: () => navigate('/users'),
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Platform activity across all outlets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Add outlet
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader size={32} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {kpis.map(({ label, value, icon: Icon, tone, onClick }) => (
              <div
                key={label}
                onClick={onClick}
                className={`bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm ${
                  onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
                  <Icon size={17} />
                </div>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Trend */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-bold text-gray-900">
                  {metric === 'orders' ? 'Orders' : 'Revenue'} — last 7 days
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {metric === 'orders' ? 'Order count per day' : 'Revenue per day, excluding cancelled'}
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

            <AdminTrendChart
              data={chartData}
              format={metric === 'revenue' ? (v) => `₹${v.toLocaleString('en-IN')}` : (v) => v}
            />
          </div>

          {/* Outlets */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Outlets</h2>
              <span className="text-xs font-semibold text-gray-400">{restaurants.length} total</span>
            </div>

            {restaurants.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">No outlets yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {restaurants.map((r) => (
                  <li key={r._id} className="p-4 sm:px-5 flex flex-wrap items-center gap-4">
                    <img
                      src={r.image}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                    />

                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 truncate">{r.name}</h3>
                        {/* `isOpen` here is the effective state — the API folds
                            in the platform pause and the admin override — so on
                            its own it says an outlet is shut without saying who
                            shut it. The badge below names the cause when it is
                            us, since that is the only one an admin can undo. */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                            r.isOpen ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {r.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                        {r.adminClosed && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-red-50 text-red-600"
                            title={r.adminClosedReason || 'Force closed by MR-Bites'}
                          >
                            PAUSED BY US
                          </span>
                        )}
                        {r.posEnabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-indigo-50 text-indigo-700">
                            POS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{r.location}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        ~{r.waitTime} min wait · ★ {r.rating}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => setEditing(r)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleOpenClose(r._id, r.isOpen)}
                        disabled={togglingId === r._id}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors min-w-[76px] flex justify-center disabled:opacity-60 ${
                          r.isOpen
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            : 'border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100'
                        }`}
                      >
                        {togglingId === r._id ? (
                          <Loader size={14} className="animate-spin" />
                        ) : r.isOpen ? (
                          'Close'
                        ) : (
                          'Open'
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Create outlet */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Add outlet</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="e.g. Nescafe" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} required className={inputClass} placeholder="e.g. Food Court" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  required={!imagePreview}
                  className={inputClass}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-gray-200" />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className={inputClass} placeholder="Brief description..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Wait (min)</label>
                  <input type="number" value={waitTime} onChange={(e) => setWaitTime(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                  <input type="number" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vendor passkey (optional)</label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={formPasskey}
                    onChange={(e) => setFormPasskey(e.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="Leave blank for none"
                  />
                  <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                  {submitting ? <><Loader size={16} className="animate-spin" /> Creating</> : 'Create outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full outlet editor — replaces the old passkey-only modal */}
      {editing && (
        <OutletEditor
          outlet={editing}
          onClose={() => setEditing(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
