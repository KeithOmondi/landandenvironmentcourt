// src/features/contact/SuperAdminContact.tsx
//
// Super-admin workspace for the Contact feature.
//
// Scope:
//   - Review queue for pending stations (approve / reject).
//   - Review queue for the pending page copy (approve / reject).
//   - Message inbox with read/update capability (mark read, handled,
//     archived, add admin notes).
//
// The admin workspace handles day-to-day editing. This page handles
// the sign-off and the message triage.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPendingStations,
  fetchAllStations,
  fetchPage,
  fetchMessages,
  fetchMessageCounts,
  fetchMessageById,
  approveStation,
  rejectStation,
  approvePage,
  rejectPage,
  updateMessage,
  clearPendingStationsError,
  clearReviewState,
  clearAdminStationsError,
  clearMessagesError,
  clearCurrentMessage,
  type ContactStation,
  type ContactStatus,
  type ContactMessageStatus,
} from '../../store/slices/contactSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadgeClass: Record<ContactStatus, string> = {
  draft:     'bg-gray-100 text-gray-700',
  pending:   'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }: { status: ContactStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const messageStatusBadgeClass: Record<ContactMessageStatus, string> = {
  new:      'bg-blue-100 text-blue-800',
  read:     'bg-amber-100 text-amber-800',
  handled:  'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-700',
};

