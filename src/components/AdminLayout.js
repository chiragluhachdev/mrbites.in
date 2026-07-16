import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, BarChart2, Users, Settings, LogOut, Menu, X } from 'lucide-react';

// The console is served at the root of admin.mrbites.in.
const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleExit = () => {
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

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold text-sm">
          MB
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900 text-sm tracking-tight truncate">MR Bites</p>
          <p className="text-[11px] text-gray-500 font-medium">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleExit}
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-white border-r border-gray-200 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <span className="font-extrabold text-gray-900 tracking-tight">MR Bites Admin</span>
      </div>

      <main className="lg:pl-60">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
