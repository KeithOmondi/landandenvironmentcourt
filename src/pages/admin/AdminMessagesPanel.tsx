// src/features/contact/admin/AdminMessagesPanel.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const AdminMessagesPanel: React.FC = () => {
  const {
    //messages,
    messagesTotal,
    messageCounts,
    isLoadingMessages,
    messagesError,
  } = useSelector((s: RootState) => s.contact);

  if (isLoadingMessages) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500 font-mono">
        Loading messages…
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-800 font-mono">
        {messagesError}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
      <h2 className="text-lg font-serif font-bold text-slate-900">
        Messages
      </h2>
      <p className="text-xs text-slate-500 font-mono">
        {messagesTotal} total · {messageCounts?.new ?? 0} new ·{' '}
        {messageCounts?.read ?? 0} read · {messageCounts?.handled ?? 0} handled
        · {messageCounts?.archived ?? 0} archived. Inbox coming next.
      </p>
    </div>
  );
};

export default AdminMessagesPanel;