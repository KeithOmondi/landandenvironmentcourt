// src/pages/admin/AdminHero.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchMyDraft,
  fetchLiveHero,
  saveDraft,
  submitDraft,
  deleteDraft,
  uploadSlideImage,
  clearDraftError,
  clearDraftSaveSuccess,
  clearUploadError,
  type HeroVersionPayload,
  type HeroVersion,
  type Hero,
} from '../../store/slices/heroSlice';

// ─── Default payload ─────────────────────────────────────────────────────────

const emptyPayload = (): HeroVersionPayload => ({
  badge: 'Judiciary E-Services Portal Active',
  headline: 'Enhancing Access to Justice for All',
  subheadline:
    'Welcome to the official website of the Environment and Land Court. Search daily cause lists, review judgments, and manage filings directly online.',
  slides: [
    {
      imageUrl: '',
      imagePublicId: null,
      altText: 'Courtroom',
      ctaLabel: null,
      ctaHref: null,
      displayOrder: 0,
      isActive: true,
    },
  ],
  badges: [
    { label: 'Jurisdiction', value: 'Constitutional', icon: 'FaGavel',      displayOrder: 0, isActive: true },
    { label: 'Hearings',     value: 'Virtual Courts', icon: 'FaVideo',      displayOrder: 1, isActive: true },
    { label: 'Stations',     value: 'Countrywide',    icon: 'FaUniversity', displayOrder: 2, isActive: true },
  ],
  searchCard: {
    title: 'Quick Access Portal',
    subtitle: 'Access public records, court listings, and electronic filing modules.',
    selfServiceBadge: 'Self-Service',
    tabs: [
      { key: 'causelist', label: 'Cause List', placeholder: 'Search by Case No. or Party Name...', ctaLabel: 'Find Cause List' },
      { key: 'judgments', label: 'Decisions',  placeholder: 'Search Judgments / Rulings...',         ctaLabel: 'Search Decisions' },
      { key: 'efiling',   label: 'e-Filing',   placeholder: 'Enter Case Reference No...',            ctaLabel: 'Proceed to Portal' },
    ],
    documentsLabel: 'Need legal forms?',
    documentsLinkLabel: 'Download Documents',
    documentsHref: '/media/documents',
  },
});

// ─── Small inputs ────────────────────────────────────────────────────────────

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{label}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A37]"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#2D6A37]"
      />
    )}
  </label>
);

// ─── Slide image picker ──────────────────────────────────────────────────────
//
// Owns the hidden <input type="file">, dispatches the upload thunk, and
// reports the resulting { url, publicId } back to the parent. Does not
// store anything itself — the parent owns the slide's state.

