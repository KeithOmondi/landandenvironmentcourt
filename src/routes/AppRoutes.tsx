// src/routes/AppRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import { RequireAdmin, RequireAuth, RequireSuperAdmin } from './ProtectedRoutes';

import MainLayout from '../components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import Events from '../pages/Events';
import OfficePJ from '../pages/OfficePJ';
import JudgesPage from '../pages/JudgesPage';
import News from '../pages/News';
import Publications from '../pages/Publications';
import Missionandvision from '../pages/Missionandvision';
import HistoryElc from '../pages/HistoryElc';
import Mandj from '../pages/mandj';
import ElcAdvisoryCommittee from '../pages/ElcAdvisoryCommittee';
import OfficeoftheRegistrar from '../pages/OfficeoftheRegistrar';
import ElcDocuments from '../pages/ElcDocuments';
import ContactPage from '../pages/ContactPage';
import ElcRegistry from '../pages/ElcRegistry';

import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
import SuperAdminHero from '../pages/superadmin/SuperAdminHero';
import LoginPage from '../pages/auth/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import SuperAdminLayout from '../component/superadmin/SuperAdminLayout';
import AdminLayout from '../component/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminHero from '../pages/admin/AdminHero';
import SuperAdminNews from '../pages/superadmin/SuperAdminNews';
import AdminNews from '../pages/admin/AdminNews';
import SuperAdminEvents from '../pages/superadmin/SuperAdminEvents';
import AdminEvents from '../pages/admin/AdminEvents';
import SuperAdminPublications from '../pages/superadmin/SuperAdminPublications';
import AdminPublications from '../pages/admin/AdminPublications';
import SuperAdminDocuments from '../pages/superadmin/SuperAdminDocuments';
import AdminDocuments from '../pages/admin/AdminDocuments';
import SuperAdminTributes from '../pages/superadmin/SuperAdminTributes';
import AdminTributes from '../pages/admin/AdminTributes';
import SuperAdminJudges from '../pages/superadmin/SuperAdminJudges';
import AdminJudges from '../pages/admin/AdminJudges';

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC SITE */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="media/events" element={<Events />} />
        <Route path="leadership/principal-judge" element={<OfficePJ />} />
        <Route path="elc-judges" element={<JudgesPage />} />
        <Route path="media/news" element={<News />} />
        <Route path="media/publications" element={<Publications />} />
        <Route path="about/vision" element={<Missionandvision />} />
        <Route path="about/history" element={<HistoryElc />} />
        <Route path="about/mandate" element={<Mandj />} />
        <Route path="leadership/advisory-committee" element={<ElcAdvisoryCommittee />} />
        <Route path="leadership/registrar" element={<OfficeoftheRegistrar />} />
        <Route path="media/documents" element={<ElcDocuments />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="elc-registry" element={<ElcRegistry />} />
      </Route>

      {/* AUTH */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* SUPER ADMIN ROUTE */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireSuperAdmin />}>
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            {/* MUST BE relative path "hero" */}
            <Route path="hero" element={<SuperAdminHero />} />
            <Route path="news" element={<SuperAdminNews />} />
            <Route path="events" element={<SuperAdminEvents />} />
            <Route path="publications" element={<SuperAdminPublications />} />
            <Route path="documents" element={<SuperAdminDocuments />} />
            <Route path="tributes" element={<SuperAdminTributes />} />
            <Route path="judges" element={<SuperAdminJudges />} />

          </Route>
        </Route>
      </Route>




       {/* SUPER ADMIN ROUTE */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            {/* MUST BE relative path "hero" */}
            <Route path="hero" element={<AdminHero />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="publications" element={<AdminPublications />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="tributes" element={<AdminTributes />} />
            <Route path="judges" element={<AdminJudges />} />
          </Route>
        </Route>
      </Route>

      {/* 404 CATCH-ALL */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;