const MessageStatusBadge = ({ status }: { status: ContactMessageStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${messageStatusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// ─── Reject dialog ───────────────────────────────────────────────────────────

interface RejectDialogProps {
  title: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}

const RejectDialog = ({ title, busy, onCancel, onConfirm }: RejectDialogProps) => {
  const [note, setNote] = useState('');
  const trimmed = note.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        <h3 className="mb-1 text-base font-semibold">Reject record</h3>
        <p className="mb-3 text-xs text-gray-500">{title}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Explain what needs to change…"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={busy || trimmed.length === 0}
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Stations review tab ─────────────────────────────────────────────────────

const StationsReviewTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    pendingStations,
    isLoadingPendingStations,
    pendingStationsError,
    adminStations,
    isLoadingAdminStations,
    adminStationsError,
    isReviewing,
    reviewError,
    reviewSuccess,
  } = useSelector((s: RootState) => s.contact);

  const [view, setView] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<ContactStation | null>(null);

  useEffect(() => {
    dispatch(fetchPendingStations());
  }, [dispatch]);

  useEffect(() => {
    if (view === 'published') dispatch(fetchAllStations());
  }, [dispatch, view]);

  useEffect(() => {
    dispatch(clearPendingStationsError());
    dispatch(clearAdminStationsError());
    dispatch(clearReviewState());
  }, [dispatch, view]);

  const publishedStations = useMemo(
    () => adminStations.filter((s) => s.status === 'published'),
    [adminStations],
  );

  const handleApprove = (station: ContactStation) => {
    dispatch(approveStation({ id: station.id }));
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejecting) return;
    try {
      await dispatch(
        rejectStation({ id: rejecting.id, reviewNote: note }),
      ).unwrap();
      setRejecting(null);
    } catch {
      // Slice recorded reviewError.
    }
  };

  const rows = view === 'pending' ? pendingStations : publishedStations;
  const loading =
    view === 'pending' ? isLoadingPendingStations : isLoadingAdminStations;
  const error =
    view === 'pending' ? pendingStationsError : adminStationsError;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setView('pending')}
          className={`px-3 py-2 text-sm ${
            view === 'pending'
              ? 'border-b-2 border-blue-600 font-medium text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Pending
          {pendingStations.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {pendingStations.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setView('published')}
          className={`px-3 py-2 text-sm ${
            view === 'published'
              ? 'border-b-2 border-blue-600 font-medium text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Published
        </button>
      </div>

      {reviewSuccess && (
        <p className="text-sm text-green-600">Review action applied.</p>
      )}
      {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-500">
          {view === 'pending'
            ? 'Nothing awaiting review.'
            : 'No published stations yet.'}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((station) => (
                <tr key={station.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">{station.station}</td>
                  <td className="px-3 py-2 text-xs text-gray-600 font-mono">
                    {station.email ?? station.phone ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={station.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {view === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(station)}
                            disabled={isReviewing}
                            className="rounded border border-green-300 px-2 py-1 text-green-800 hover:bg-green-50 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejecting(station)}
                            disabled={isReviewing}
                            className="rounded border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <RejectDialog
          title={rejecting.station}
          busy={isReviewing}
          onCancel={() => setRejecting(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
};

// ─── Page review tab ─────────────────────────────────────────────────────────

const PageReviewTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentPage,
    isLoadingCurrentPage,
    currentPageError,
    isReviewing,
    reviewError,
    reviewSuccess,
  } = useSelector((s: RootState) => s.contact);

  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    dispatch(fetchPage());
    dispatch(clearReviewState());
  }, [dispatch]);

  const handleApprove = () => {
    dispatch(approvePage({}));
  };

  const handleRejectConfirm = async (note: string) => {
    try {
      await dispatch(rejectPage({ reviewNote: note })).unwrap();
      setRejecting(false);
    } catch {
      // Slice recorded reviewError.
    }
  };

  if (isLoadingCurrentPage) {
    return <p className="text-sm text-gray-500">Loading page content…</p>;
  }
  if (currentPageError) {
    return <p className="text-sm text-red-600">{currentPageError}</p>;
  }
  if (!currentPage) {
    return <p className="text-sm text-gray-500">Page content not created yet.</p>;
  }

  const isPending = currentPage.status === 'pending';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <StatusBadge status={currentPage.status} />
        </div>
        {isPending && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isReviewing}
              className="rounded border border-green-300 px-3 py-1.5 text-sm text-green-800 hover:bg-green-50 disabled:opacity-50"
            >
              {isReviewing ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={isReviewing}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
        {!isPending && (
          <span className="text-xs text-gray-400">
            Nothing to review — status is {currentPage.status}.
          </span>
        )}
      </div>

      {reviewSuccess && (
        <p className="text-sm text-green-600">Review action applied.</p>
      )}
      {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <ReadOnly label="Hero badge" value={currentPage.heroBadge} />
        <ReadOnly
          label="Hero title"
          value={`${currentPage.heroTitle} ${currentPage.heroHighlight}`}
        />
        <ReadOnly label="Hero subtitle" value={currentPage.heroSubtitle} />
        <ReadOnly label="Get In Touch heading" value={currentPage.getInTouchHeading} />
        <ReadOnly label="Address" value={currentPage.address} />
        <ReadOnly label="Phone" value={currentPage.phone} />
        <ReadOnly label="Email" value={currentPage.email} />
        <ReadOnly label="Hours" value={currentPage.hours} />
        <ReadOnly label="Form heading" value={currentPage.formHeading} />
        <ReadOnly label="Directory heading" value={currentPage.directoryHeading} />
      </div>

      {rejecting && (
        <RejectDialog
          title="Contact page content"
          busy={isReviewing}
          onCancel={() => setRejecting(false)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
};

const ReadOnly = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
      {label}
    </div>
    <div className="text-slate-800">{value || '—'}</div>
  </div>
);

// ─── Messages tab ────────────────────────────────────────────────────────────

const MessagesTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    messages,
    messagesTotal,
    isLoadingMessages,
    messagesError,
    messageCounts,
    currentMessage,
    isLoadingCurrentMessage,
    currentMessageError,
    isSaving,
    saveError,
  } = useSelector((s: RootState) => s.contact);

  const [filter, setFilter] = useState<'all' | ContactMessageStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchMessages({}));
    dispatch(fetchMessageCounts());
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(
        fetchMessages({
          status: filter === 'all' ? undefined : filter,
          search: search || undefined,
        }),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [dispatch, filter, search]);

  const openMessage = (id: string) => {
    dispatch(fetchMessageById(id));
  };

  const closeMessage = () => {
    dispatch(clearCurrentMessage());
  };

  const changeStatus = (id: string, status: ContactMessageStatus) => {
    dispatch(updateMessage({ id, payload: { status } }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'read', 'handled', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold ${
                filter === s
                  ? 'bg-[#061e14] text-[#D4AF37]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && messageCounts && messageCounts[s] > 0 && (
                <span className="ml-2 text-[10px]">({messageCounts[s]})</span>
              )}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, subject…"
          className="w-full sm:w-72 rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {messagesError && <p className="text-sm text-red-600">{messagesError}</p>}
      {isLoadingMessages && <p className="text-sm text-gray-500">Loading…</p>}

      {!isLoadingMessages && !messagesError && messages.length === 0 && (
        <p className="text-sm text-gray-500">No messages in this view.</p>
      )}

      {!isLoadingMessages && !messagesError && messages.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">From</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => openMessage(m.id)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-slate-50 ${
                      currentMessage?.id === m.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                        {m.email}
                      </div>
                      <div className="text-xs text-gray-700 truncate max-w-[220px]">
                        {m.subject ?? <span className="italic text-gray-400">No subject</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <MessageStatusBadge status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 min-h-[300px]">
            {!currentMessage && !isLoadingCurrentMessage && (
              <p className="text-sm text-gray-500">
                Select a message to read it.
              </p>
            )}
            {isLoadingCurrentMessage && (
              <p className="text-sm text-gray-500">Loading message…</p>
            )}
            {currentMessageError && (
              <p className="text-sm text-red-600">{currentMessageError}</p>
            )}
            {currentMessage && !isLoadingCurrentMessage && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {currentMessage.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {currentMessage.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMessage}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Subject
                  </div>
                  <div className="text-sm">
                    {currentMessage.subject ?? (
                      <span className="italic text-gray-400">No subject</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Message
                  </div>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded p-3">
                    {currentMessage.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 font-mono">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                      Received
                    </div>
                    {formatDateTime(currentMessage.createdAt)}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                      Read
                    </div>
                    {formatDateTime(currentMessage.readAt)}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                      Handled
                    </div>
                    {formatDateTime(currentMessage.handledAt)}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                      Status
                    </div>
                    <MessageStatusBadge status={currentMessage.status} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentMessage.status !== 'handled' &&
                    currentMessage.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => changeStatus(currentMessage.id, 'handled')}
                        disabled={isSaving}
                        className="rounded border border-green-300 px-3 py-1.5 text-xs text-green-800 hover:bg-green-50 disabled:opacity-50"
                      >
                        Mark handled
                      </button>
                    )}
                  {currentMessage.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => changeStatus(currentMessage.id, 'archived')}
                      disabled={isSaving}
                      className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Archive
                    </button>
                  )}
                </div>

                {saveError && (
                  <p className="text-sm text-red-600">{saveError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Showing {messages.length} of {messagesTotal} messages.
      </p>
    </div>
  );
};

// ─── Page component ──────────────────────────────────────────────────────────

const SuperAdminContact = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'stations' | 'page' | 'messages'>('stations');

  useEffect(() => {
    dispatch(clearReviewState());
    dispatch(clearPendingStationsError());
    dispatch(clearAdminStationsError());
    dispatch(clearMessagesError());
  }, [dispatch, tab]);

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">
          You don't have permission to review contact records.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Contact review</h1>
        <p className="text-sm text-gray-500">
          Approve or reject stations and page content, and read inbound
          messages.
        </p>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {(['stations', 'page', 'messages'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t
                ? 'border-b-2 border-blue-600 font-medium text-blue-600'
                : 'text-gray-600'
            }`}
          >
            {t === 'stations'
              ? 'Station reviews'
              : t === 'page'
                ? 'Page review'
                : 'Messages'}
          </button>
        ))}
      </div>

      {tab === 'stations' && <StationsReviewTab />}
      {tab === 'page' && <PageReviewTab />}
      {tab === 'messages' && <MessagesTab />}
    </div>
  );
};

export default SuperAdminContact;