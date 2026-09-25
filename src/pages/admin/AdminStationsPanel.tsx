// src/features/contact/admin/AdminStationsPanel.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const AdminStationsPanel: React.FC = () => {
  const {
    adminStations,
    pendingStations,
    isLoadingAdminStations,
    adminStationsError,
  } = useSelector((s: RootState) => s.contact);

  if (isLoadingAdminStations) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500 font-mono">
        Loading stations…
      </div>
    );
  }

  if (adminStationsError) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-800 font-mono">
        {adminStationsError}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
      <h2 className="text-lg font-serif font-bold text-slate-900">
        Stations
      </h2>
      <p className="text-xs text-slate-500 font-mono">
        {adminStations.length} station(s) · {pendingStations.length} pending
        review. Manager coming next.
      </p>
    </div>
  );
};

export default AdminStationsPanel;