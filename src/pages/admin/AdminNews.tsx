// src/features/news/AdminNews.tsx
//
// Admin news workspace.
//
//   - Lists every article, any status (fetchAllNews).
//   - Opens one article in a modal editor (fetchNewsById / createNews / updateNews).
//   - Submits drafts/rejected for review (submitNews).
//   - Deletes the caller's own drafts/rejected (deleteNews).
//   - Super admins additionally see: pending queue, approve, reject,
//     feature toggle. The backend enforces the role; we just don't
//     render controls the user can't use.
//
// All HTTP lives in the slice. This file only dispatches thunks and
// reads state.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllNews,
  fetchPendingNews,
  fetchNewsById,
  createNews,
  updateNews,
  submitNews,
  deleteNews,
  approveNews,
  rejectNews,
  setFeaturedNews,
  uploadNewsImage,
  clearCurrent,
  clearSaveState,
  clearUploadError,
  type News,
  type NewsInput,
  type NewsSummary,
  type NewsStatus,
} from '../../store/slices/newsSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Visual Helpers & Badges ─────────────────────────────────────────────────

const statusBadgeClass: Record<NewsStatus, string> = {
  draft: 'bg-stone-100 text-stone-700 border-stone-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

const StatusBadge = ({ status }: { status: NewsStatus }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize tracking-wide ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const emptyInput: NewsInput = {
  title: '',
  summary: '',
  content: '',
  author: '',
  imageUrl: '',
  imagePublicId: null,
  isFeatured: false,
};

const formFromArticle = (article: News | null): NewsInput =>
  article
    ? {
        title: article.title,
        summary: article.summary,
        content: article.content,
        author: article.author,
        imageUrl: article.imageUrl,
        imagePublicId: article.imagePublicId,
        isFeatured: article.isFeatured,
      }
    : emptyInput;

// ─── Modal News Editor ───────────────────────────────────────────────────────

interface EditorModalProps {
  article: News | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const NewsEditorModal = ({ article, isLoading, error, onClose }: EditorModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess, isUploading, uploadError } =
    useSelector((s: RootState) => s.news);

  // Form state initializes cleanly on mount when keyed by parent component
  const [form, setForm] = useState<NewsInput>(() => formFromArticle(article));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await dispatch(uploadNewsImage(file)).unwrap();
    setForm((prev) => ({
      ...prev,
      imageUrl: result.imageUrl,
      imagePublicId: result.imagePublicId,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (article) {
        await dispatch(updateNews({ newsId: article.id, payload: form })).unwrap();
      } else {
        await dispatch(createNews(form)).unwrap();
      }
      onClose();
    } catch {
      // Error handling is managed via Redux state slice
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              {article ? 'Edit Article' : 'Compose Article'}
            </h2>
            <p className="text-xs text-stone-500">
              {article ? 'Update details and publish state.' : 'Create a new draft for editorial review.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-serif text-stone-500">
            Loading article details…
          </div>
        ) : error ? (
          <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Headline title..."
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 font-serif text-base text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Author
              </label>
              <input
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="Byline / Author name..."
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Summary
              </label>
              <textarea
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="Short lead paragraph or summary..."
                rows={2}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Body Content
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write the article content..."
                rows={6}
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 font-serif text-sm text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            {/* Media & Options */}
            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Header Image
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="block w-full text-xs text-stone-500 file:mr-4 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-stone-800"
                />
                {isUploading && <span className="animate-pulse text-xs text-stone-500">Uploading…</span>}
              </div>
              {form.imageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={form.imageUrl}
                    alt="Header preview"
                    className="h-16 w-28 rounded-md border border-stone-200 object-cover shadow-sm"
                  />
                  <span className="text-xs text-stone-500">Image attached</span>
                </div>
              )}
              {uploadError && <p className="mt-2 text-xs text-rose-600">{uploadError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-stone-700">
                Mark as Featured Article
              </label>
            </div>

            {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
            {saveSuccess && <p className="text-xs text-emerald-600">Saved successfully.</p>}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : article ? 'Update Article' : 'Save Draft'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Card View Item ──────────────────────────────────────────────────────────

interface CardProps {
  item: NewsSummary;
  isSuperAdmin: boolean;
  onEdit: (id: string) => void;
}

const NewsCard = ({ item, isSuperAdmin, onEdit }: CardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDeleting, isReviewing } = useSelector((s: RootState) => s.news);

  const canEdit = item.status === 'draft' || item.status === 'rejected';
  const canSubmit = canEdit;
  const canReview = isSuperAdmin && item.status === 'pending';
  const canFeature = isSuperAdmin && item.status === 'published';

  const handleDelete = () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    dispatch(deleteNews(item.id));
  };

  const handleSubmit = () => dispatch(submitNews(item.id));

  const handleApprove = () => {
    const note = prompt('Review note (optional):') ?? undefined;
    dispatch(approveNews({ newsId: item.id, reviewNote: note || undefined }));
  };

  const handleReject = () => {
    const note = prompt('Reason for rejection:');
    if (!note) return;
    dispatch(rejectNews({ newsId: item.id, reviewNote: note }));
  };

  const handleFeature = () =>
    dispatch(setFeaturedNews({ newsId: item.id, isFeatured: !item.isFeatured }));

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div>
        {/* Card Media Preview */}
        <div className="relative h-44 w-full bg-stone-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-xs text-stone-400">
              No Header Image
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {item.isFeatured && (
              <span className="inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900 shadow-sm">
                ★ Featured
              </span>
            )}
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Content Details */}
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {item.author || 'Anonymous'} • {new Date(item.updatedAt).toLocaleDateString()}
          </p>
          <h3 className="mt-1 font-serif text-lg font-bold tracking-tight text-stone-900 line-clamp-2">
            {item.title}
          </h3>
          {item.summary && (
            <p className="mt-2 text-xs text-stone-600 line-clamp-2">{item.summary}</p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="rounded border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
            >
              Edit
            </button>
          )}
          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
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
                className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isReviewing}
                className="rounded border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {canFeature && (
            <button
              type="button"
              onClick={handleFeature}
              disabled={isReviewing}
              className="rounded border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            >
              {item.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-auto text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── Main Admin Workspace ───────────────────────────────────────────────────

const AdminNews = () => {
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
  } = useSelector((s: RootState) => s.news);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    dispatch(fetchAllNews());
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'pending' && isSuperAdmin) {
      dispatch(fetchPendingNews());
    }
  }, [tab, isSuperAdmin, dispatch]);

  useEffect(() => {
    if (editingId) dispatch(fetchNewsById(editingId));
  }, [editingId, dispatch]);

  const showModal = isCreating || editingId !== null;
  const editorArticle = editingId ? current : null;

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

  const closeModal = () => {
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

  return (
    <div className="min-h-screen bg-stone-50/50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Editorial Top Header */}
        <div className="mb-8 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Editorial Control Panel
              </span>
              <h1 className="font-serif text-4xl font-extrabold tracking-tight text-stone-900">
                News Workspace
              </h1>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-stone-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compose Article
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-6">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`pb-3 text-sm font-medium transition ${
                tab === 'all'
                  ? 'border-b-2 border-stone-900 font-semibold text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All Articles ({adminItems.length})
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setTab('pending')}
                className={`relative pb-3 text-sm font-medium transition ${
                  tab === 'pending'
                    ? 'border-b-2 border-stone-900 font-semibold text-stone-900'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Pending Review
                {pendingItems.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {pendingItems.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {reviewError && (
          <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{reviewError}</div>
        )}
        {deleteError && (
          <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{deleteError}</div>
        )}

        {/* Article Grid Content Display */}
        {loading && (
          <div className="py-16 text-center font-serif text-stone-500">
            Fetching articles...
          </div>
        )}

        {error && (
          <div className="rounded-md bg-rose-50 p-4 text-center text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <h3 className="font-serif text-lg font-bold text-stone-800">No articles found</h3>
            <p className="mt-1 text-sm text-stone-500">
              {tab === 'pending' ? 'All clear! No articles currently awaiting approval.' : 'Start by creating your first article.'}
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isSuperAdmin={isSuperAdmin}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}

        {/* Editor Modal Window with key reset */}
        {showModal && (
          <NewsEditorModal
            key={editingId ?? 'new'}
            article={editorArticle}
            isLoading={Boolean(editingId && isLoadingCurrent)}
            error={editingId ? currentError : null}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
};

export default AdminNews;