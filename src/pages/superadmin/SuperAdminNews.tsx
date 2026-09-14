// src/features/news/SuperAdminNews.tsx
//
// Super-admin news workspace.
//
// Scope is deliberately narrower than AdminNews:
//   - Pending review queue (fetchPendingNews)
//   - Approve / reject with a review note (approveNews / rejectNews)
//   - Feature toggle on published articles (setFeaturedNews)
//
// It does NOT create, edit, submit, or delete — those are AdminNews
// concerns. All HTTP lives in the slice.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllNews,
  fetchPendingNews,
  approveNews,
  rejectNews,
  setFeaturedNews,
  clearPendingError,
  clearAdminError,
  clearReviewState,
  type NewsSummary,
} from '../../store/slices/newsSlice';
// Role check via the auth slice's own helper. Keeps the literal
// ('super_admin') out of this file and prevents the "no overlap" error
// from comparing against a non-existent variant.
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '—';

const StatusBadge = ({ status }: { status: NewsSummary['status'] }) => {
  const cls =
    status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : status === 'published'
        ? 'bg-green-100 text-green-800'
        : status === 'rejected'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        <h3 className="mb-1 text-base font-semibold">Reject article</h3>
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

// ─── Pending row ─────────────────────────────────────────────────────────────

interface PendingRowProps {
  item: NewsSummary;
  busy: boolean;
  onApprove: (item: NewsSummary) => void;
  onReject: (item: NewsSummary) => void;
}

const PendingRow = ({ item, busy, onApprove, onReject }: PendingRowProps) => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-2">
      <div className="flex items-center gap-3">
        {item.imageUrl && (
          <img src={item.imageUrl} alt="" className="h-9 w-14 rounded object-cover" />
        )}
        <div>
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-gray-500">{item.author}</div>
        </div>
      </div>
    </td>
    <td className="px-3 py-2 text-xs text-gray-500">
      {formatDate(item.updatedAt)}
    </td>
    <td className="px-3 py-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onApprove(item)}
          disabled={busy}
          className="rounded border border-green-300 px-3 py-1 text-xs text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item)}
          disabled={busy}
          className="rounded border border-red-300 px-3 py-1 text-xs text-red-800 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </td>
  </tr>
);

// ─── Published row ───────────────────────────────────────────────────────────

interface PublishedRowProps {
  item: NewsSummary;
  busy: boolean;
  onToggleFeature: (item: NewsSummary) => void;
}

const PublishedRow = ({ item, busy, onToggleFeature }: PublishedRowProps) => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-2">
      <div className="flex items-center gap-3">
        {item.imageUrl && (
          <img src={item.imageUrl} alt="" className="h-9 w-14 rounded object-cover" />
        )}
        <div>
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-gray-500">{item.author}</div>
        </div>
      </div>
    </td>
    <td className="px-3 py-2">
      <StatusBadge status={item.status} />
    </td>
    <td className="px-3 py-2 text-center">
      {item.isFeatured ? (
        <span className="text-amber-500" title="Featured">
          ★
        </span>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </td>
    <td className="px-3 py-2 text-xs text-gray-500">
      {formatDate(item.publishedAt ?? item.updatedAt)}
    </td>
    <td className="px-3 py-2">
      <button
        type="button"
        onClick={() => onToggleFeature(item)}
        disabled={busy}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
      >
        {item.isFeatured ? 'Unfeature' : 'Feature'}
      </button>
    </td>
  </tr>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const SuperAdminNews = () => {
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
  } = useSelector((s: RootState) => s.news);

  // Role check via the auth slice's helper. Compares against the single
  // source of truth ('super_admin'), so the string literal only lives in
  // authSlice.ts and can't drift per-file.
  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<NewsSummary | null>(null);

  // Initial load — pending queue is the primary surface.
  useEffect(() => {
    dispatch(fetchPendingNews());
  }, [dispatch]);

  // Published list is loaded lazily the first time the tab is opened.
  useEffect(() => {
    if (tab === 'published') dispatch(fetchAllNews());
  }, [tab, dispatch]);

  // Clear transient success/error banners when switching tabs.
  useEffect(() => {
    dispatch(clearPendingError());
    dispatch(clearReviewState());
    dispatch(clearAdminError());
  }, [tab, dispatch]);

  const publishedItems = useMemo(
    () => adminItems.filter((i) => i.status === 'published'),
    [adminItems],
  );

  const handleApprove = (item: NewsSummary) => {
    dispatch(approveNews({ newsId: item.id }));
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejecting) return;
    await dispatch(
      rejectNews({ newsId: rejecting.id, reviewNote: note }),
    );
    setRejecting(null);
  };

  const handleToggleFeature = (item: NewsSummary) => {
    dispatch(setFeaturedNews({ newsId: item.id, isFeatured: !item.isFeatured }));
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">
          You don’t have permission to review news.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">News review</h1>
        <p className="text-sm text-gray-500">
          Approve or reject submissions, and manage the featured article.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-3 py-2 text-sm ${
            tab === 'pending'
              ? 'border-b-2 border-blue-600 font-medium text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Pending
          {pendingItems.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {pendingItems.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('published')}
          className={`px-3 py-2 text-sm ${
            tab === 'published'
              ? 'border-b-2 border-blue-600 font-medium text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Published
        </button>
      </div>

      {/* Success / error banners */}
      {reviewSuccess && (
        <p className="mb-2 text-sm text-green-600">Review action applied.</p>
      )}
      {reviewError && <p className="mb-2 text-sm text-red-600">{reviewError}</p>}

      {/* Pending tab */}
      {tab === 'pending' && (
        <>
          {isLoadingPending && (
            <p className="text-sm text-gray-500">Loading…</p>
          )}
          {pendingError && (
            <p className="text-sm text-red-600">{pendingError}</p>
          )}
          {!isLoadingPending && !pendingError && pendingItems.length === 0 && (
            <p className="text-sm text-gray-500">Nothing awaiting review.</p>
          )}
          {!isLoadingPending && !pendingError && pendingItems.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Article</th>
                    <th className="px-3 py-2">Updated</th>
                    <th className="px-3 py-2">Decision</th>
                  </tr>
                </thead>
                <tbody>
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
          )}
        </>
      )}

      {/* Published tab */}
      {tab === 'published' && (
        <>
          {isLoadingAdmin && <p className="text-sm text-gray-500">Loading…</p>}
          {adminError && <p className="text-sm text-red-600">{adminError}</p>}
          {!isLoadingAdmin && !adminError && publishedItems.length === 0 && (
            <p className="text-sm text-gray-500">No published articles yet.</p>
          )}
          {!isLoadingAdmin && !adminError && publishedItems.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Article</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-center">Featured</th>
                    <th className="px-3 py-2">Published</th>
                    <th className="px-3 py-2">Feature</th>
                  </tr>
                </thead>
                <tbody>
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
          )}
          <p className="mt-2 text-xs text-gray-400">
            Featuring one article automatically unfeatures the previous one.
            This list reflects the change after a refetch.
          </p>
        </>
      )}

      {/* Reject dialog */}
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

export default SuperAdminNews;