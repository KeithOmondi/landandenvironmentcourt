// src/component/SidebarNav.tsx
//
// Shared grouped sidebar for the admin and super-admin workspaces.

import { NavLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const SidebarNav = ({ title, groups }: { title: string; groups: NavGroup[] }) => (
  <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white py-4 flex">
    <div className="mb-2 px-5 pb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">
        {title}
      </span>
    </div>

    <nav className="flex-1 space-y-5 px-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-amber-600 bg-emerald-900/10 font-semibold text-emerald-900'
                        : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-emerald-950'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-emerald-800'
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>

    <div className="mt-4 border-t border-slate-200 px-3 pt-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-emerald-900"
      >
        <ExternalLink className="h-[18px] w-[18px] text-slate-400" />
        View public site
      </a>
    </div>
  </aside>
);

export default SidebarNav;
