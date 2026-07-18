import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, BarChart2, Settings, LogOut, Menu, X, Receipt } from 'lucide-react';
import { authAPI } from '../api';

/** Sidebar shell for vendor.mrbites.in. */
const VendorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  // Whether posEnabled has been confirmed with the server yet. Pages that depend
  // on it wait for this rather than acting on the cached value.
  const [resolved, setResolved] = useState(false);

  // POS-enabled outlets get a dedicated counter-sales section; everyone else
  // never sees it. The dashboard hosts its own header (with the menu button
  // relocated into it), so the shell's top bar would just be a duplicate there.
  const navItems = [
    { to: '/dashboard', label: 'Orders', icon: LayoutDashboard },
    ...(vendor?.posEnabled ? [{ to: '/pos-sales', label: 'POS Sales', icon: Receipt }] : []),
    { to: '/finance', label: 'Payments', icon: Wallet },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];
  // The dashboard is the full-width POS terminal with its own header, so it gets
  // no shell chrome at all. Every other page shows a sidebar: permanent on
  // desktop, a slide-over drawer on mobile.
  const hideChrome = location.pathname === '/dashboard' || location.pathname === '/';

  // Show the cached vendor immediately so the shell doesn't flash empty, then
  // confirm it with the server.
  //
  // The cached copy lives in localStorage, which the vendor can edit — flipping
  // posEnabled there would reveal the POS section to an outlet that was never
  // granted it. Harmless on its own (the API is scoped to their own outlet, so
  // the page would simply be empty), but the flag the UI trusts should be the
  // one the server states, not one the browser holds.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vendor');
      if (stored) setVendor(JSON.parse(stored));
    } catch {
      /* a malformed vendor blob just means no name in the sidebar */
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await authAPI.validateToken();
        if (!cancelled && data?.vendor) {
          setVendor(data.vendor);
          localStorage.setItem('vendor', JSON.stringify(data.vendor));
        }
      } catch {
        /* offline or a blip — keep the cached vendor rather than logging out */
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendor');
    localStorage.removeItem('role');
    navigate('/login');
    window.location.reload();
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4">
        <img src="/weblogo.png" alt="MR Bites" className="w-9 h-9 rounded-lg object-contain bg-brand-50" />
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900 text-sm tracking-tight truncate">MR Bites</p>
          <p className="text-[11px] text-gray-500 font-medium">Vendor Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-200">
        {vendor?.name && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{vendor.name}</p>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wide">VENDOR</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans lg:flex">
      {/* Permanent sidebar on desktop — every chrome page (not the dashboard). */}
      {!hideChrome && (
        <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
          {sidebar}
        </aside>
      )}

      {/* Slide-over drawer for mobile (and the dashboard's own menu button). */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-white border-r border-gray-200 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar — chrome pages only, hidden on desktop where the sidebar lives. */}
        {!hideChrome && (
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span className="font-extrabold text-gray-900 tracking-tight truncate">
              {vendor?.name || 'MR Bites Vendor'}
            </span>
          </div>
        )}

        <main className="flex-1 min-w-0">
          {/* The dashboard hosts the menu button in its own header, so hand it an
              opener. `vendor` is the server-confirmed copy, and `resolved` says
              whether that confirmation has landed — POS Sales waits for it before
              deciding whether it may be shown. */}
          <Outlet context={{ openSidebar: () => setMobileOpen(true), vendor, resolved }} />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
