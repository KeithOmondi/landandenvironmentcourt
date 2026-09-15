// src/App.tsx
//
// Top-level app shell. Owns two things:
//
//   1. Initial session restoration. On mount, if the user is on a
//      protected route, dispatch `refreshAccessToken` once to exchange
//      the HttpOnly refresh cookie for a fresh access token and
//      hydrate `user`. Until that resolves, `isInitializing` is true
//      and protected routes render a spinner.
//
//   2. Public-route short-circuit. Routes in PUBLIC_ROUTES never
//      trigger a refresh, never render the spinner, and never block on
//      auth state. They render immediately.
//
// Why the effect depends on `location.pathname`:
//   - The user can log in, land on a protected route, and then
//     navigate to `/login`. We don't want to re-dispatch a refresh on
//     that navigation — the `hasDispatched` ref guards against it.
//   - The user can also land on `/login`, log in, and get redirected
//     to a protected route. The effect re-runs because `isPublic` and
//     `location.pathname` changed, and this time it dispatches the
//     refresh (which is now unnecessary because we just logged in, but
//     harmless — the cookie is fresh and the refresh returns a new
//     access token).
//
// Removing '/orhc-form' from PUBLIC_ROUTES:
//   - `/orhc-form` used to be a public route. If it still exists and
//     is meant to be public, restore it in PUBLIC_ROUTES. If it has
//     been removed or should require auth, no other change is needed.

import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store/store';
import { refreshAccessToken, setInitializationComplete } from './store/slices/authSlice';
import AppRoutes from './routes/AppRoutes';

const PUBLIC_ROUTES = ['/login', '/unauthorized'];

const AppInner: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const isInitializing = useSelector((state: RootState) => state.auth.isInitializing);

  // Guards the refresh dispatch so it fires exactly once per mount,
  // regardless of how many times the effect re-runs due to location
  // or isPublic changes.
  const hasDispatched = useRef(false);

  const isPublic = PUBLIC_ROUTES.some((route) =>
    location.pathname.startsWith(route),
  );

  useEffect(() => {
    if (isPublic) {
      // Public routes don't need a session. Mark initialization
      // complete so a subsequent navigation to a protected route
      // doesn't briefly render a spinner for a refresh that's already
      // been skipped.
      dispatch(setInitializationComplete());
      return;
    }

    if (!hasDispatched.current) {
      hasDispatched.current = true;
      dispatch(refreshAccessToken());
    }
  }, [dispatch, isPublic, location.pathname]);

  if (isPublic) {
    return <AppRoutes />;
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
          <p className="text-sm text-[#5c5144]">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <AppRoutes />;
};

const App: React.FC = () => (
  <Router>
    <AppInner />
  </Router>
);

export default App;