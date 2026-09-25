// src/features/contact/admin/AdminContacts.tsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPage,
  fetchAllStations,
  fetchPendingStations,
  fetchMessages,
  fetchMessageCounts,
} from '../../store/slices/contactSlice';
import type { AppDispatch, RootState } from '../../store/store';
import AdminContactPagePanel from './AdminContactPagePanel';
import AdminStationsPanel from './AdminStationsPanel';
import AdminMessagesPanel from './AdminMessagesPanel';

type Tab = 'page' | 'stations' | 'messages';

const TABS: { id: Tab; label: string }[] = [
  { id: 'page',     label: 'Page Copy' },
  { id: 'stations', label: 'Stations' },
  { id: 'messages', label: 'Messages' },
];

const AdminContacts: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState<Tab>('page');

  // Badge data — cheap counts, fetched once on mount.
  const { currentPage, pendingStations, messageCounts } = useSelector(
    (s: RootState) => s.contact,
  );

  useEffect(() => {
    dispatch(fetchPage());
    dispatch(fetchAllStations());
    dispatch(fetchPendingStations());
    dispatch(fetchMessages({ page: 1, limit: 20 }));
    dispatch(fetchMessageCounts());
  }, [dispatch]);

  const newMessages = messageCounts?.new ?? 0;
  const pendingStationCount = pendingStations.length;
  const pageNeedsAction =
    currentPage?.status === 'draft' ||
    currentPage?.status === 'rejected' ||
    currentPage == null;

  const badgeFor = (id: Tab): number | null => {
    if (id === 'messages') return newMessages || null;
    if (id === 'stations') return pendingStationCount || null;
    return pageNeedsAction ? 1 : null; // dot, not a count
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <div className="bg-[#061e14] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-serif font-bold">
            Contact <span className="text-[#D4AF37]">Administration</span>
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Manage page copy, station registries, and inbound messages.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((t) => {
              const badge = badgeFor(t.id);
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={[
                    'relative px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider',
                    'border-b-2 transition-colors',
                    active
                      ? 'border-[#C69A33] text-[#061e14]'
                      : 'border-transparent text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {t.label}
                  {badge != null && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C69A33] text-white text-[10px]">
                      {t.id === 'page' ? '•' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {tab === 'page' && <AdminContactPagePanel />}
        {tab === 'stations' && <AdminStationsPanel />}
        {tab === 'messages' && <AdminMessagesPanel />}
      </div>
    </div>
  );
};

export default AdminContacts;