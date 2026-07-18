import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { LogOut, Store, Wallet, BarChart2, Settings as SettingsIcon, Menu, Receipt, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, restaurantAPI, API_BASE_URL } from '../../api';
import { rupees, dayKey } from '../../format';
import PosTerminal from './PosTerminal';
import OnlineOrdersPanel from './OnlineOrdersPanel';
import { useVendorAlarm } from '../../hooks/useVendorAlarm';
import OrderDrawer from './OrderDrawer';

/**
 * Desktop-first split for POS-enabled outlets: the counter POS (≈75%) beside a
 * live online-orders rail (≈25%). The two lanes are handled independently — POS
 * sales post to /orders/pos, online orders stream in over the socket — so
 * neither can be mistaken for the other.
 */
const PosDashboard = ({ vendor, openSidebar }) => {
  const navigate = useNavigate();
  const restaurantId = vendor.restaurantId;

  const [sections, setSections] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [online, setOnline] = useState([]);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [posToday, setPosToday] = useState({ orders: 0, gross: 0 });
  // Tablet only: the online rail is a slide-over below xl. Ignored on desktop,
  // where the rail is always on screen.
  const [onlineOpen, setOnlineOpen] = useState(false);

  const { addUnacknowledged, removeUnacknowledged, playInteractionSound } = useVendorAlarm();

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
      // The IST business day, not the browser's — so this tile agrees with the
      // finance screens and with what the vendor counts at the till.
      const today = dayKey();
      const todays = (data.orders || []).filter((o) => dayKey(o.createdAt) === today);
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
    // The outlet's room carries live customer details, so the server only admits
    // a vendor token for this outlet — hence auth on the handshake.
    const socket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      auth: { token: localStorage.getItem('token') },
    });
    socket.on('connect', () =>
      socket.emit('joinRestaurant', restaurantId, (ack) => {
        if (ack && !ack.ok) console.error('Live orders unavailable:', ack.message);
      })
    );

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
      addUnacknowledged(order._id);
      flashToast(`New online order · ${rupees(order.total)}`);
    });

    socket.on('order.statusChanged', ({ orderId, status }) => {
      setOnline((prev) => prev.map((o) => (String(o._id) === String(orderId) ? { ...o, status } : o)));
      removeUnacknowledged(orderId);
    });

    // The menu can change under the POS (vendor edits items elsewhere).
    socket.on('menu.updated', () => loadMenu());

    return () => socket.disconnect();
  }, [restaurantId, flashToast, loadMenu, addUnacknowledged, removeUnacknowledged]);

  const advance = useCallback(async (orderId, status) => {
    setBusyId(orderId);
    try {
      playInteractionSound(status);
      await orderAPI.updateStatus(orderId, status);
      setOnline((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      setDrawerOrder((d) => (d && d._id === orderId ? { ...d, status } : d));
      removeUnacknowledged(orderId);
    } catch (err) {
      flashToast(err.response?.data?.message || 'Could not update the order');
    } finally {
      setBusyId(null);
    }
  }, [flashToast, playInteractionSound, removeUnacknowledged]);

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
          <button
            onClick={openSidebar}
            className="w-9 h-9 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center"
            aria-label="Open navigation"
            title="Menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">{vendor.name}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">POS Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">POS today</p>
              <p className="font-extrabold text-gray-900 tabular-nums leading-none">
                {rupees(posToday.gross)} <span className="text-xs font-medium text-gray-400">· {posToday.orders}</span>
              </p>
            </div>
            {/* On desktop the rail is visible, so this is just a readout. */}
            <div className="hidden xl:block text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Live online</p>
              <p className="font-extrabold text-brand-700 tabular-nums leading-none">{liveCount}</p>
            </div>
          </div>

          {/* Tablet: the rail is a slide-over, so its count has to be reachable
              and visible here — a new order must never go unnoticed just because
              the screen was too narrow to show the rail. */}
          <button
            onClick={() => setOnlineOpen(true)}
            className="xl:hidden relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs"
            title="Live online orders"
          >
            <ShoppingBag size={15} />
            <span className="hidden sm:inline">Online</span>
            {liveCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {liveCount}
              </span>
            )}
          </button>

          <nav className="flex items-center gap-1">
            <button onClick={() => navigate('/pos-sales')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="POS Sales"><Receipt size={17} /></button>
            <button onClick={() => navigate('/finance')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Payments"><Wallet size={17} /></button>
            <button onClick={() => navigate('/analytics')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Analytics"><BarChart2 size={17} /></button>
            <button onClick={() => navigate('/settings')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Settings"><SettingsIcon size={17} /></button>
            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Sign out"><LogOut size={17} /></button>
          </nav>
        </div>
      </header>

      {/* Split body.
          The terminal always gets the room; the online rail only sits beside it
          from xl up. Below that — an iPad, chiefly — the rail plus the bill plus
          the category strip left the menu grid around 270px, which rendered
          unusable thumbnails. On a tablet the rail becomes a slide-over opened
          from the header instead, so the counter keeps a full-size menu and the
          orders are one tap away. */}
      <div className="flex-1 flex min-h-0">
        <PosTerminal outletName={vendor.name} sections={sections} loading={menuLoading} onComplete={completeSale} />
        <div className="hidden xl:flex w-[26%] min-w-[300px] max-w-[380px] shrink-0">
          <OnlineOrdersPanel 
            orders={online} 
            onOpen={(o) => { removeUnacknowledged(o._id); setDrawerOrder(o); }} 
            onAdvance={advance} 
            busyId={busyId} 
          />
        </div>
      </div>

      {/* Tablet slide-over for the same rail */}
      {onlineOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setOnlineOpen(false)} />
          <div className="relative w-[340px] max-w-[85vw] h-full bg-gray-50 shadow-xl">
            <OnlineOrdersPanel
              orders={online}
              onOpen={(o) => { removeUnacknowledged(o._id); setOnlineOpen(false); setDrawerOrder(o); }}
              onAdvance={advance}
              busyId={busyId}
              onClose={() => setOnlineOpen(false)}
            />
          </div>
        </div>
      )}

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
