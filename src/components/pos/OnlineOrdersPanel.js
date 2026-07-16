import React from 'react';
import { Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import { rupees } from '../../format';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700',
  preparing: 'bg-blue-50 text-blue-700',
  ready: 'bg-brand-50 text-brand-700',
  delivered: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-600',
};

// pending → preparing → ready → delivered. Each state offers the one forward action.
const NEXT_ACTION = {
  pending: { to: 'preparing', label: 'Accept' },
  preparing: { to: 'ready', label: 'Mark Ready' },
  ready: { to: 'delivered', label: 'Complete' },
};

const shortId = (id) => `#${String(id || '').slice(-4).toUpperCase()}`;
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

/** Compact live card for one online order. */
const OrderMini = ({ order, onOpen, onAdvance, busy }) => {
  const action = NEXT_ACTION[order.status];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-gray-300 transition-colors">
      <button className="w-full text-left" onClick={() => onOpen(order)}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-gray-900 text-sm">{shortId(order._id)}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[order.status] || STATUS_STYLE.pending}`}>
            {order.status}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-700 mt-1 truncate">
          {order.customer?.name || 'Guest'}
        </p>
        <p className="text-[11px] text-gray-400 truncate">
          {(order.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ') || '—'}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <Clock size={11} /> {timeAgo(order.createdAt)}
          </span>
          <span className="text-sm font-extrabold text-gray-900 tabular-nums">{rupees(order.total)}</span>
        </div>
      </button>

      {action && (
        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={() => onAdvance(order._id, action.to)}
            disabled={busy}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {action.label}
          </button>
          {order.status === 'pending' && (
            <button
              onClick={() => onAdvance(order._id, 'cancelled')}
              disabled={busy}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** The 25% live online-orders rail. */
const OnlineOrdersPanel = ({ orders, onOpen, onAdvance, busyId }) => {
  const live = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const done = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled').slice(0, 8);

  return (
    <aside className="w-[26%] min-w-[280px] max-w-[380px] bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
          </span>
          <h2 className="font-bold text-gray-900 text-sm">Live Online Orders</h2>
        </div>
        <span className="text-xs font-bold text-white bg-brand-600 rounded-full px-2 py-0.5 tabular-nums">
          {live.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {live.length === 0 && done.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16">
            <ShoppingBag size={28} className="mb-2" />
            <p className="text-sm font-medium">No online orders yet</p>
            <p className="text-xs">New orders appear here in real time.</p>
          </div>
        ) : (
          <>
            {live.map((o) => (
              <OrderMini key={o._id} order={o} onOpen={onOpen} onAdvance={onAdvance} busy={busyId === o._id} />
            ))}
            {done.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 pt-2">Recent</p>
                {done.map((o) => (
                  <button
                    key={o._id}
                    onClick={() => onOpen(o)}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-left hover:border-gray-300"
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      {shortId(o._id)} · {o.customer?.name || 'Guest'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      {rupees(o.total)} <ChevronRight size={13} />
                    </span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export { shortId, timeAgo, STATUS_STYLE, NEXT_ACTION };
export default OnlineOrdersPanel;
