// src/components/admin/AdminSidebar.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Image, Settings, Newspaper } from 'lucide-react';
import { GrDocumentStore } from 'react-icons/gr';
import { GiJusticeStar } from 'react-icons/gi';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Hero', path: '/admin/hero', icon: Image, end: false },
  { name: 'News', path: '/admin/news', icon: Newspaper, end: false },
  { name: 'Events', path: '/admin/events', icon: Newspaper, end: false },
  { name: 'Publications', path: '/admin/publications', icon: Newspaper, end: false },
  { name: 'Documents', path: '/admin/documents', icon: GrDocumentStore, end: false },
  { name: 'Judges', path: '/admin/judges', icon: GiJusticeStar, end: false },
  { name: 'Tributes', path: '/admin/tributes', icon: GrDocumentStore, end: false },
  { name: 'Settings', path: '/admin/settings', icon: Settings, end: false },
];

const AdminSidebar = () => {
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-slate-50 border-r border-slate-200 py-4 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Section Header */}
        <div className="px-4 pb-3 mb-2 border-b border-slate-200/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900/60">
            Admin Workspace
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

export default AdminSidebar;