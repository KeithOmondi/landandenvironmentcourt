// src/features/documents/AdminDocuments.tsx
//
// Admin documents workspace.
//
//   - Lists every document, any status (fetchAllDocuments).
//   - Opens one document in an editor (fetchDocumentById /
//     createDocument / updateDocument).
//   - Submits drafts/rejected for review (submitDocument).
//   - Deletes the caller's own drafts/rejected (deleteDocument).
//   - Super admins additionally see: pending queue, approve, reject.
//     The backend enforces the role; we just don't render controls the
//     user can't use.
//
// All HTTP lives in the slice. This file only dispatches thunks and
// reads state.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllDocuments,
  fetchPendingDocuments,
  fetchDocumentById,
  createDocument,
  updateDocument,
  submitDocument,
  deleteDocument,
  approveDocument,
  rejectDocument,
  uploadDocumentFile,
  clearCurrent,
  clearSaveState,
  clearUploadError,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATIONS,
  type Document,
  type DocumentInput,
  type DocumentSummary,
  type DocumentStatus,
} from '../../store/slices/documentsSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Small helpers ───────────────────────────────────────────────────────────

const statusBadgeClass: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }: { status: DocumentStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

/**
 * Format a date-only string ("YYYY-MM-DD") for display.
 *
 * Deliberately does NOT call `new Date(iso)` and then format — that
 * would re-introduce the timezone conversion we avoided on the server.
 * Splitting the string and using the parts keeps the displayed date
 * exactly the one stored, regardless of the viewer's timezone.
 */
const formatIssuedAt = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIndex = Number(m) - 1;
  const monthName = monthNames[monthIndex] ?? m;
  return `${monthName} ${d}, ${y}`;
};

const todayIso = (): string => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const emptyInput = (): DocumentInput => ({
  title: '',
  description: '',
  category: DOCUMENT_CATEGORIES[0],
  station: DOCUMENT_STATIONS[0],
  issuedAt: todayIso(),
  fileUrl: '',
  filePublicId: '',
  fileBytes: 0,
  fileSize: '',
});

// Derive the initial form value from the document prop. Used as the
// lazy initializer for useState so we never call setState in an effect.
const formFromDocument = (document: Document | null): DocumentInput =>
  document
    ? {
        title: document.title,
        description: document.description,
        category: document.category,
        station: document.station,
        issuedAt: document.issuedAt,
        fileUrl: document.fileUrl,
        filePublicId: document.filePublicId,
        fileBytes: document.fileBytes,
        fileSize: document.fileSize,
      }
    : emptyInput();

// ─── Editor ──────────────────────────────────────────────────────────────────
//
// Rendered with `key={document?.id ?? 'new'}` from the parent, so
// switching documents remounts this component and resets form state.

interface EditorProps {
  document: Document | null;
  onClose: () => void;
}

