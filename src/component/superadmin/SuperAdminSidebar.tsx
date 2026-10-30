// src/component/superadmin/SuperAdminSidebar.tsx
import {
  LayoutDashboard, Image, Newspaper, CalendarDays, BookOpen, FileText,
  Gavel, Landmark, Phone, Users, Heart,
} from 'lucide-react';
import SidebarNav, { type NavGroup } from '../SidebarNav';

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/super-admin', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Content',
    items: [
      { name: 'Hero Section', path: '/super-admin/hero', icon: Image },
      { name: 'News', path: '/super-admin/news', icon: Newspaper },
      { name: 'Events', path: '/super-admin/events', icon: CalendarDays },
      { name: 'Publications', path: '/super-admin/publications', icon: BookOpen },
      { name: 'Documents', path: '/super-admin/documents', icon: FileText },
      { name: 'Tributes', path: '/super-admin/tributes', icon: Heart },
    ],
  },
  {
    label: 'People & Offices',
    items: [
      { name: 'Principal Judge', path: '/super-admin/principal-judge', icon: Landmark },
      { name: 'Judges', path: '/super-admin/judges', icon: Gavel },
      { name: 'Contacts', path: '/super-admin/contacts', icon: Phone },
    ],
  },
  {
    label: 'Administration',
    items: [{ name: 'Users & Admins', path: '/super-admin/users', icon: Users }],
  },
];

const SuperAdminSidebar = () => (
  <SidebarNav title="Super Admin Console" groups={groups} />
);

export default SuperAdminSidebar;
