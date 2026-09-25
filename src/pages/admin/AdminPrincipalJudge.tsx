// src/features/principalJudges/AdminPrincipalJudge.tsx
//
// Admin workspace for Principal Judge records.
//
// Scope: edit and prepare records for review.
//   - Lists every record, any status (fetchAllPrincipalJudges).
//   - Opens one record in an editor (fetchPrincipalJudgeById /
//     createPrincipalJudge / updatePrincipalJudge).
//   - Submits drafts and rejected records for review
//     (submitPrincipalJudge).
//   - Deletes the caller's own drafts and rejected records
//     (deletePrincipalJudge).
//
// Super admins see the same page and additionally have the full
// delete/edit override on any record, since the service allows it.
// The approve / reject workflow lives on the super-admin page —
// AdminPrincipalJudge.tsx is for editorial work, not review.
//
// Portraits:
//   - The image is a separate `File` staged by the file input and sent
//     alongside the payload. On update, "no file picked" means "leave
//     the existing portrait alone".
//   - There is no client-side "clear portrait" action yet — the route
//     isn't wired. See judgesSlice for the same note.
//
// The editor is rendered inline above the list, with `key={id}` on
// the editor so switching records remounts it and resets form state.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllPrincipalJudges,
  fetchPrincipalJudgeById,
  createPrincipalJudge,
  updatePrincipalJudge,
  submitPrincipalJudge,
  deletePrincipalJudge,
  clearCurrent,
  clearSaveState,
  type PrincipalJudge,
  type PrincipalJudgeInput,
  type PrincipalJudgeStatus,
} from '../../store/slices/principalJudgesSlice';
import { isSuperAdmin as userIsSuperAdmin } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';

// ─── Small helpers ───────────────────────────────────────────────────────────

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
        // Defensive copy so edits don't mutate the Redux-stored array.
        keyContributions: [...judge.keyContributions],
        isCurrent: judge.isCurrent,
      }
    : emptyInput();

// ─── Contributions editor ────────────────────────────────────────────────────
//
// Textarea, one contribution per line. Simpler than a repeatable input
// and works well for a list of five or six bullets. Blank lines are
// stripped on save.

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
      placeholder={
        'One milestone per line, e.g.\n' +
        'Expanded specialized ELC stations to over 38 counties.\n' +
        'Standardized bench procedures across all sub-registries.'
      }
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
    />
    <p className="text-[10px] text-gray-500">
      One bullet per line. Blank lines are ignored.
    </p>
  </div>
);

// ─── Portrait picker ─────────────────────────────────────────────────────────
//
// File input + preview. The preview shows the locally staged file (via
// object URL) if one has been picked, otherwise the existing server
// portrait, otherwise a neutral placeholder.
//
// The object URL is created via `useMemo` and revoked in an effect
// cleanup. No setState in the effect body — that's the React compiler
// warning we removed from the judges editor.

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

  const handleRemove = () => onPickFile(null);

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
              onClick={handleRemove}
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
// Rendered with `key={id ?? 'new'}` from the parent so switching
// records remounts the component and resets form state.

interface EditorProps {
  judge: PrincipalJudge | null;
  onClose: () => void;
}

