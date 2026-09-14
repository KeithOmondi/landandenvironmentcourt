// src/features/judges/AdminJudges.tsx
//
// Admin judges workspace.
//
//   - Lists every judge record, any status (fetchAllJudges).
//   - Opens one record in an editor (fetchJudgeById / createJudge /
//     updateJudge).
//   - Submits drafts/rejected for review (submitJudge).
//   - Deletes the caller's own drafts/rejected (deleteJudge).
//   - Super admins additionally see: pending queue, approve, reject.
//     The backend enforces the role; we just don't render controls the
//     user can't use.
//
// The editor is the most involved of the six features: education is a
// repeatable sub-form, specializations is a tag input. Both are
// structured but the base pattern (controlled inputs, no setState in
// effects, editor remount via key) is the same as the others.

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllJudges,
  fetchPendingJudges,
  fetchJudgeById,
  createJudge,
  updateJudge,
  submitJudge,
  deleteJudge,
  approveJudge,
  rejectJudge,
  clearCurrent,
  clearSaveState,
  JUDGE_REGIONS,
  type Judge,
  type JudgeInput,
  type JudgeSummary,
  type JudgeStatus,
  type EducationEntry,
} from '../../store/slices/judgesSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Small helpers ───────────────────────────────────────────────────────────

const statusBadgeClass: Record<JudgeStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }: { status: JudgeStatus }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass[status]}`}
  >
    {status}
  </span>
);

const emptyInput = (): JudgeInput => ({
  name: '',
  title: '',
  station: '',
  region: JUDGE_REGIONS[0],
  appointedYear: String(new Date().getFullYear()),
  bio: '',
  education: [{ degree: '', institution: '' }],
  specializations: [],
  imageUrl: '',
});

const formFromJudge = (judge: Judge | null): JudgeInput =>
  judge
    ? {
        name: judge.name,
        title: judge.title,
        station: judge.station,
        region: judge.region,
        appointedYear: judge.appointedYear,
        bio: judge.bio,
        // Defensive copy so editing doesn't mutate the Redux-stored array.
        education:
          judge.education.length > 0
            ? judge.education.map((e) => ({ ...e }))
            : [{ degree: '', institution: '' }],
        specializations: [...judge.specializations],
        imageUrl: judge.imageUrl,
      }
    : emptyInput();

// ─── Education editor ────────────────────────────────────────────────────────
//
// Repeatable rows. Each row is one EducationEntry. Add inserts a blank
// row; Remove deletes the row at that index. An empty list is allowed
// in the UI but not on the wire — the validator requires at least one
// entry — so we always keep a single blank row when the user removes
// the last one.

interface EducationEditorProps {
  entries: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
}

const EducationEditor = ({ entries, onChange }: EducationEditorProps) => {
  const handleField = (
    index: number,
    field: keyof EducationEntry,
    value: string,
  ) => {
    const next = entries.map((entry, i) =>
      i === index
        ? {
            ...entry,
            [field]: value === '' && field === 'year' ? undefined : value,
          }
        : entry,
    );
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...entries, { degree: '', institution: '' }]);
  };

  const handleRemove = (index: number) => {
    if (entries.length <= 1) {
      // Never let the list go empty — the validator requires ≥ 1 and
      // an empty editor is confusing. Reset the single row instead.
      onChange([{ degree: '', institution: '' }]);
      return;
    }
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          Academic qualifications
        </span>
        <button
          type="button"
          onClick={handleAdd}
          disabled={entries.length >= 10}
          className="text-xs text-blue-600 hover:underline disabled:opacity-40"
        >
          + Add entry
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_auto] gap-2 items-start rounded border border-gray-200 bg-gray-50 p-2"
          >
            <input
              value={entry.degree}
              onChange={(e) => handleField(index, 'degree', e.target.value)}
              placeholder="Degree (e.g. LL.B)"
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              value={entry.institution}
              onChange={(e) =>
                handleField(index, 'institution', e.target.value)
              }
              placeholder="Institution"
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              value={entry.year ?? ''}
              onChange={(e) => handleField(index, 'year', e.target.value)}
              placeholder="Year"
              maxLength={4}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="rounded border border-red-200 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50 self-stretch"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Specializations editor ──────────────────────────────────────────────────
//
// Tag input: type a value, press Enter (or comma) to add. Each tag has
// a small × to remove. Empty input + Enter does nothing. Values are
// trimmed and deduplicated.

interface SpecializationsEditorProps {
  tags: string[];
  onChange: (next: string[]) => void;
}

const SpecializationsEditor = ({
  tags,
  onChange,
}: SpecializationsEditorProps) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    if (tags.includes(value)) {
      setDraft('');
      return;
    }
    if (tags.length >= 10) return;
    onChange([...tags, value]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      // Backspace on an empty input removes the last tag — a small
      // convenience familiar from most tag inputs.
      onChange(tags.slice(0, -1));
    }
  };

  const handleRemove = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-gray-600">
        Specializations
      </span>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-900"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-emerald-700 hover:text-emerald-900"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={
          tags.length >= 10
            ? 'Maximum of 10 specializations reached'
            : 'Type a specialization and press Enter'
        }
        disabled={tags.length >= 10}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
      />
    </div>
  );
};

// ─── Editor ──────────────────────────────────────────────────────────────────
//
// Rendered with `key={judge?.id ?? 'new'}` from the parent, so switching
// records remounts this component and resets form state.

interface EditorProps {
  judge: Judge | null;
  onClose: () => void;
}

const JudgeEditor = ({ judge, onClose }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess } = useSelector(
    (s: RootState) => s.judges,
  );

  const [form, setForm] = useState<JudgeInput>(() => formFromJudge(judge));

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
      if (judge) {
        await dispatch(
          updateJudge({ judgeId: judge.id, payload: form }),
        ).unwrap();
      } else {
        await dispatch(createJudge(form)).unwrap();
      }
    } catch {
      // The slice has already recorded saveError.
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {judge ? `Edit: ${judge.name}` : 'New judge record'}
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
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name (e.g. Hon. Justice Jane Doe)"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title (e.g. ELC Judge)"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="station"
            value={form.station}
            onChange={handleChange}
            placeholder="Station (e.g. Nairobi ELC Station)"
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
                <option key={r} value={r}>
                  {r}
                </option>
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
            placeholder="YYYY"
            maxLength={4}
            className="mt-1 w-full sm:w-40 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Biography — judicial role, career highlights"
          rows={5}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <EducationEditor
          entries={form.education}
          onChange={(next) =>
            setForm((prev) => ({ ...prev, education: next }))
          }
        />

        <SpecializationsEditor
          tags={form.specializations}
          onChange={(next) =>
            setForm((prev) => ({ ...prev, specializations: next }))
          }
        />

        <label className="text-xs text-gray-600">
          Portrait URL (optional)
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://…"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
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
            {isSaving ? 'Saving…' : judge ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: JudgeSummary;
  isSuperAdmin: boolean;
  onEdit: (id: string) => void;
}

const JudgeRow = ({ item, isSuperAdmin, onEdit }: RowProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDeleting, isReviewing } = useSelector((s: RootState) => s.judges);

  const canEdit = item.status === 'draft' || item.status === 'rejected';
  const canSubmit = canEdit;
  const canReview = isSuperAdmin && item.status === 'pending';

  const handleDelete = () => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    dispatch(deleteJudge(item.id));
  };

  const handleSubmit = () => dispatch(submitJudge(item.id));

  const handleApprove = () => {
    const note = prompt('Review note (optional):') ?? undefined;
    dispatch(approveJudge({ judgeId: item.id, reviewNote: note || undefined }));
  };

  const handleReject = () => {
    const note = prompt('Reason for rejection:');
    if (!note) return;
    dispatch(rejectJudge({ judgeId: item.id, reviewNote: note }));
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
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

const AdminJudges = () => {
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
  } = useSelector((s: RootState) => s.judges);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    dispatch(fetchAllJudges());
  }, [dispatch]);

  // Only super admins need the pending queue.
  useEffect(() => {
    if (tab === 'pending' && isSuperAdmin) {
      dispatch(fetchPendingJudges());
    }
  }, [tab, isSuperAdmin, dispatch]);

  // When the user clicks Edit, load the full record into `current`.
  useEffect(() => {
    if (editingId) dispatch(fetchJudgeById(editingId));
  }, [editingId, dispatch]);

  const showEditor = isCreating || editingId !== null;
  const editorJudge = editingId ? current : null;

  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    dispatch(clearCurrent());
    dispatch(clearSaveState());
  };

  const handleOpenEdit = (id: string) => {
    setIsCreating(false);
    setEditingId(id);
    dispatch(clearSaveState());
  };

  const closeEditor = () => {
    setIsCreating(false);
    setEditingId(null);
    dispatch(clearCurrent());
    dispatch(clearSaveState());
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
        <h1 className="text-xl font-semibold">Judges admin</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          New judge record
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
          All records
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
            <p className="text-sm text-gray-500">Loading record…</p>
          )}
          {editingId && currentError && (
            <p className="text-sm text-red-600">{currentError}</p>
          )}
          {(!editingId || (!isLoadingCurrent && !currentError)) && (
            <JudgeEditor
              key={editorKey}
              judge={editorJudge}
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
          {tab === 'pending' ? 'Nothing awaiting review.' : 'No records yet.'}
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
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <JudgeRow
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

export default AdminJudges;