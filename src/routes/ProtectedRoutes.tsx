// src/routes/ProtectedRoutes.tsx
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshAccessToken, type UserRole } from '../store/slices/authSlice';
import { Scale, Loader2 } from 'lucide-react';

// ─── Judiciary Loading Viewport ───────────────────────────────────────────────

const FullPageSpinner = () => (
  <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 antialiased">
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-emerald-900/10 border-t-emerald-900 animate-spin" />
        <Scale className="absolute h-6 w-6 text-amber-600" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        <span>Authenticating Session…</span>
      </div>
    </div>
  </div>
);

// ─── 1. RequireAuth ──────────────────────────────────────────────────────────
// Route guard for any authenticated user (admin OR super_admin).

export const RequireAuth = () => {
  const { user, isInitializing } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (isInitializing) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

// ─── 2. RequireRole ──────────────────────────────────────────────────────────
// Restricts access to allowed roles. Designed to be nested or used standalone.

interface RequireRoleProps {
  allow: UserRole[];
}

export const RequireRole = ({ allow }: RequireRoleProps) => {
  const { user } = useAppSelector((s) => s.auth);

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

// ─── 3. Convenience Wrappers ─────────────────────────────────────────────────

/** Route guard for any administrative role (`admin` OR `super_admin`). */
export const RequireAdmin = () => <RequireRole allow={['admin', 'super_admin']} />;

/** Route guard strictly for `super_admin`. */
export const RequireSuperAdmin = () => <RequireRole allow={['super_admin']} />;

// ─── 4. AuthBootstrap ────────────────────────────────────────────────────────
// Top-level provider wrapper that attempts silent refresh token recovery on boot.

export const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { user, accessToken, isInitializing } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // Attempt token recovery only if unauthenticated and initialization is active
    if (!user && !accessToken && isInitializing) {
      dispatch(refreshAccessToken());
    }
  }, [dispatch, user, accessToken, isInitializing]);

  if (isInitializing) return <FullPageSpinner />;

  return <>{children}</>;
};