import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Orders', icon: LayoutDashboard },
  { to: '/finance', label: 'Payments', icon: Wallet },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/** Sidebar shell for vendor.mrbites.in. */
const VendorLayout = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vendor');
      if (stored) setVendor(JSON.parse(stored));
    } catch {
      /* a malformed vendor blob just means no name in the sidebar */
    }
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
        <img src="/image.png" alt="MR Bites" className="w-9 h-9 rounded-lg object-contain bg-brand-50" />
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900 text-sm tracking-tight truncate">MR Bites</p>
          <p className="text-[11px] text-gray-500 font-medium">Vendor Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
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

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
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

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
