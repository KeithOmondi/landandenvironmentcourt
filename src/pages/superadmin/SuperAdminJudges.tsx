// src/features/judges/SuperAdminJudges.tsx
//
// Super-admin judges workspace.
//
// Scope:
//   - Pending review queue (fetchPendingJudges)
//   - Approve / reject with a review note
//   - Edit any record (same editor as AdminJudges)
//   - Delete any record
//
// Super admins can edit and delete regardless of who created the
// record. This is enforced on the server side by the role check in
// updateJudge / deleteJudge — the UI just exposes the buttons.
//
// The editor is inline, not a full-page route. It reuses the same
// slice thunks as AdminJudges: fetchJudgeById for load, updateJudge
// for save, deleteJudge for delete. No new HTTP.
//
// Editor scope:
//   The editor exposes name, title, station, region, appointedYear,
//   bio, and the portrait. It does NOT expose education or
//   specializations. Those fields are preserved by the PATCH payload
//   omitting them — the server's `.partial()` schema treats absent
//   fields as "leave alone". Round-tripping stale copies of those
//   arrays would clobber concurrent edits from the admin workspace.
//
// Portrait preview:
//   The object URL for a staged file is created via `useMemo` and
//   revoked in an effect cleanup. Creating it inline in JSX leaks a
//   blob on every render — same pattern we removed from
//   AdminJudges' PortraitPicker.
//
// Editor close on tab change:
//   The tab-button click handlers close the editor explicitly. This
//   keeps the "close the editor when switching context" logic in the
//   event handler where it belongs, rather than in an effect reacting
//   to `tab` changes. React's compiler flags synchronous setState in
//   effects for good reason — it triggers a cascading render before
//   the effect's other work (dispatches) has finished.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllJudges,
  fetchPendingJudges,
  fetchJudgeById,
  updateJudge,
  deleteJudge,
  approveJudge,
  rejectJudge,
  clearCurrent,
  clearSaveState,
  clearPendingError,
  clearAdminError,
  clearReviewState,
  JUDGE_REGIONS,
  type Judge,
  type JudgeInput,
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

const initials = (name: string): string =>
  name
    .split(' ')
    .filter((p) => /^[A-Z]/.test(p))
    .slice(-2)
    .map((p) => p[0])
    .join('') || '?';

/**
 * Editable fields the super-admin editor exposes.
 *
 * Deliberately a SUBSET of `JudgeInput`. Education and specializations
 * are excluded — the editor doesn't render them, so it shouldn't send
 * them. The server's PATCH schema treats absent fields as "leave
 * alone", which is the correct semantics: if an admin edits education
 * on the same record while this editor is open, the super-admin's save
 * won't clobber it.
 */
type EditorForm = Omit<JudgeInput, 'education' | 'specializations'>;

const formFromJudge = (judge: Judge): EditorForm => ({
  name:          judge.name,
  title:         judge.title,
  station:       judge.station,
  region:        judge.region,
  appointedYear: judge.appointedYear,
  bio:           judge.bio,
});

// ─── Editor ──────────────────────────────────────────────────────────────────

interface EditorProps {
  judge: Judge;
  onClose: () => void;
  onSaved: () => void;
}

