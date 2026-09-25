// src/features/contact/admin/AdminContactPagePanel.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const AdminContactPagePanel: React.FC = () => {
  const { currentPage, isLoadingCurrentPage, currentPageError } = useSelector(
    (s: RootState) => s.contact,
  );

  if (isLoadingCurrentPage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500 font-mono">
        Loading page copy…
      </div>
    );
  }

  if (currentPageError) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-800 font-mono">
        {currentPageError}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
      <h2 className="text-lg font-serif font-bold text-slate-900">
        Page Copy
      </h2>
      <p className="text-xs text-slate-500 font-mono">
        {currentPage
          ? `Loaded (status: ${currentPage.status}). Editor coming next.`
          : 'No page record yet. Create form coming next.'}
      </p>
    </div>
  );
};

export default AdminContactPagePanel;