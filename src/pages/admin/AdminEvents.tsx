// src/features/events/AdminEvents.tsx
//
// Admin events workspace.
//
//   - Lists every event, any status (fetchAllEvents).
//   - Opens one event in an editor (fetchEventById / createEvent / updateEvent).
//   - Submits drafts/rejected for review (submitEvent).
//   - Deletes the caller's own drafts/rejected (deleteEvent).
//   - Super admins additionally see: pending queue, approve, reject,
//     feature toggle. The backend enforces the role; we just don't
//     render controls the user can't use.
//
// All HTTP lives in the slice. This file only dispatches thunks and
// reads state.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllEvents,
  fetchPendingEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  submitEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  setFeaturedEvent,
  uploadEventImage,
  clearCurrent,
  clearSaveState,
  clearUploadError,
  EVENT_CATEGORIES,
  type Event,
  //type EventCategory,
  type EventInput,
  type EventSummary,
  type EventStatus,
} from '../../store/slices/eventsSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Small helpers ───────────────────────────────────────────────────────────

const statusBadgeClass: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }: { status: EventStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Convert an ISO date-time string into the local format that
 * `<input type="datetime-local">` expects: `YYYY-MM-DDTHH:mm`.
 *
 * This is lossy in one direction only: the input has no timezone
 * field, so the browser interprets the value as local time. That's the
 * right behavior for this editor — an admin scheduling a Nairobi event
 * wants to type Nairobi time, not UTC.
 */
const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/**
 * Convert `<input type="datetime-local">` output back to a canonical
 * ISO string the API accepts. The input gives local time; `new Date()`
 * interprets that and produces the UTC equivalent for the wire.
 */
const fromDateTimeLocal = (value: string): string => {
  if (!value) return '';
  return new Date(value).toISOString();
};

// Derive the initial form value from the event prop. Used as the lazy
// initializer for useState so we never call setState inside an effect.
const formFromEvent = (event: Event | null): EventInput => {
  if (!event) {
    return {
      title: '',
      summary: '',
      content: '',
      organizer: '',
      category: EVENT_CATEGORIES[0],
      startsAt: '',
      endsAt: '',
      location: '',
      imageUrl: '',
      imagePublicId: null,
      isFeatured: false,
    };
  }
  return {
    title: event.title,
    summary: event.summary,
    content: event.content,
    organizer: event.organizer,
    category: event.category,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    imageUrl: event.imageUrl,
    imagePublicId: event.imagePublicId,
    isFeatured: event.isFeatured,
  };
};

// ─── Editor ──────────────────────────────────────────────────────────────────
//
// Rendered with `key={event?.id ?? 'new'}` from the parent, so switching
// events remounts this component and resets form state.

interface EditorProps {
  event: Event | null;
  onClose: () => void;
}

const EventEditor = ({ event, onClose }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess, isUploading, uploadError } =
    useSelector((s: RootState) => s.events);

  const [form, setForm] = useState<EventInput>(() => formFromEvent(event));

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await dispatch(uploadEventImage(file)).unwrap();
    setForm((prev) => ({
      ...prev,
      imageUrl: result.imageUrl,
      imagePublicId: result.imagePublicId,
    }));
  };

  const handleSave = async () => {
    if (event) {
      await dispatch(
        updateEvent({ eventId: event.id, payload: form }),
      ).unwrap();
    } else {
      await dispatch(createEvent(form)).unwrap();
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {event ? `Edit: ${event.title}` : 'New event'}
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
        <input
          name="organizer"
          value={form.organizer}
          onChange={handleChange}
          placeholder="Organizer"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-600">
            Starts
            <input
              type="datetime-local"
              name="startsAt"
              value={toDateTimeLocal(form.startsAt)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  startsAt: fromDateTimeLocal(e.target.value),
                }))
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Ends
            <input
              type="datetime-local"
              name="endsAt"
              value={toDateTimeLocal(form.endsAt)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  endsAt: fromDateTimeLocal(e.target.value),
                }))
              }
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          placeholder="Summary"
          rows={2}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Content"
          rows={8}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleImage} />
          {isUploading && (
            <span className="text-xs text-gray-500">Uploading…</span>
          )}
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Header preview"
              className="h-12 w-20 rounded object-cover"
            />
          )}
        </div>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleChange}
          />
          Featured
        </label>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-green-600">Saved.</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : event ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: EventSummary;
  isSuperAdmin: boolean;
  onEdit: (id: string) => void;
}

const EventRow = ({ item, isSuperAdmin, onEdit }: RowProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDeleting, isReviewing } = useSelector((s: RootState) => s.events);

  const canEdit = item.status === 'draft' || item.status === 'rejected';
  const canSubmit = canEdit;
  const canReview = isSuperAdmin && item.status === 'pending';
  const canFeature = isSuperAdmin && item.status === 'published';

  const handleDelete = () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    dispatch(deleteEvent(item.id));
  };

  const handleSubmit = () => dispatch(submitEvent(item.id));

  const handleApprove = () => {
    const note = prompt('Review note (optional):') ?? undefined;
    dispatch(approveEvent({ eventId: item.id, reviewNote: note || undefined }));
  };

  const handleReject = () => {
    const note = prompt('Reason for rejection:');
    if (!note) return;
    dispatch(rejectEvent({ eventId: item.id, reviewNote: note }));
  };

  const handleFeature = () =>
    dispatch(
      setFeaturedEvent({ eventId: item.id, isFeatured: !item.isFeatured }),
    );

  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              className="h-9 w-14 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-gray-500">{item.organizer}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">{item.category}</td>
      <td className="px-3 py-2">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">
        {item.isFeatured ? '★' : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">
        {formatDate(item.startsAt)}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2 text-xs">
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
          {canFeature && (
            <button
              type="button"
              onClick={handleFeature}
              disabled={isReviewing}
              className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
            >
              {item.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
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

const AdminEvents = () => {
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
  } = useSelector((s: RootState) => s.events);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    dispatch(fetchAllEvents());
  }, [dispatch]);

  // Only super admins need the pending queue.
  useEffect(() => {
    if (tab === 'pending' && isSuperAdmin) {
      dispatch(fetchPendingEvents());
    }
  }, [tab, isSuperAdmin, dispatch]);

  // When the user clicks Edit, load the full event into `current`.
  useEffect(() => {
    if (editingId) dispatch(fetchEventById(editingId));
  }, [editingId, dispatch]);

  const showEditor = isCreating || editingId !== null;
  const editorEvent = editingId ? current : null;

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
        <h1 className="text-xl font-semibold">Events admin</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          New event
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
          All events
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
            <p className="text-sm text-gray-500">Loading event…</p>
          )}
          {editingId && currentError && (
            <p className="text-sm text-red-600">{currentError}</p>
          )}
          {(!editingId || (!isLoadingCurrent && !currentError)) && (
            <EventEditor
              key={editorKey}
              event={editorEvent}
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
          {tab === 'pending' ? 'Nothing awaiting review.' : 'No events yet.'}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Featured</th>
                <th className="px-3 py-2">Starts</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <EventRow
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

export default AdminEvents;