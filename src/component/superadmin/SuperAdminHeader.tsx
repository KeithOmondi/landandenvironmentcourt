// src/components/superadmin/SuperAdminHeader.tsx
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { Scale, LogOut, UserCheck } from 'lucide-react';

const SuperAdminHeader = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-emerald-900 text-white shadow-md border-b-2 border-amber-600 h-14 shrink-0">
      {/* Brand Title with Judiciary Emblem/Icon */}
      <div className="flex items-center gap-3">
        <Scale className="w-6 h-6 text-amber-500" />
        <h1 className="text-sm md:text-base font-semibold tracking-wide">
          ORELC <span className="text-amber-500 font-normal">|</span> 
        </h1>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-emerald-100">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>
              <strong className="font-semibold text-white">{user.fullName}</strong>
              <span className="mx-1.5 opacity-60">•</span>
              <em className="not-italic capitalize text-amber-400 font-medium">{user.role}</em>
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs md:text-sm px-3.5 py-1.5 rounded-md transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-emerald-900 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
};

export default SuperAdminHeader;