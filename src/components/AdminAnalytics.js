import React, { useState, useEffect, useMemo } from 'react';
import { orderAPI } from '../api';
import { Calendar, Loader, IndianRupee, ShoppingBag, Store, ChevronDown, ChevronUp } from 'lucide-react';

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default to today's date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAll();
      setOrders(res?.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by the selected date
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === selectedDate;
    });
  }, [orders, selectedDate]);

  // Compute metrics for the selected date
  const { totalOrders, totalRevenue, restaurantStats } = useMemo(() => {
    let revenue = 0;
    const stats = {};

    filteredOrders.forEach(order => {
      // Treat only completed/pending/preparing orders as revenue? 
      // Usually cancelled orders might be excluded, but let's include all non-cancelled for revenue if status exists.
      // If status isn't reliable, just sum totals. Let's exclude 'cancelled'.
      if (order.status !== 'cancelled') {
        revenue += order.total || 0;
      }

      // Group by restaurant
      const rId = order.restaurantId?._id || order.restaurantId; // depending on populate
      const rName = order.restaurantId?.name || 'Unknown Restaurant';
      
      if (!stats[rId]) {
        stats[rId] = {
          name: rName,
          orderCount: 0,
          revenue: 0,
          orders: []
        };
      }
      
      stats[rId].orderCount += 1;
      if (order.status !== 'cancelled') {
        stats[rId].revenue += order.total || 0;
      }
      stats[rId].orders.push(order);
    });

    return {
      totalOrders: filteredOrders.length,
      totalRevenue: revenue,
      restaurantStats: Object.values(stats).sort((a, b) => b.orderCount - a.orderCount)
    };
  }, [filteredOrders]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 font-medium mt-0.5">Day-wise order details by outlet</p>
      </div>

      <div>

        {/* Controls Row */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 text-gray-700 font-semibold">
            <Calendar size={20} className="text-brand-600" />
            <span>Select Date:</span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
            />
          </div>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-bold transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader size={40} className="animate-spin text-brand-600" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                  <p className="text-3xl font-extrabold text-gray-900">{totalOrders}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <IndianRupee size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-3xl font-extrabold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Restaurant Breakdown */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Store size={20} className="text-gray-500" />
                Restaurant Breakdown
              </h2>
              
              {restaurantStats.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                  No orders found for {selectedDate}.
                </div>
              ) : (
                <div className="space-y-4">
                  {restaurantStats.map((stat, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        onClick={() => setExpandedRestaurant(expandedRestaurant === idx ? null : idx)}
                        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                            {stat.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{stat.name}</h3>
                            <p className="text-xs text-gray-500 font-medium">{stat.orderCount} Orders • ₹{stat.revenue.toFixed(2)} Revenue</p>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {expandedRestaurant === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRestaurant === idx && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Order Details</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                <tr>
                                  <th className="pb-2 px-2 font-semibold">Time</th>
                                  <th className="pb-2 px-2 font-semibold">Customer</th>
                                  <th className="pb-2 px-2 font-semibold">Items</th>
                                  <th className="pb-2 px-2 font-semibold text-right">Total</th>
                                  <th className="pb-2 px-2 font-semibold text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {stat.orders.map(order => (
                                  <tr key={order._id} className="hover:bg-white transition-colors">
                                    <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-3 px-2 font-medium text-gray-900">
                                      {order.customer?.name || 'Guest'}<br/>
                                      <span className="text-xs text-gray-500 font-normal">{order.customer?.phone}</span>
                                    </td>
                                    <td className="py-3 px-2 text-gray-600 max-w-xs truncate">
                                      {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                    </td>
                                    <td className="py-3 px-2 font-bold text-gray-900 text-right">
                                      ₹{order.total}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