const PrincipalJudgeEditor = ({ judge, onClose }: EditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSaving, saveError, saveSuccess } = useSelector(
    (s: RootState) => s.principalJudges,
  );

  const [form, setForm] = useState<PrincipalJudgeInput>(() =>
    formFromJudge(judge),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contributionsText, setContributionsText] = useState(
    judge ? judge.keyContributions.join('\n') : '',
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
    // Split the textarea into an array, trimming and dropping blanks.
    const keyContributions = contributionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const payload: PrincipalJudgeInput = { ...form, keyContributions };

    try {
      if (judge) {
        await dispatch(
          updatePrincipalJudge({
            id: judge.id,
            payload,
            image: imageFile ?? undefined,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createPrincipalJudge({ payload, image: imageFile ?? undefined }),
        ).unwrap();
      }
    } catch {
      // Slice already recorded saveError.
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {judge ? `Edit: ${judge.name}` : 'New Principal Judge record'}
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
          placeholder="Full name (e.g. Hon. Justice Oscar Angote, MBS)"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <input
          name="tenure"
          value={form.tenure}
          onChange={handleChange}
          placeholder='Tenure (e.g. "2022 – Present" or "2018 – 2022")'
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
          placeholder="Short bio — one or two sentences, shown on the card"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <textarea
          name="fullBio"
          value={form.fullBio}
          onChange={handleChange}
          rows={5}
          placeholder="Full biography — shown in the profile modal"
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
          <span>
            Currently serving as Principal Judge
            <span className="ml-2 text-[10px] text-gray-500">
              (Only one published record may have this flag.)
            </span>
          </span>
        </label>

        <PortraitPicker
          existingImageUrl={judge?.image?.url ?? null}
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
            {isSaving ? 'Saving…' : judge ? 'Save changes' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Row ─────────────────────────────────────────────────────────────────────

interface RowProps {
  item: PrincipalJudge;
  isSuperAdmin: boolean;
  onEdit: (id: string) => void;
  onDelete: (item: PrincipalJudge) => void;
}

const PrincipalJudgeRow = ({
  item,
  isSuperAdmin,
  onEdit,
  onDelete,
}: RowProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isDeleting } = useSelector((s: RootState) => s.principalJudges);

  //const isOwner = true; // The server enforces ownership; the UI shows the button optimistically.
  const canEdit = item.status === 'draft' || item.status === 'rejected';
  const canSubmit = canEdit;

  // Super admins can edit/delete anything; regular admins only their
  // own drafts / rejected. The service is the final authority — if a
  // regular admin tries to edit something not theirs, it 403s and the
  // page surfaces the error.
  const showEdit = canEdit || isSuperAdmin;
  const showDelete = canEdit || isSuperAdmin;

  const handleSubmit = () => dispatch(submitPrincipalJudge(item.id));

  return (
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
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {showEdit && (
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
          {showDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
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

const AdminPrincipalJudge = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    adminItems,
    isLoadingAdmin,
    adminError,
    current,
    isLoadingCurrent,
    currentError,
    deleteError,
  } = useSelector((s: RootState) => s.principalJudges);

  const isSuperAdmin = useSelector((s: RootState) =>
    userIsSuperAdmin(s.auth.user),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Initial load.
  useEffect(() => {
    dispatch(fetchAllPrincipalJudges());
  }, [dispatch]);

  // When Edit is clicked, load the full record into `current`.
  useEffect(() => {
    if (editingId) dispatch(fetchPrincipalJudgeById(editingId));
  }, [editingId, dispatch]);

  const showEditor = isCreating || editingId !== null;
  const editorJudge = editingId ? current : null;
  const editorKey = isCreating ? 'new' : (editingId ?? 'new');

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

  /**
   * Delete is handled here rather than in the row so the page can
   * close the editor if the record being deleted is the one it's
   * showing. Without this, the editor would keep showing a record
   * whose deletion just succeeded; the next Save would resurrect it
   * as a new record.
   */
  const handleDelete = (item: PrincipalJudge) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    dispatch(deletePrincipalJudge(item.id))
      .unwrap()
      .then(() => {
        if (editingId === item.id) closeEditor();
      })
      .catch(() => {
        // Delete failed — likely a stale row. Refetch so the list
        // reflects the server's reality.
        dispatch(fetchAllPrincipalJudges());
        if (editingId === item.id) closeEditor();
      });
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Principal Judge</h1>
          <p className="text-sm text-gray-500">
            Records of the Office of the Principal Judge — the sitting
            judge and their predecessors.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          New record
        </button>
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
            <PrincipalJudgeEditor
              key={editorKey}
              judge={editorJudge}
              onClose={closeEditor}
            />
          )}
        </div>
      )}

      {deleteError && (
        <p className="mb-2 text-sm text-red-600">{deleteError}</p>
      )}

      {isLoadingAdmin && <p className="text-sm text-gray-500">Loading…</p>}
      {adminError && <p className="text-sm text-red-600">{adminError}</p>}

      {!isLoadingAdmin && !adminError && adminItems.length === 0 && (
        <p className="text-sm text-gray-500">
          No records yet. Create one to get started.
        </p>
      )}

      {!isLoadingAdmin && !adminError && adminItems.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Station</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminItems.map((item) => (
                <PrincipalJudgeRow
                  key={item.id}
                  item={item}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPrincipalJudge;