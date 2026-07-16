import React from 'react';
import { X, Phone, Clock, User } from 'lucide-react';
import { rupees, formatDateTime } from '../../format';
import { shortId, STATUS_STYLE, NEXT_ACTION } from './OnlineOrdersPanel';

/** Right-side drawer with the full detail of one online order. */
const OrderDrawer = ({ order, onClose, onAdvance, busy }) => {
  if (!order) return null;
  const action = NEXT_ACTION[order.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Order {shortId(order._id)}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[order.status] || ''}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
              <Clock size={12} /> {formatDateTime(order.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User size={14} className="text-gray-400" /> {order.customer?.name || 'Guest'}
            </p>
            {order.customer?.phone && (
              <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-sm text-brand-700 font-medium mt-1">
                <Phone size={14} className="text-gray-400" /> {order.customer.phone}
              </a>
            )}
            {order.pickupType && (
              <p className="text-xs text-gray-500 font-medium mt-1.5">
                {order.pickupType === 'DINE_IN' ? 'Dine in' : 'Pick up'}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items</p>
            <div className="space-y-2">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-500 text-sm w-6">{it.qty}×</span>
                    <div>
                      <p className="text-sm text-gray-900">{it.name}</p>
                      {(it.modifiers || []).length > 0 && (
                        <p className="text-xs text-brand-700 font-medium">{it.modifiers.map((m) => m.name).join(', ')}</p>
                      )}
                      {it.note && <p className="text-xs text-gray-400 italic">“{it.note}”</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{rupees((it.price || 0) * (it.qty || 0))}</span>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 mb-0.5">Note</p>
              <p className="text-sm text-amber-900">{order.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-lg font-extrabold text-gray-900 tabular-nums">{rupees(order.total)}</span>
          </div>
        </div>

        {action && (
          <div className="p-4 border-t border-gray-200 flex gap-2">
            {order.status === 'pending' && (
              <button
                onClick={() => onAdvance(order._id, 'cancelled')}
                disabled={busy}
                className="px-4 py-3 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                Reject
              </button>
            )}
            <button
              onClick={() => onAdvance(order._id, action.to)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDrawer;
