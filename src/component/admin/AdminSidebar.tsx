// src/component/admin/AdminSidebar.tsx
import {
  LayoutDashboard, Image, Newspaper, CalendarDays, BookOpen, FileText,
  Gavel, Landmark, Phone,
} from 'lucide-react';
import SidebarNav, { type NavGroup } from '../SidebarNav';

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Content',
    items: [
      { name: 'Hero', path: '/admin/hero', icon: Image },
      { name: 'News', path: '/admin/news', icon: Newspaper },
      { name: 'Events', path: '/admin/events', icon: CalendarDays },
      { name: 'Publications', path: '/admin/publications', icon: BookOpen },
      { name: 'Documents', path: '/admin/documents', icon: FileText },
    ],
  },
  {
    label: 'People & Offices',
    items: [
      { name: 'Principal Judge', path: '/admin/pj', icon: Landmark },
      { name: 'Judges', path: '/admin/judges', icon: Gavel },
      { name: 'Contacts', path: '/admin/contacts', icon: Phone },
    ],
  },
];

const AdminSidebar = () => <SidebarNav title="Admin Workspace" groups={groups} />;

export default AdminSidebar;
