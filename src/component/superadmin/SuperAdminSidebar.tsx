// src/components/superadmin/SuperAdminSidebar.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, Settings, Image, Newspaper } from 'lucide-react';
import { GrDocumentStore } from 'react-icons/gr';

const navItems = [
  { name: 'Dashboard', path: '/super-admin', icon: LayoutDashboard, end: true },
  { name: 'Hero Section', path: '/super-admin/hero', icon: Image, end: true },
  { name: 'News', path: '/super-admin/news', icon: Newspaper, end: true },
  { name: 'Events', path: '/super-admin/events', icon: Newspaper, end: true },
  { name: 'Publications', path: '/super-admin/publications', icon: Newspaper, end: true },
  { name: 'Documents', path: '/super-admin/documents', icon: Newspaper, end: true },
  { name: 'Judges', path: '/super-admin/judges', icon: GrDocumentStore, end: false },
  { name: 'Tributes', path: '/super-admin/tributes', icon: ShieldCheck, end: false },
  { name: 'Users', path: '/super-admin/users', icon: Users, end: false },
  { name: 'Admins', path: '/super-admin/admins', icon: ShieldCheck, end: false },
  { name: 'Settings', path: '/super-admin/settings', icon: Settings, end: false },
];

const SuperAdminSidebar = () => {
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-slate-50 border-r border-slate-200 py-4 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Section Header */}
        <div className="px-4 pb-3 mb-2 border-b border-slate-200/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900/60">
            Super Admin
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 border-l-4 ${
                    isActive
                      ? 'bg-emerald-900/10 text-emerald-900 border-amber-600 font-semibold shadow-sm'
                      : 'text-slate-700 border-transparent hover:bg-slate-200/60 hover:text-emerald-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-amber-600' : 'text-slate-500 group-hover:text-emerald-800'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;