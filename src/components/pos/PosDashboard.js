import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { LogOut, Store, Wallet, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, restaurantAPI, API_BASE_URL } from '../../api';
import { rupees } from '../../format';
import PosTerminal from './PosTerminal';
import OnlineOrdersPanel from './OnlineOrdersPanel';
import OrderDrawer from './OrderDrawer';

/**
 * Desktop-first split for POS-enabled outlets: the counter POS (≈75%) beside a
 * live online-orders rail (≈25%). The two lanes are handled independently — POS
 * sales post to /orders/pos, online orders stream in over the socket — so
 * neither can be mistaken for the other.
 */
const PosDashboard = ({ vendor }) => {
  const navigate = useNavigate();
  const restaurantId = vendor.restaurantId;

  const [sections, setSections] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [online, setOnline] = useState([]);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [posToday, setPosToday] = useState({ orders: 0, gross: 0 });

  const interacted = useRef(false);
  useEffect(() => {
    const on = () => { interacted.current = true; document.removeEventListener('click', on); };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, []);

  const beep = useCallback(() => {
    if (!interacted.current) return;
    new Audio('/beep.mp3').play().catch(() => {});
  }, []);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load the menu (for the POS grid) and both order lanes.
  const loadMenu = useCallback(async () => {
    try {
      const data = await restaurantAPI.getMenu(restaurantId);
      setSections(data.sections || []);
    } catch (err) {
      console.error('POS menu load failed', err);
    } finally {
      setMenuLoading(false);
    }
  }, [restaurantId]);

  const loadOnline = useCallback(async () => {
    try {
      const data = await orderAPI.getByRestaurant(restaurantId, { source: 'ONLINE', limit: 60 });
      setOnline(data.orders || []);
    } catch (err) {
      console.error('Online orders load failed', err);
    }
  }, [restaurantId]);

  const loadPosTotals = useCallback(async () => {
    try {
      const data = await orderAPI.getByRestaurant(restaurantId, { source: 'POS', limit: 200 });
      const today = new Date().toDateString();
      const todays = (data.orders || []).filter((o) => new Date(o.createdAt).toDateString() === today);
      setPosToday({ orders: todays.length, gross: todays.reduce((s, o) => s + (o.total || 0), 0) });
    } catch (err) {
      console.error('POS totals load failed', err);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadMenu();
    loadOnline();
    loadPosTotals();
  }, [loadMenu, loadOnline, loadPosTotals]);

  // Live online orders.
  useEffect(() => {
    const socket = io(API_BASE_URL, { reconnection: true, reconnectionDelay: 1000 });
    socket.on('connect', () => socket.emit('joinRestaurant', restaurantId));

    socket.on('order.created', (p) => {
      if (!p || p.source === 'POS') return; // online lane only
      const order = {
        _id: p._id || p.orderId,
        items: p.items,
        total: p.total,
        customer: p.customer,
        createdAt: p.createdAt,
        pickupType: p.pickupType,
        status: 'pending',
      };
      setOnline((prev) => (prev.some((o) => o._id === order._id) ? prev : [order, ...prev]));
      flashToast(`New online order · ${rupees(order.total)}`);
      beep();
    });

    socket.on('order.statusChanged', ({ orderId, status }) => {
      setOnline((prev) => prev.map((o) => (String(o._id) === String(orderId) ? { ...o, status } : o)));
    });

    // The menu can change under the POS (vendor edits items elsewhere).
    socket.on('menu.updated', () => loadMenu());

    return () => socket.disconnect();
  }, [restaurantId, beep, flashToast, loadMenu]);

  const advance = useCallback(async (orderId, status) => {
    setBusyId(orderId);
    try {
      await orderAPI.updateStatus(orderId, status);
      setOnline((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      setDrawerOrder((d) => (d && d._id === orderId ? { ...d, status } : d));
    } catch (err) {
      flashToast(err.response?.data?.message || 'Could not update the order');
    } finally {
      setBusyId(null);
    }
  }, [flashToast]);

  const completeSale = useCallback(async (payload) => {
    try {
      const { order } = await orderAPI.createPos({ restaurantId, ...payload });
      flashToast(`POS sale complete · ${rupees(order.total)}`);
      setPosToday((t) => ({ orders: t.orders + 1, gross: t.gross + order.total }));
    } catch (err) {
      flashToast(err.response?.data?.message || 'Sale failed');
      throw err;
    }
  }, [restaurantId, flashToast]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendor');
    localStorage.removeItem('role');
    navigate('/login');
    window.location.reload();
  };

  const liveCount = online.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Slim top bar */}
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-extrabold text-xs">
            MB
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">{vendor.name}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">POS Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">POS today</p>
              <p className="font-extrabold text-gray-900 tabular-nums leading-none">
                {rupees(posToday.gross)} <span className="text-xs font-medium text-gray-400">· {posToday.orders}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Live online</p>
              <p className="font-extrabold text-brand-700 tabular-nums leading-none">{liveCount}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => navigate('/finance')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Payments"><Wallet size={17} /></button>
            <button onClick={() => navigate('/analytics')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Analytics"><BarChart2 size={17} /></button>
            <button onClick={() => navigate('/settings')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Settings"><SettingsIcon size={17} /></button>
            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Sign out"><LogOut size={17} /></button>
          </nav>
        </div>
      </header>

      {/* Split body */}
      <div className="flex-1 flex min-h-0">
        <PosTerminal outletName={vendor.name} sections={sections} loading={menuLoading} onComplete={completeSale} />
        <OnlineOrdersPanel orders={online} onOpen={setDrawerOrder} onAdvance={advance} busyId={busyId} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Store size={15} className="text-brand-300" />
          {toast}
        </div>
      )}

      <OrderDrawer order={drawerOrder} onClose={() => setDrawerOrder(null)} onAdvance={advance} busy={!!busyId} />
    </div>
  );
};

export default PosDashboard;
