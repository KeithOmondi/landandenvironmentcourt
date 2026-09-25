// src/features/principalJudges/SuperAdminPrincipalJudge.tsx
//
// Super-admin review workspace for Principal Judge records.
//
// Scope:
//   - Pending review queue (fetchPendingPrincipalJudges).
//   - Published list, for reference.
//   - Approve / reject with a review note.
//   - Edit any record, any status (super admin override — the service
//     allows it; the buttons are shown optimistically).
//   - Delete any record, any status.
//
// The editor is the same shape as the one in AdminPrincipalJudge.tsx —
// a super admin who spots a typo while reviewing can fix it in place
// without bouncing to the admin workspace.
//
// Approve and the at-most-one-current rule:
//   When a record flagged `isCurrent` is approved, the server clears
//   the flag on the previously-current record in the same transaction.
//   After a successful approve, this page refetches the published
//   list so the swap is reflected immediately. The slice's reducer
//   only knows about the row that was approved — it can't know which
//   other row had `isCurrent` flipped, so the refetch is the correct
//   source of truth.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllPrincipalJudges,
  fetchPendingPrincipalJudges,
  fetchPrincipalJudgeById,
  updatePrincipalJudge,
  deletePrincipalJudge,
  approvePrincipalJudge,
  rejectPrincipalJudge,
  clearCurrent,
  clearSaveState,
  clearPendingError,
  clearAdminError,
  clearReviewState,
  type PrincipalJudge,
  type PrincipalJudgeInput,
  type PrincipalJudgeStatus,
} from '../../store/slices/principalJudgesSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const statusBadgeClass: Record<PrincipalJudgeStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }: { status: PrincipalJudgeStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const CurrentBadge = ({ isCurrent }: { isCurrent: boolean }) =>
  isCurrent ? (
    <span className="inline-block rounded-full bg-[#061e14] text-[#D4AF37] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">
      Current
    </span>
  ) : null;

const emptyInput = (): PrincipalJudgeInput => ({
  name: '',
  tenure: '',
  station: null,
  shortBio: '',
  fullBio: '',
  keyContributions: [],
  isCurrent: false,
});

const formFromJudge = (judge: PrincipalJudge | null): PrincipalJudgeInput =>
  judge
    ? {
        name: judge.name,
        tenure: judge.tenure,
        station: judge.station,
        shortBio: judge.shortBio,
        fullBio: judge.fullBio,
        keyContributions: [...judge.keyContributions],
        isCurrent: judge.isCurrent,
      }
    : emptyInput();

// ─── Contributions editor ────────────────────────────────────────────────────

interface ContributionsEditorProps {
  value: string;
  onChange: (next: string) => void;
}

const ContributionsEditor = ({ value, onChange }: ContributionsEditorProps) => (
  <div className="space-y-1.5">
    <span className="text-xs font-medium text-gray-600">
      Key administrative milestones
    </span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      placeholder={'One milestone per line.'}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
    />
    <p className="text-[10px] text-gray-500">
      One bullet per line. Blank lines are ignored.
    </p>
  </div>
);

// ─── Portrait picker ─────────────────────────────────────────────────────────

interface PortraitPickerProps {
  existingImageUrl: string | null;
  stagedFile: File | null;
  onPickFile: (file: File | null) => void;
}

const PortraitPicker = ({
  existingImageUrl,
  stagedFile,
  onPickFile,
}: PortraitPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(
    () => (stagedFile ? URL.createObjectURL(stagedFile) : null),
    [stagedFile],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onPickFile(file);
    e.target.value = '';
  };

  const shownUrl = previewUrl ?? existingImageUrl;

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-gray-600">Portrait</span>
      <div className="flex items-center gap-4">
        {shownUrl ? (
          <img
            src={shownUrl}
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
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
          >
            {stagedFile ? 'Choose a different file' : 'Choose image…'}
          </button>
          {stagedFile && (
            <button
              type="button"
              onClick={() => onPickFile(null)}
              className="text-xs text-red-700 hover:underline text-left"
            >
              Remove selected file
            </button>
          )}
          {!stagedFile && existingImageUrl && (
            <p className="text-[10px] text-gray-500">
              Existing portrait will be kept unless you pick a new file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Editor ──────────────────────────────────────────────────────────────────
//
// Same shape as the editor on the admin page. Rendered inline above
// the list with `key={id}` so switching records resets form state.

interface EditorProps {
  judge: PrincipalJudge;
  onClose: () => void;
  onSaved: () => void;
}

const PrincipalJudgeEditor = ({ judge, onClose, onSaved }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess } = useSelector(
    (s: RootState) => s.principalJudges,
  );

  const [form, setForm] = useState<PrincipalJudgeInput>(() =>
    formFromJudge(judge),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contributionsText, setContributionsText] = useState(
    judge.keyContributions.join('\n'),
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const keyContributions = contributionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      await dispatch(
        updatePrincipalJudge({
          id: judge.id,
          payload: { ...form, keyContributions },
          image: imageFile ?? undefined,
        }),
      ).unwrap();
      onSaved();
    } catch {
      // Slice already recorded saveError.
    }
  };

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
          name="tenure"
          value={form.tenure}
          onChange={handleChange}
          placeholder='Tenure (e.g. "2022 – Present")'
          className="rounded border border-gray-300 px-3 py-2 text-sm font-mono"
        />
        <input
          name="station"
          value={form.station ?? ''}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              station: e.target.value === '' ? null : e.target.value,
            }))
          }
          placeholder="Station (optional)"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          name="shortBio"
          value={form.shortBio}
          onChange={handleChange}
          rows={2}
          maxLength={400}
          placeholder="Short bio"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          name="fullBio"
          value={form.fullBio}
          onChange={handleChange}
          rows={5}
          placeholder="Full biography"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <ContributionsEditor
          value={contributionsText}
          onChange={setContributionsText}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isCurrent}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isCurrent: e.target.checked }))
            }
            className="rounded border-gray-300"
          />
          <span>Currently serving as Principal Judge</span>
        </label>
        <PortraitPicker
          existingImageUrl={judge.image?.url ?? null}
          stagedFile={imageFile}
          onPickFile={setImageFile}
        />

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

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: PrincipalJudge;
  busy: boolean;
  showReviewActions: boolean;
  onEdit: (id: string) => void;
  onApprove: (item: PrincipalJudge) => void;
  onReject: (item: PrincipalJudge) => void;
  onDelete: (item: PrincipalJudge) => void;
}

