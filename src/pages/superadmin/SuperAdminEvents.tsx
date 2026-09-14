// src/features/events/SuperAdminEvents.tsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  AlertCircle,
  Tag,
  Building2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  fetchAllEvents,
  fetchPendingEvents,
  approveEvent,
  rejectEvent,
  setFeaturedEvent,
  clearPendingError,
  clearAdminError,
  clearReviewState,
  type EventSummary,
} from '../../store/slices/eventsSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const StatusBadge = ({ status }: { status: EventSummary['status'] }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200/80',
    published: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200/80',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Reject Event</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{title}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Review Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Explain what needs to change prior to approval…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 focus:outline-none transition"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={busy || trimmed.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {busy ? 'Rejecting…' : 'Reject Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pending row ─────────────────────────────────────────────────────────────

interface PendingRowProps {
  item: EventSummary;
  busy: boolean;
  onApprove: (item: EventSummary) => void;
  onReject: (item: EventSummary) => void;
}

const PendingRow = ({ item, busy, onApprove, onReject }: PendingRowProps) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-10 w-16 rounded-md object-cover border border-slate-200 shrink-0" />
        ) : (
          <div className="h-10 w-16 rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate text-sm">{item.title}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.organizer}</span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3.5 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
        <Tag className="w-3 h-3 text-slate-400" />
        {item.category}
      </span>
    </td>
    <td className="px-4 py-3.5 text-xs text-slate-600">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {formatDateTime(item.startsAt)}
      </div>
    </td>
    <td className="px-4 py-3.5 text-right">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onApprove(item)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50 transition cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Reject
        </button>
      </div>
    </td>
  </tr>
);

// ─── Published row ───────────────────────────────────────────────────────────

interface PublishedRowProps {
  item: EventSummary;
  busy: boolean;
  onToggleFeature: (item: EventSummary) => void;
}

const PublishedRow = ({ item, busy, onToggleFeature }: PublishedRowProps) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-10 w-16 rounded-md object-cover border border-slate-200 shrink-0" />
        ) : (
          <div className="h-10 w-16 rounded-md bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate text-sm">{item.title}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{item.organizer}</span>
          </div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3.5 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
        <Tag className="w-3 h-3 text-slate-400" />
        {item.category}
      </span>
    </td>
    <td className="px-4 py-3.5">
      <StatusBadge status={item.status} />
    </td>
    <td className="px-4 py-3.5 text-center">
      {item.isFeatured ? (
        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-semibold border border-amber-200">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          Featured
        </span>
      ) : (
        <span className="text-slate-300 text-sm">—</span>
      )}
    </td>
    <td className="px-4 py-3.5 text-xs text-slate-600">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {formatDateTime(item.startsAt)}
      </div>
    </td>
    <td className="px-4 py-3.5 text-right">
      <button
        type="button"
        onClick={() => onToggleFeature(item)}
        disabled={busy}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
          item.isFeatured
            ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            : 'border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'text-slate-400' : 'text-amber-600'}`} />
        {item.isFeatured ? 'Unfeature' : 'Set Featured'}
      </button>
    </td>
  </tr>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const SuperAdminEvents = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    pendingItems,
    isLoadingPending,
    pendingError,
    adminItems,
    isLoadingAdmin,
    adminError,
    isReviewing,
    reviewError,
    reviewSuccess,
  } = useSelector((s: RootState) => s.events);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<EventSummary | null>(null);

  useEffect(() => {
    dispatch(fetchPendingEvents());
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'published') dispatch(fetchAllEvents());
  }, [tab, dispatch]);

  useEffect(() => {
    dispatch(clearPendingError());
    dispatch(clearReviewState());
    dispatch(clearAdminError());
  }, [tab, dispatch]);

  const publishedItems = useMemo(
    () => adminItems.filter((i) => i.status === 'published'),
    [adminItems],
  );

  const handleApprove = (item: EventSummary) => {
    dispatch(approveEvent({ eventId: item.id }));
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejecting) return;
    await dispatch(
      rejectEvent({ eventId: rejecting.id, reviewNote: note }),
    );
    setRejecting(null);
  };

  const handleToggleFeature = (item: EventSummary) => {
    dispatch(
      setFeaturedEvent({ eventId: item.id, isFeatured: !item.isFeatured }),
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>You don’t have permission to review court events.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
          Events Review
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Approve or reject submitted event listings, and set the platform's featured event.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-semibold transition cursor-pointer ${
              tab === 'pending'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Pending Review
            {pendingItems.length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
                {pendingItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('published')}
            className={`inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-semibold transition cursor-pointer ${
              tab === 'published'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            Published Events
          </button>
        </nav>
      </div>

      {/* Feedback Banners */}
      {reviewSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Review action applied successfully.
        </div>
      )}
      {reviewError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {reviewError}
        </div>
      )}

      {/* Pending Tab */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {isLoadingPending && (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-800" />
              Loading pending queue…
            </div>
          )}

          {pendingError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {pendingError}
            </div>
          )}

          {!isLoadingPending && !pendingError && pendingItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <CheckCircle2 className="mx-auto w-10 h-10 text-emerald-600/60 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">Queue Clear</h3>
              <p className="text-xs text-slate-500 mt-1">There are no event submissions awaiting review.</p>
            </div>
          )}

          {!isLoadingPending && !pendingError && pendingItems.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Event Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingItems.map((item) => (
                      <PendingRow
                        key={item.id}
                        item={item}
                        busy={isReviewing}
                        onApprove={handleApprove}
                        onReject={setRejecting}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Published Tab */}
      {tab === 'published' && (
        <div className="space-y-4">
          {isLoadingAdmin && (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-800" />
              Loading published events…
            </div>
          )}

          {adminError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {adminError}
            </div>
          )}

          {!isLoadingAdmin && !adminError && publishedItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Calendar className="mx-auto w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No Published Events</h3>
              <p className="text-xs text-slate-500 mt-1">Approved events will appear here.</p>
            </div>
          )}

          {!isLoadingAdmin && !adminError && publishedItems.length > 0 && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Event Details</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Featured</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {publishedItems.map((item) => (
                        <PublishedRow
                          key={item.id}
                          item={item}
                          busy={isReviewing}
                          onToggleFeature={handleToggleFeature}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 px-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Setting an event as featured automatically unfeatures any previously featured event.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejecting && (
        <RejectDialog
          title={rejecting.title}
          busy={isReviewing}
          onCancel={() => setRejecting(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
};

export default SuperAdminEvents;