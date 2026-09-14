// src/components/superadmin/SuperAdminLayout.tsx
import { Outlet } from 'react-router-dom';
import SuperAdminHeader from './SuperAdminHeader';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased">
      {/* Sticky Top Navigation */}
      <SuperAdminHeader />

      {/* Main Layout Container */}
      <div className="flex flex-1 items-start">
        {/* Sidebar (Sticky) */}
        <SuperAdminSidebar />

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-6 md:p-8 bg-slate-50/50 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;