const PrincipalJudgeRow = ({
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
            {item.name
              .split(' ')
              .filter((p) => /^[A-Z]/.test(p))
              .slice(-2)
              .map((p) => p[0])
              .join('')}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            <CurrentBadge isCurrent={item.isCurrent} />
          </div>
          <div className="text-xs text-gray-500 font-mono">{item.tenure}</div>
        </div>
      </div>
    </td>
    <td className="px-3 py-2 text-xs text-gray-600">
      {item.station ?? '—'}
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
        <button
          type="button"
          onClick={() => onEdit(item.id)}
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
        >
          Edit
        </button>
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

const SuperAdminPrincipalJudge = () => {
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
  } = useSelector((s: RootState) => s.principalJudges);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [rejecting, setRejecting] = useState<PrincipalJudge | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initial load — pending queue is the primary surface.
  useEffect(() => {
    dispatch(fetchPendingPrincipalJudges());
  }, [dispatch]);

  // Published list is loaded lazily the first time the tab is opened.
  useEffect(() => {
    if (tab === 'published') dispatch(fetchAllPrincipalJudges());
  }, [tab, dispatch]);

  // When the super admin opens the editor, load the full record.
  useEffect(() => {
    if (editingId) dispatch(fetchPrincipalJudgeById(editingId));
  }, [editingId, dispatch]);

  // Clear transient error banners when switching tabs. State that
  // tracks user intent (the open editor, the reject dialog) is closed
  // from the click handlers below.
  useEffect(() => {
    dispatch(clearPendingError());
    dispatch(clearReviewState());
    dispatch(clearAdminError());
  }, [tab, dispatch]);

  const publishedItems = useMemo(
    () => adminItems.filter((i) => i.status === 'published'),
    [adminItems],
  );

  const handleApprove = async (item: PrincipalJudge) => {
    try {
      await dispatch(approvePrincipalJudge({ id: item.id })).unwrap();
      // If the approved record is flagged current, the service cleared
      // the flag on the previously-current record. The slice's
      // reducer only updated the row we know about; refetch both lists
      // so the swap is reflected.
      if (item.isCurrent) {
        dispatch(fetchPendingPrincipalJudges());
        dispatch(fetchAllPrincipalJudges());
      }
    } catch {
      // Slice already recorded reviewError.
    }
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejecting) return;
    try {
      await dispatch(
        rejectPrincipalJudge({ id: rejecting.id, reviewNote: note }),
      ).unwrap();
      setRejecting(null);
    } catch {
      // Slice already recorded reviewError; leave the dialog open so
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

  const handleDelete = async (item: PrincipalJudge) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    try {
      await dispatch(deletePrincipalJudge(item.id)).unwrap();
      if (editingId === item.id) handleCloseEditor();
    } catch {
      // Delete failed — likely a stale row. Refetch so the list
      // reflects the server's reality.
      dispatch(fetchPendingPrincipalJudges());
      dispatch(fetchAllPrincipalJudges());
      if (editingId === item.id) handleCloseEditor();
    }
  };

  const handleSaved = () => {
    // Close the editor on successful save. The slice already updated
    // `current` and `adminItems`; refreshing the lists keeps the
    // pending tab in sync if the record's status changed.
    handleCloseEditor();
    dispatch(fetchPendingPrincipalJudges());
    dispatch(fetchAllPrincipalJudges());
  };

  // Tab switch: close the editor and reject dialog, then switch.
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
          You don't have permission to review Principal Judge records.
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
        <h1 className="text-xl font-semibold">Principal Judge review</h1>
        <p className="text-sm text-gray-500">
          Approve, reject, edit, or delete Principal Judge records. Approving
          a record flagged "Current" automatically swaps the flag from any
          previously current record.
        </p>
      </div>

      {/* Editor rendered inline above the list. */}
      {editingId && isLoadingCurrent && (
        <p className="mb-4 text-sm text-gray-500">Loading record…</p>
      )}
      {editingId && currentError && (
        <p className="mb-4 text-sm text-red-600">{currentError}</p>
      )}
      {editingId && !isLoadingCurrent && !currentError && current && (
        <PrincipalJudgeEditor
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

      {/* Banners */}
      {reviewSuccess && (
        <p className="mb-2 text-sm text-green-600">Review action applied.</p>
      )}
      {reviewError && <p className="mb-2 text-sm text-red-600">{reviewError}</p>}
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-500">
          {tab === 'pending'
            ? 'Nothing awaiting review.'
            : 'No published records yet.'}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">
                  {tab === 'pending' ? 'Submitted' : 'Published'}
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <PrincipalJudgeRow
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

export default SuperAdminPrincipalJudge;