const DocumentEditor = ({ document, onClose }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess, isUploading, uploadError } =
    useSelector((s: RootState) => s.documents);

  const [form, setForm] = useState<DocumentInput>(() =>
    formFromDocument(document),
  );
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Pre-check the MIME type on the client so the user gets an instant
    // answer rather than a round-trip 400. The server enforces the same
    // rule via multer's fileFilter.
    if (file.type !== 'application/pdf') {
      setLocalFileError('Only PDF files are accepted.');
      return;
    }
    setLocalFileError(null);

    const result = await dispatch(uploadDocumentFile(file)).unwrap();
    setForm((prev) => ({
      ...prev,
      fileUrl: result.fileUrl,
      filePublicId: result.filePublicId,
      fileBytes: result.fileBytes,
      fileSize: result.fileSize,
    }));
  };

  const handleSave = async () => {
    try {
      if (document) {
        await dispatch(
          updateDocument({ documentId: document.id, payload: form }),
        ).unwrap();
      } else {
        await dispatch(createDocument(form)).unwrap();
      }
    } catch {
      // The slice has already recorded saveError; nothing else to do.
    }
  };

  // A document can't be saved without a file — the validator requires
  // a non-empty fileUrl. Show the button disabled rather than letting
  // the user submit and get a 400.
  const canSave =
    form.fileUrl.trim().length > 0 && form.filePublicId.trim().length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {document ? `Edit: ${document.title}` : 'New document'}
        </h2>
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
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          rows={3}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs text-gray-600">
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-gray-600 sm:col-span-2">
            Station
            <select
              name="station"
              value={form.station}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {DOCUMENT_STATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-xs text-gray-600">
          Issue date
          <input
            type="date"
            name="issuedAt"
            value={form.issuedAt}
            onChange={handleChange}
            className="mt-1 w-full sm:w-64 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        {/* File upload */}
        <div className="rounded border border-dashed border-gray-300 p-3 space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
            />
            {isUploading && (
              <span className="text-xs text-gray-500">Uploading…</span>
            )}
          </div>

          {form.fileUrl && (
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>
                <span className="font-medium">Uploaded:</span>{' '}
                <a
                  href={form.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  view file
                </a>
              </div>
              <div>
                <span className="font-medium">Size:</span> {form.fileSize}
              </div>
            </div>
          )}

          {localFileError && (
            <p className="text-xs text-red-600">{localFileError}</p>
          )}
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-green-600">Saved.</p>}

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !canSave}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : document ? 'Save changes' : 'Create draft'}
          </button>
          {!canSave && (
            <span className="text-xs text-gray-500">
              Upload a PDF before saving.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: DocumentSummary;
  isSuperAdmin: boolean;
  onEdit: (id: string) => void;
}

const DocumentRow = ({ item, isSuperAdmin, onEdit }: RowProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDeleting, isReviewing } = useSelector(
    (s: RootState) => s.documents,
  );

  const canEdit = item.status === 'draft' || item.status === 'rejected';
  const canSubmit = canEdit;
  const canReview = isSuperAdmin && item.status === 'pending';

  const handleDelete = () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    dispatch(deleteDocument(item.id));
  };

  const handleSubmit = () => dispatch(submitDocument(item.id));

  const handleApprove = () => {
    const note = prompt('Review note (optional):') ?? undefined;
    dispatch(
      approveDocument({ documentId: item.id, reviewNote: note || undefined }),
    );
  };

  const handleReject = () => {
    const note = prompt('Reason for rejection:');
    if (!note) return;
    dispatch(rejectDocument({ documentId: item.id, reviewNote: note }));
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2">
        <div className="font-medium">{item.title}</div>
        <div className="text-xs text-gray-500 line-clamp-1">
          {item.description}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">{item.category}</td>
      <td className="px-3 py-2 text-xs text-gray-600">{item.station}</td>
      <td className="px-3 py-2 text-xs text-gray-600">
        {formatIssuedAt(item.issuedAt)}
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">{item.fileSize}</td>
      <td className="px-3 py-2">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
          >
            View PDF
          </a>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded border border-amber-300 px-2 py-1 text-amber-800 hover:bg-amber-50"
            >
              Submit
            </button>
          )}
          {canReview && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isReviewing}
                className="rounded border border-green-300 px-2 py-1 text-green-800 hover:bg-green-50 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isReviewing}
                className="rounded border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded border border-red-300 px-2 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const AdminDocuments = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    adminItems,
    isLoadingAdmin,
    adminError,
    pendingItems,
    isLoadingPending,
    pendingError,
    current,
    isLoadingCurrent,
    currentError,
    reviewError,
    deleteError,
  } = useSelector((s: RootState) => s.documents);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    dispatch(fetchAllDocuments());
  }, [dispatch]);

  // Only super admins need the pending queue.
  useEffect(() => {
    if (tab === 'pending' && isSuperAdmin) {
      dispatch(fetchPendingDocuments());
    }
  }, [tab, isSuperAdmin, dispatch]);

  // When the user clicks Edit, load the full document into `current`.
  useEffect(() => {
    if (editingId) dispatch(fetchDocumentById(editingId));
  }, [editingId, dispatch]);

  const showEditor = isCreating || editingId !== null;
  const editorDocument = editingId ? current : null;

  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    dispatch(clearCurrent());
    dispatch(clearSaveState());
    dispatch(clearUploadError());
  };

  const handleOpenEdit = (id: string) => {
    setIsCreating(false);
    setEditingId(id);
    dispatch(clearSaveState());
    dispatch(clearUploadError());
  };

  const closeEditor = () => {
    setIsCreating(false);
    setEditingId(null);
    dispatch(clearCurrent());
    dispatch(clearSaveState());
    dispatch(clearUploadError());
  };

  const rows = useMemo(
    () => (tab === 'pending' ? pendingItems : adminItems),
    [tab, pendingItems, adminItems],
  );

  const loading = tab === 'pending' ? isLoadingPending : isLoadingAdmin;
  const error = tab === 'pending' ? pendingError : adminError;

  const editorKey = isCreating ? 'new' : (editingId ?? 'new');

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Documents admin</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          New document
        </button>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`px-3 py-2 text-sm ${
            tab === 'all'
              ? 'border-b-2 border-blue-600 font-medium text-blue-600'
              : 'text-gray-600'
          }`}
        >
          All documents
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`px-3 py-2 text-sm ${
              tab === 'pending'
                ? 'border-b-2 border-blue-600 font-medium text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Pending review
            {pendingItems.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {pendingItems.length}
              </span>
            )}
          </button>
        )}
      </div>

      {showEditor && (
        <div className="mb-6">
          {editingId && isLoadingCurrent && (
            <p className="text-sm text-gray-500">Loading document…</p>
          )}
          {editingId && currentError && (
            <p className="text-sm text-red-600">{currentError}</p>
          )}
          {(!editingId || (!isLoadingCurrent && !currentError)) && (
            <DocumentEditor
              key={editorKey}
              document={editorDocument}
              onClose={closeEditor}
            />
          )}
        </div>
      )}

      {reviewError && (
        <p className="mb-2 text-sm text-red-600">{reviewError}</p>
      )}
      {deleteError && (
        <p className="mb-2 text-sm text-red-600">{deleteError}</p>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-500">
          {tab === 'pending' ? 'Nothing awaiting review.' : 'No documents yet.'}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <DocumentRow
                  key={item.id}
                  item={item}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={handleOpenEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;