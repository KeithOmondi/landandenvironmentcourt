// src/component/JudgeExtraFields.tsx
//
// Editor fields shared by the admin and super-admin judge editors:
// work experience (repeatable rows), admission note, key achievements.

import type { Dispatch, SetStateAction } from 'react';
import type { JudgeInput, WorkExperienceEntry } from '../store/slices/judgesSlice';

const input = 'rounded border border-gray-300 px-3 py-2 text-sm';

const WorkExperienceEditor = ({
  entries,
  onChange,
}: {
  entries: WorkExperienceEntry[];
  onChange: (next: WorkExperienceEntry[]) => void;
}) => {
  const setField = (i: number, field: keyof WorkExperienceEntry, value: string) =>
    onChange(
      entries.map((e, idx) =>
        idx === i ? { ...e, [field]: value === '' && field === 'period' ? undefined : value } : e,
      ),
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Work experience</span>
        <button
          type="button"
          onClick={() => onChange([...entries, { position: '', organization: '' }])}
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
        >
          + Add role
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-gray-400">
          No roles added. e.g. Managing Partner — Walter and Roselyne Advocates LLP.
        </p>
      )}

      {entries.map((entry, i) => (
        <div
          key={i}
          className="grid grid-cols-1 items-start gap-2 rounded border border-gray-200 bg-gray-50 p-2 sm:grid-cols-[1fr_1fr_140px_auto]"
        >
          <input
            value={entry.position}
            onChange={(e) => setField(i, 'position', e.target.value)}
            placeholder="Position (e.g. Managing Partner)"
            className={input}
          />
          <input
            value={entry.organization}
            onChange={(e) => setField(i, 'organization', e.target.value)}
            placeholder="Organization"
            className={input}
          />
          <input
            value={entry.period ?? ''}
            onChange={(e) => setField(i, 'period', e.target.value)}
            placeholder="Period (optional)"
            className={input}
          />
          <button
            type="button"
            onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
            className="rounded border border-red-300 px-2 py-2 text-xs text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

const JudgeExtraFields = ({
  form,
  setForm,
}: {
  form: JudgeInput;
  setForm: Dispatch<SetStateAction<JudgeInput>>;
}) => (
  <>
    <label className="text-xs text-gray-600">
      Professional admission
      <input
        value={form.admission}
        onChange={(e) => setForm((p) => ({ ...p, admission: e.target.value }))}
        placeholder="e.g. Admitted to the Roll of Advocates in 1995"
        className={`mt-1 w-full ${input}`}
      />
    </label>

    <WorkExperienceEditor
      entries={form.workExperience}
      onChange={(next) => setForm((p) => ({ ...p, workExperience: next }))}
    />

    <label className="text-xs text-gray-600">
      Key achievements
      <textarea
        value={form.keyAchievements}
        onChange={(e) => setForm((p) => ({ ...p, keyAchievements: e.target.value }))}
        rows={5}
        placeholder="Notable achievements and contributions"
        className={`mt-1 w-full ${input}`}
      />
    </label>
  </>
);

export default JudgeExtraFields;
