import axios from 'axios';

// Set REACT_APP_API_BASE_URL to point at a deployed backend. Unset, this talks
// to a backend on the machine serving the page — which is what you want in
// development, and what a production build must never rely on.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:4040`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  vendorLogin: async (restaurantId, passkey) => {
    const response = await api.post('/api/auth/vendor-login', { restaurantId, passkey });
    return response.data;
  },
  adminLogin: async (passkey) => {
    const response = await api.post('/api/auth/admin-login', { passkey });
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },
  validateToken: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const restaurantAPI = {
  getAll: async () => {
    const response = await api.get('/api/restaurants');
    return response.data;
  },
  createRestaurant: async (data) => {
    const response = await api.post('/api/restaurants', data);
    return response.data;
  },
  getDetails: async (restaurantId) => {
    const response = await api.get(`/api/restaurants/${restaurantId}`);
    return response.data;
  },
  getMenu: async (restaurantId, includeUnavailable = false) => {
    const response = await api.get(`/api/restaurants/${restaurantId}/menu${includeUnavailable ? '?includeUnavailable=true' : ''}`);
    return response.data;
  },
  addMenuItem: async (restaurantId, item) => {
    const response = await api.post(`/api/restaurants/${restaurantId}/menu/items`, item);
    return response.data;
  },
  updateMenuItem: async (itemId, updates) => {
    const response = await api.put(`/api/restaurants/menu/items/${itemId}`, updates);
    return response.data;
  },
  updateRestaurant: async (id, updates) => {
    const response = await api.put(`/api/restaurants/${id}`, updates);
    return response.data;
  },
  deleteRestaurant: async (id) => {
    const response = await api.delete(`/api/restaurants/${id}`);
    return response.data;
  },
  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

const rangeQuery = (from, to) => {
  const p = new URLSearchParams();
  if (from) p.set('from', from);
  if (to) p.set('to', to);
  const q = p.toString();
  return q ? `?${q}` : '';
};

export const financeAPI = {
  // Vendor tokens are scoped server-side to their own outlet; admins may pass
  // a restaurantId to inspect any of them.
  vendor: async ({ from, to, restaurantId } = {}) => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (restaurantId) p.set('restaurantId', restaurantId);
    const q = p.toString();
    const response = await api.get(`/api/finance/vendor${q ? `?${q}` : ''}`);
    return response.data;
  },
  admin: async ({ from, to } = {}) => {
    const response = await api.get(`/api/finance/admin${rangeQuery(from, to)}`);
    return response.data;
  },
  settle: async (restaurantId) => {
    const response = await api.post('/api/finance/settle', { restaurantId });
    return response.data;
  },
};

export const settingsAPI = {
  get: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },
  update: async (updates) => {
    const response = await api.put('/api/settings', updates);
    return response.data;
  },
};

export const orderAPI = {
  getAll: async () => {
    const response = await api.get('/api/orders');
    return response.data;
  },
  getByRestaurant: async (restaurantId, { source, limit } = {}) => {
    const p = new URLSearchParams();
    if (source) p.set('source', source);
    if (limit) p.set('limit', String(limit));
    const q = p.toString();
    const response = await api.get(`/api/orders/restaurant/${restaurantId}${q ? `?${q}` : ''}`);
    return response.data;
  },
  createPos: async (payload) => {
    const response = await api.post('/api/orders/pos', payload);
    return response.data;
  },
  updateStatus: async (orderId, status) => {
    const response = await api.patch(`/api/orders/${orderId}/status`, { status });
    return response.data;
  },
};

export default api;
