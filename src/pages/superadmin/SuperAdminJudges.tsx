// src/features/judges/SuperAdminJudges.tsx
//
// Super-admin judges workspace.
//
// Scope is deliberately narrower than AdminJudges:
//   - Pending review queue (fetchPendingJudges)
//   - Approve / reject with a review note
//     (approveJudge / rejectJudge)
//
// It does NOT create, edit, submit, or delete — those are AdminJudges
// concerns. Judges have no featured flag, so there is no feature toggle
// here. All HTTP lives in the slice.
//
// Portraits are read-only on this page. The reviewer sees the existing
// image (if any) as a small avatar, or initials when there is none.
// Uploading, replacing, and clearing portraits happen in AdminJudges.
// Reviewers do not interact with Cloudinary at all.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllJudges,
  fetchPendingJudges,
  approveJudge,
  rejectJudge,
  clearPendingError,
  clearAdminError,
  clearReviewState,
  type JudgeSummary,
} from '../../store/slices/judgesSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const StatusBadge = ({ status }: { status: JudgeSummary['status'] }) => {
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

/**
 * Initials fallback for judges without a portrait. Same logic as the
 * admin row: take the first letter of the last two capitalized words.
 */
const initials = (name: string): string =>
  name
    .split(' ')
    .filter((p) => /^[A-Z]/.test(p))
    .slice(-2)
    .map((p) => p[0])
    .join('') || '?';

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
        <h3 className="mb-1 text-base font-semibold">Reject judge record</h3>
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
  item: JudgeSummary;
  busy: boolean;
  onApprove: (item: JudgeSummary) => void;
  onReject: (item: JudgeSummary) => void;
}

const PendingRow = ({ item, busy, onApprove, onReject }: PendingRowProps) => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-2">
      <div className="flex items-center gap-3">
        {item.image?.url ? (
          <img
            src={item.image.url}
            alt=""
            className="h-10 w-10 rounded-full object-cover object-top"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            {initials(item.name)}
          </div>
        )}
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{item.title}</div>
        </div>
      </div>
    </td>
    <td className="px-3 py-2 text-xs text-gray-600">{item.station}</td>
    <td className="px-3 py-2 text-xs text-gray-600">{item.region}</td>
    <td className="px-3 py-2 text-xs text-gray-600">
      {item.appointedYear}
    </td>
    <td className="px-3 py-2 text-xs text-gray-500">
      {formatDate(item.createdAt)}
    </td>
    <td className="px-3 py-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => onApprove(item)}
          disabled={busy}
          className="rounded border border-green-300 px-2 py-1 text-green-800 hover:bg-green-50 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(item)}
          disabled={busy}
          className="rounded border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </td>
  </tr>
);

// ─── Published row ───────────────────────────────────────────────────────────

const PublishedRow = ({ item }: { item: JudgeSummary }) => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-2">
      <div className="flex items-center gap-3">
        {item.image?.url ? (
          <img
            src={item.image.url}
            alt=""
            className="h-10 w-10 rounded-full object-cover object-top"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            {initials(item.name)}
          </div>
        )}
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{item.title}</div>
        </div>
      </div>
    </td>
    <td className="px-3 py-2 text-xs text-gray-600">{item.station}</td>
    <td className="px-3 py-2 text-xs text-gray-600">{item.region}</td>
    <td className="px-3 py-2">
      <StatusBadge status={item.status} />
    </td>
    <td className="px-3 py-2 text-xs text-gray-500">
      {item.publishedAt ? formatDate(item.publishedAt) : '—'}
    </td>
  </tr>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const SuperAdminJudges = () => {
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
  } = useSelector((s: RootState) => s.judges);

  // Role check via the auth slice's helper. Same pattern as the other
  // super-admin pages.
  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<JudgeSummary | null>(null);

  // Initial load — pending queue is the primary surface.
  useEffect(() => {
    dispatch(fetchPendingJudges());
  }, [dispatch]);

  // Published list is loaded lazily the first time the tab is opened.
  useEffect(() => {
    if (tab === 'published') dispatch(fetchAllJudges());
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

  const handleApprove = (item: JudgeSummary) => {
    dispatch(approveJudge({ judgeId: item.id }));
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejecting) return;
    try {
      await dispatch(
        rejectJudge({ judgeId: rejecting.id, reviewNote: note }),
      ).unwrap();
      setRejecting(null);
    } catch {
      // Slice has already stored reviewError; leave the dialog open so
      // the user can retry or cancel.
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">
          You don’t have permission to review judge records.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Judges review</h1>
        <p className="text-sm text-gray-500">
          Approve or reject judge records before they appear on the public
          bench listing.
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
                    <th className="px-3 py-2">Judge</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Region</th>
                    <th className="px-3 py-2">Appointed</th>
                    <th className="px-3 py-2">Submitted</th>
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
            <p className="text-sm text-gray-500">No published records yet.</p>
          )}
          {!isLoadingAdmin && !adminError && publishedItems.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Judge</th>
                    <th className="px-3 py-2">Station</th>
                    <th className="px-3 py-2">Region</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedItems.map((item) => (
                    <PublishedRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Reject dialog */}
      {rejecting && (
        <RejectDialog
          title={rejecting.name}
          busy={isReviewing}
          onCancel={() => setRejecting(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
};

export default SuperAdminJudges;