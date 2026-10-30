// src/component/JudgeOrderPanel.tsx
//
// Lets admins arrange the order published judges appear in on the public
// Judges page. Drag a row (or use the arrow / top / bottom buttons), then
// "Save order". The order is sent to PUT /judges/admin/reorder as an
// ordered id list and the public page follows it immediately.

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { fetchAllJudges, reorderJudges } from '../store/slices/judgesSlice';
import type { AppDispatch, RootState } from '../store/store';

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const iconBtn =
  'rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-white hover:text-emerald-900 disabled:opacity-30';

const JudgeOrderPanel = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { adminItems, isLoadingAdmin } = useSelector((s: RootState) => s.judges);

  // Local working order of ids; null = untouched (follow the server order).
  const [draft, setDraft] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAllJudges());
  }, [dispatch]);

  const published = adminItems.filter((j) => j.status === 'published');
  const byId = new Map(published.map((j) => [j.id, j]));
  const serverIds = published.map((j) => j.id);
  // Ignore draft ids that no longer exist; append any new ones.
  const ids = draft
    ? [
        ...draft.filter((id) => byId.has(id)),
        ...serverIds.filter((id) => !draft.includes(id)),
      ]
    : serverIds;
  const dirty = draft !== null;

  const reorder = (from: number, to: number) => setDraft(move(ids, from, to));

  const handleSave = async () => {
    setSaving(true);
    const result = await dispatch(reorderJudges(ids));
    if (reorderJudges.fulfilled.match(result)) {
      toast.success('Judge order saved — it is now live on the public page');
      setDraft(null);
      dispatch(fetchAllJudges());
    } else {
      toast.error((result.payload as string) || 'Could not save order');
    }
    setSaving(false);
  };

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Arrange judges</h2>
          <p className="text-xs text-slate-500">
            Decide who comes first and who comes last on the public Judges page.
            Drag a row, or use the buttons.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => setDraft(null)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save order'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {ids.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            {isLoadingAdmin ? 'Loading judges…' : 'No published judges to arrange yet.'}
          </p>
        ) : (
          <ol className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {ids.map((id, index) => {
              const judge = byId.get(id)!;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) reorder(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm active:cursor-grabbing ${
                    dragIndex === index ? 'opacity-40' : ''
                  }`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  {judge.image ? (
                    <img
                      src={judge.image.url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{judge.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {judge.title} · {judge.station}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" aria-label="Move to top" title="Move to top" disabled={index === 0} onClick={() => reorder(index, 0)} className={iconBtn}>
                      <ChevronsUp className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => reorder(index, index - 1)} className={iconBtn}>
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Move down" title="Move down" disabled={index === ids.length - 1} onClick={() => reorder(index, index + 1)} className={iconBtn}>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Move to bottom" title="Move to bottom" disabled={index === ids.length - 1} onClick={() => reorder(index, ids.length - 1)} className={iconBtn}>
                      <ChevronsDown className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default JudgeOrderPanel;