const JudgeEditor = ({ judge, onClose, onSaved }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess } = useSelector(
    (s: RootState) => s.judges,
  );

  const [form, setForm] = useState<EditorForm>(() => formFromJudge(judge));
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Derive the preview URL during render. No state, no cascading
  // renders — the URL is a pure function of `imageFile`.
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  // Revoke the object URL when it's no longer needed. The effect does
  // NOT call setState — that's what would trigger the compiler warning.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Send only the fields this editor owns. Omitting education and
      // specializations means the server preserves the existing values
      // instead of overwriting them with a stale copy of what was
      // loaded when the editor opened.
      await dispatch(
        updateJudge({
          judgeId: judge.id,
          payload: form,
          image: imageFile ?? undefined,
        }),
      ).unwrap();
      onSaved();
    } catch {
      // Slice already recorded saveError.
    }
  };

  const shownImageUrl = previewUrl ?? judge.image?.url ?? null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit: {judge.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Close
        </button>
      </div>

      <div className="grid gap-3">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="station"
            value={form.station}
            onChange={handleChange}
            placeholder="Station"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <label className="text-xs text-gray-600">
            Region
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {JUDGE_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-xs text-gray-600">
          Appointed year
          <input
            name="appointedYear"
            value={form.appointedYear}
            onChange={handleChange}
            maxLength={4}
            className="mt-1 w-full sm:w-40 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={5}
          placeholder="Biography"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        {/* Portrait preview + picker. */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-600">Portrait</span>
          <div className="flex items-center gap-4">
            {shownImageUrl ? (
              <img
                src={shownImageUrl}
                alt=""
                className="h-16 w-16 rounded object-cover object-top border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                No portrait
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
                className="text-xs"
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs text-red-700 hover:underline text-left"
                >
                  Remove selected file
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Education and specializations aren't editable from this
            page. Show a read-only summary so the reviewer knows the
            record has them, and where to edit them if needed. */}
        {(judge.education.length > 0 || judge.specializations.length > 0) && (
          <div className="text-xs text-gray-500 space-y-0.5">
            {judge.education.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Education:</span>{' '}
                {judge.education.length} entr
                {judge.education.length === 1 ? 'y' : 'ies'}
                {' '}— edit in the admin workspace.
              </div>
            )}
            {judge.specializations.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Specializations:</span>{' '}
                {judge.specializations.length}
                {' '}— edit in the admin workspace.
              </div>
            )}
          </div>
        )}

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-green-600">Saved.</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: JudgeSummary;
  busy: boolean;
  showReviewActions: boolean;
  onEdit: (id: string) => void;
  onApprove: (item: JudgeSummary) => void;
  onReject: (item: JudgeSummary) => void;
  onDelete: (item: JudgeSummary) => void;
}

const JudgeRow = ({
  item,
  busy,
  showReviewActions,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: RowProps) => (
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
    <td className="px-3 py-2">
      <StatusBadge status={item.status} />
    </td>
    <td className="px-3 py-2 text-xs text-gray-500">
      {showReviewActions
        ? formatDate(item.createdAt)
        : item.publishedAt
          ? formatDate(item.publishedAt)
          : '—'}
    </td>
    <td className="px-3 py-2">
      <div className="flex flex-wrap gap-2 text-xs">
        {/* Edit is always available to a super admin, any status. */}
        <button
          type="button"
          onClick={() => onEdit(item.id)}
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
        >
          Edit
        </button>

        {/* Approve / Reject only for pending records. */}
        {showReviewActions && (
          <>
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
          </>
        )}

        {/* Delete is always available to a super admin, any status. */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="rounded border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
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
    current,
    isLoadingCurrent,
    currentError,
    isReviewing,
    reviewError,
    reviewSuccess,
    deleteError,
  } = useSelector((s: RootState) => s.judges);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<JudgeSummary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initial load — pending queue is the primary surface.
  useEffect(() => {
    dispatch(fetchPendingJudges());
  }, [dispatch]);

  // Published list is loaded lazily the first time the tab is opened.
  useEffect(() => {
    if (tab === 'published') dispatch(fetchAllJudges());
  }, [tab, dispatch]);

  // When the super admin opens the editor, load the full record.
  useEffect(() => {
    if (editingId) dispatch(fetchJudgeById(editingId));
  }, [editingId, dispatch]);

  // Clear transient error banners when switching tabs. State that
  // tracks user intent (the open editor, the reject dialog) is closed
  // from the click handlers below, not from an effect.
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

  const handleEdit = (id: string) => {
    dispatch(clearSaveState());
    setEditingId(id);
  };

  const handleCloseEditor = () => {
    setEditingId(null);
    dispatch(clearCurrent());
    dispatch(clearSaveState());
  };

  const handleDelete = async (item: JudgeSummary) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    try {
      await dispatch(deleteJudge(item.id)).unwrap();
      // Success: close the editor if it was open on this record.
      if (editingId === item.id) handleCloseEditor();
    } catch {
      // Delete failed. Refetch so the list reflects the server's
      // reality — the row may have been deleted by someone else, the
      // record may not exist, or the server may have refused.
      dispatch(fetchPendingJudges());
      dispatch(fetchAllJudges());

      // If we were editing the record that failed to delete, close
      // the editor too — the state is now suspect.
      if (editingId === item.id) handleCloseEditor();
    }
  };

  const handleSaved = () => {
    // Close the editor on successful save. The slice already updated
    // `current` and `adminItems`; refreshing the list keeps the pending
    // tab in sync if the record's status changed.
    handleCloseEditor();
    dispatch(fetchPendingJudges());
    dispatch(fetchAllJudges());
  };

  // Tab switch: close the editor and the reject dialog, then switch.
  // Doing this in the click handler (not in an effect on `tab`) keeps
  // the "user changed context" logic in the event that caused it.
  const handleTabChange = (next: 'pending' | 'published') => {
    if (next === tab) return;
    handleCloseEditor();
    setRejecting(null);
    setTab(next);
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">
          You don't have permission to review judge records.
        </p>
      </div>
    );
  }

  const rows = tab === 'pending' ? pendingItems : publishedItems;
  const loading = tab === 'pending' ? isLoadingPending : isLoadingAdmin;
  const error = tab === 'pending' ? pendingError : adminError;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Judges review</h1>
        <p className="text-sm text-gray-500">
          Approve, reject, edit, or delete judge records. Edits take
          effect immediately — publish state is unchanged by an edit.
        </p>
      </div>

      {/* Editor (rendered inline above the list when open). */}
      {editingId && isLoadingCurrent && (
        <p className="mb-4 text-sm text-gray-500">Loading record…</p>
      )}
      {editingId && currentError && (
        <p className="mb-4 text-sm text-red-600">{currentError}</p>
      )}
      {editingId && !isLoadingCurrent && !currentError && current && (
        <JudgeEditor
          key={current.id}
          judge={current}
          onClose={handleCloseEditor}
          onSaved={handleSaved}
        />
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange('pending')}
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
          onClick={() => handleTabChange('published')}
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
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-500">
          {tab === 'pending' ? 'Nothing awaiting review.' : 'No published records yet.'}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Judge</th>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Region</th>
                <th className="px-3 py-2">Appointed</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">
                  {tab === 'pending' ? 'Submitted' : 'Published'}
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <JudgeRow
                  key={item.id}
                  item={item}
                  busy={isReviewing}
                  showReviewActions={tab === 'pending'}
                  onEdit={handleEdit}
                  onApprove={handleApprove}
                  onReject={setRejecting}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
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