const SlideImagePicker = ({
  imageUrl,
  onUploaded,
  onClear,
}: {
  imageUrl: string;
  onUploaded: (asset: { url: string; publicId: string }) => void;
  onClear: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { isUploading, uploadError } = useAppSelector((s) => s.hero);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLocalError(null);

    // Cheap pre-flight checks so we don't send obviously-bad files.
    // The server re-checks everything.
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setLocalError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('File is larger than 5 MB.');
      return;
    }

    try {
      const asset = await dispatch(uploadSlideImage(file)).unwrap();
      onUploaded(asset);
    } catch {
      // Error already surfaced through the slice as `uploadError`.
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so picking the same file twice still fires onChange.
    e.target.value = '';
  };

  const error = localError ?? uploadError;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
        Image
      </span>

      {imageUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={imageUrl}
            alt="Slide preview"
            className="h-20 w-32 rounded-md border border-gray-200 object-cover"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {isUploading ? 'Uploading…' : 'Replace image'}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={isUploading}
              className="text-left text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs font-medium text-gray-500 hover:border-[#2D6A37] hover:text-[#2D6A37] disabled:opacity-60"
        >
          {isUploading ? 'Uploading…' : '+ Upload image'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

// ─── Helper: derive an editable payload from a live Hero ────────────────────

function payloadFromHero(hero: Hero): HeroVersionPayload {
  return {
    badge: hero.badge,
    headline: hero.headline,
    subheadline: hero.subheadline,
    slides: hero.slides.map((s) => ({
      imageUrl: s.imageUrl,
      imagePublicId: s.imagePublicId,
      altText: s.altText,
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
    })),
    badges: hero.badges.map((b) => ({
      label: b.label,
      value: b.value,
      icon: b.icon,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
    })),
    searchCard: {
      title: hero.searchCard.title,
      subtitle: hero.searchCard.subtitle,
      selfServiceBadge: hero.searchCard.selfServiceBadge,
      tabs: hero.searchCard.tabs,
      documentsLabel: hero.searchCard.documentsLabel,
      documentsLinkLabel: hero.searchCard.documentsLinkLabel,
      documentsHref: hero.searchCard.documentsHref,
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

const AdminHero = () => {
  const dispatch = useAppDispatch();
  const { draft, isSavingDraft, draftError, draftSaveSuccess, hero, isLoadingHero } =
    useAppSelector((s) => s.hero);

  const [payload, setPayload] = useState<HeroVersionPayload>(emptyPayload);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch(fetchLiveHero());
    dispatch(fetchMyDraft());
    return () => {
      dispatch(clearDraftError());
      dispatch(clearDraftSaveSuccess());
      dispatch(clearUploadError());
    };
  }, [dispatch]);

  if (!hydrated) {
    if (draft) {
      setHydrated(true);
      setPayload(draft.payload);
    } else if (hero) {
      setHydrated(true);
      setPayload(payloadFromHero(hero));
    } else if (!isLoadingHero) {
      setHydrated(true);
      setPayload(emptyPayload());
    }
  }

  // ─── Mutators ──────────────────────────────────────────────────────────────

  const setTop = <K extends 'badge' | 'headline' | 'subheadline'>(
    key: K,
    value: HeroVersionPayload[K],
  ) => setPayload((p) => ({ ...p, [key]: value }));

  const setSlide = (index: number, patch: Partial<HeroVersionPayload['slides'][number]>) =>
    setPayload((p) => ({
      ...p,
      slides: p.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addSlide = () =>
    setPayload((p) => ({
      ...p,
      slides: [
        ...p.slides,
        {
          imageUrl: '',
          imagePublicId: null,
          altText: null,
          ctaLabel: null,
          ctaHref: null,
          displayOrder: p.slides.length,
          isActive: true,
        },
      ],
    }));

  const removeSlide = (index: number) =>
    setPayload((p) => ({
      ...p,
      slides: p.slides
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, displayOrder: i })),
    }));

  const setBadge = (index: number, patch: Partial<HeroVersionPayload['badges'][number]>) =>
    setPayload((p) => ({
      ...p,
      badges: p.badges.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));

  const setSearchCard = (patch: Partial<HeroVersionPayload['searchCard']>) =>
    setPayload((p) => ({ ...p, searchCard: { ...p.searchCard, ...patch } }));

  const setTab = (
    index: number,
    patch: Partial<HeroVersionPayload['searchCard']['tabs'][number]>,
  ) =>
    setPayload((p) => ({
      ...p,
      searchCard: {
        ...p.searchCard,
        tabs: p.searchCard.tabs.map((t, i) => (i === index ? { ...t, ...patch } : t)),
      },
    }));

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleSave = () => {
    dispatch(saveDraft({ payload, versionId: draft?.id }));
  };

  const handleSubmit = async () => {
    let currentDraft: HeroVersion | null = draft;

    if (!currentDraft) {
      const result = await dispatch(saveDraft({ payload })).unwrap();
      currentDraft = result;
    }

    await dispatch(submitDraft(currentDraft.id));
    setHydrated(false);
  };

  const handleDiscard = () => {
    if (draft) {
      dispatch(deleteDraft(draft.id));
    }
    setPayload(emptyPayload());
    setHydrated(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const isLoading = !hydrated || isLoadingHero;

  const submitDisabled = useMemo(
    () =>
      isSavingDraft ||
      !payload.headline.trim() ||
      payload.slides.length === 0 ||
      payload.slides.some((s) => !s.imageUrl.trim()),
    [isSavingDraft, payload],
  );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hero editor</h1>
          <p className="mt-1 text-sm text-gray-600">
            {draft
              ? 'You have an open draft. Save changes, or submit it for review.'
              : 'No open draft. Start editing below.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSavingDraft}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingDraft || isLoading}
            className="rounded-md border border-[#2D6A37] px-4 py-2 text-sm font-semibold text-[#2D6A37] transition hover:bg-[#2D6A37]/5 disabled:opacity-60"
          >
            {isSavingDraft ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled || isLoading}
            className="rounded-md bg-[#2D6A37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245a2e] disabled:opacity-60"
          >
            Submit for review
          </button>
        </div>
      </header>

      {draftError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {draftError}
        </div>
      )}
      {draftSaveSuccess && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Draft saved.
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading…
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Top text ─────────────────────────────────────────────── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Header
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Badge"
                value={payload.badge}
                onChange={(v) => setTop('badge', v)}
              />
              <TextField
                label="Headline"
                value={payload.headline}
                onChange={(v) => setTop('headline', v)}
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Subheadline"
                  value={payload.subheadline}
                  onChange={(v) => setTop('subheadline', v)}
                  textarea
                />
              </div>
            </div>
          </section>

          {/* ── Slides ────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Slides ({payload.slides.length})
              </h2>
              <button
                type="button"
                onClick={addSlide}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add slide
              </button>
            </div>

            <div className="space-y-4">
              {payload.slides.map((slide, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">
                      order {slide.displayOrder}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlide(i)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SlideImagePicker
                      imageUrl={slide.imageUrl}
                      onUploaded={(asset) =>
                        setSlide(i, {
                          imageUrl: asset.url,
                          imagePublicId: asset.publicId,
                        })
                      }
                      onClear={() =>
                        setSlide(i, { imageUrl: '', imagePublicId: null })
                      }
                    />

                    <div className="grid gap-3">
                      <TextField
                        label="Alt text"
                        value={slide.altText ?? ''}
                        onChange={(v) => setSlide(i, { altText: v || null })}
                      />
                      <TextField
                        label="CTA label"
                        value={slide.ctaLabel ?? ''}
                        onChange={(v) => setSlide(i, { ctaLabel: v || null })}
                      />
                      <TextField
                        label="CTA href"
                        value={slide.ctaHref ?? ''}
                        onChange={(v) => setSlide(i, { ctaHref: v || null })}
                      />
                    </div>
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => setSlide(i, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* ── Badges ────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Badges ({payload.badges.length})
            </h2>
            <div className="space-y-3">
              {payload.badges.map((badge, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-4">
                  <TextField
                    label="Label"
                    value={badge.label}
                    onChange={(v) => setBadge(i, { label: v })}
                  />
                  <TextField
                    label="Value"
                    value={badge.value}
                    onChange={(v) => setBadge(i, { value: v })}
                  />
                  <TextField
                    label="Icon"
                    value={badge.icon}
                    onChange={(v) => setBadge(i, { icon: v })}
                  />
                  <label className="flex items-end gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={badge.isActive}
                      onChange={(e) => setBadge(i, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* ── Search card ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Search card
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Title"
                value={payload.searchCard.title}
                onChange={(v) => setSearchCard({ title: v })}
              />
              <TextField
                label="Self-service badge"
                value={payload.searchCard.selfServiceBadge}
                onChange={(v) => setSearchCard({ selfServiceBadge: v })}
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Subtitle"
                  value={payload.searchCard.subtitle}
                  onChange={(v) => setSearchCard({ subtitle: v })}
                  textarea
                />
              </div>
            </div>

            <h3 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tabs ({payload.searchCard.tabs.length})
            </h3>
            <div className="space-y-3">
              {payload.searchCard.tabs.map((tab, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-4">
                  <TextField label="Key"         value={tab.key}         onChange={(v) => setTab(i, { key: v })} />
                  <TextField label="Label"       value={tab.label}       onChange={(v) => setTab(i, { label: v })} />
                  <TextField label="Placeholder" value={tab.placeholder} onChange={(v) => setTab(i, { placeholder: v })} />
                  <TextField label="CTA label"   value={tab.ctaLabel}    onChange={(v) => setTab(i, { ctaLabel: v })} />
                </div>
              ))}
            </div>

            <h3 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Documents link
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Label"
                value={payload.searchCard.documentsLabel}
                onChange={(v) => setSearchCard({ documentsLabel: v })}
              />
              <TextField
                label="Link label"
                value={payload.searchCard.documentsLinkLabel}
                onChange={(v) => setSearchCard({ documentsLinkLabel: v })}
              />
              <TextField
                label="Href"
                value={payload.searchCard.documentsHref}
                onChange={(v) => setSearchCard({ documentsHref: v })}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminHero;