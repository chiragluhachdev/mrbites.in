import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import VendorLayout from './components/VendorLayout';
import VendorFinance from './components/VendorFinance';
import VendorAnalytics from './components/VendorAnalytics';
import VendorSettings from './components/VendorSettings';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminAnalytics from './components/AdminAnalytics';
import AdminFinance from './components/AdminFinance';
import AdminSettings from './components/AdminSettings';
import { authAPI } from './api';
import { resolvePortal } from './portal';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = role !== null;
  const isAdmin = role === 'admin';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // The server is the authority on role — a stale localStorage value must
        // never be what opens the admin console.
        const data = await authAPI.validateToken();
        const resolved = data?.admin ? 'admin' : data?.vendor ? 'vendor' : 'user';
        setRole(resolved);
        localStorage.setItem('role', resolved);
      } catch (err) {
        // Invalid/expired token: clear it. Network or server error: keep the
        // session so a refresh doesn't sign the user out unnecessarily.
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('vendor');
          localStorage.removeItem('role');
        } else {
          setRole(localStorage.getItem('role') || 'vendor');
        }
      }
    }
    setLoading(false);
  };

  const handleLogin = (nextRole) => {
    setRole(nextRole || 'vendor');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  const portal = resolvePortal();

  const adminRoutes = (
    <>
      <Route index element={<AdminDashboard />} />
      <Route path="finance" element={<AdminFinance />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="analytics" element={<AdminAnalytics />} />
      <Route path="settings" element={<AdminSettings />} />
    </>
  );

  // admin.mrbites.in — the console at the root, nothing else reachable.
  if (portal === 'admin') {
    return (
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={isAdmin ? <Navigate to="/" /> : <Login onLogin={handleLogin} mode="admin" />}
            />
            <Route path="/" element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}>
              {adminRoutes}
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // vendor.mrbites.in — the vendor dashboard only; no admin console in reach.
  if (portal === 'vendor') {
    return (
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} mode="vendor" />}
            />
            <Route element={isAuthenticated ? <VendorLayout /> : <Navigate to="/login" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/finance" element={<VendorFinance />} />
              <Route path="/analytics" element={<VendorAnalytics />} />
              <Route path="/settings" element={<VendorSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // mrbites.in — the public landing page and nothing else. Signing in happens on
  // admin.mrbites.in and vendor.mrbites.in, so there is no second copy of those
  // screens here.
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
