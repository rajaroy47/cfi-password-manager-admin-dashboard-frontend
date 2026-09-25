import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/clients', label: 'Clients', icon: '👨🏼‍💼' },
  { to: '/credentials', label: 'Credentials', icon: '🔐' },
  { to: '/employees', label: 'Employees', icon: '👩🏻‍💻', adminOnly: true },
  { to: '/services', label: 'Services', icon: '🛠️' },
  { to: '/audit-logs', label: 'Audit Logs', icon: '🧾', adminOnly: true },
  { to: '/security', label: 'Security', icon: '🛡️', adminOnly: true },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-60 shrink-0 bg-ink text-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-md font-bold text-white mt-0.5">CFI Password Manager</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-brand-600/90 text-white font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="w-5 text-center opacity-80">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-sm font-medium text-white">{user?.name}</div>
        <div className="text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Administrator' : 'Staff'}</div>
        <button onClick={logout} className="mt-3 text-xs text-slate-400 hover:text-white underline underline-offset-2">
          Sign out
        </button>
      </div>
    </aside>
  );
}
