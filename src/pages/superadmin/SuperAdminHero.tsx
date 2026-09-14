// src/pages/superadmin/SuperAdminHero.tsx
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  approveVersion,
  rejectVersion,
  fetchPendingVersions,
  fetchVersionById,
  clearReviewState,
  type HeroVersionSummary,
  type HeroVersion,
} from '../../store/slices/heroSlice';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  X,
  Layers,
  Image as ImageIcon,
  Search,
  ShieldAlert,
} from 'lucide-react';

// ─── Small presentational pieces ─────────────────────────────────────────────

const StatusPill = ({ status }: { status: HeroVersionSummary['status'] }) => {
  const palette: Record<HeroVersionSummary['status'], string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-300',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-50 text-red-700 border-red-300',
    superseded: 'bg-slate-100 text-slate-600 border-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${palette[status]}`}
    >
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
};

const VersionRow = ({
  version,
  onOpen,
}: {
  version: HeroVersionSummary;
  onOpen: (id: string) => void;
}) => (
  <button
    onClick={() => onOpen(version.id)}
    className="group w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-800 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900">
          Proposed by <span className="capitalize">{version.createdByRole}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {new Date(version.createdAt).toLocaleString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={version.status} />
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  </button>
);

// ─── Review panel ────────────────────────────────────────────────────────────

const ReviewPanel = ({
  version,
  onClose,
}: {
  version: HeroVersion;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { isReviewing, reviewError } = useAppSelector((s) => s.hero);

  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'idle' | 'reject'>('idle');

  const handleApprove = () => {
    dispatch(approveVersion({ versionId: version.id, reviewNote: note || undefined }));
    onClose();
  };

  const handleReject = () => {
    if (!note.trim()) return;
    dispatch(rejectVersion({ versionId: version.id, reviewNote: note.trim() }));
    onClose();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md mt-6">
      <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-emerald-950 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            Review Proposed Hero Version
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Submitted {new Date(version.createdAt).toLocaleString('en-KE')} · Role:{' '}
            <strong className="capitalize">{version.createdByRole}</strong>
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Payload preview ── */}
      <div className="mb-6 space-y-5 rounded-lg bg-slate-50 p-5 text-sm border border-slate-200/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Badge</p>
          <p className="text-slate-800 font-medium">{version.payload.badge || '—'}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Headline</p>
          <p className="font-serif text-xl font-bold text-emerald-950 mt-0.5">
            {version.payload.headline}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subheadline</p>
          <p className="text-slate-700">{version.payload.subheadline}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            Slides ({version.payload.slides.length})
          </p>
          <ul className="mt-2 space-y-2">
            {version.payload.slides.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                <img
                  src={s.imageUrl}
                  alt={s.altText ?? ''}
                  className="h-12 w-20 rounded object-cover border border-slate-100"
                />
                <div className="min-w-0 flex-1 text-xs text-slate-600">
                  <p className="truncate font-mono text-slate-700">{s.imageUrl}</p>
                  <p className="mt-1 text-slate-500">
                    Order: <strong className="text-slate-800">{s.displayOrder}</strong> · Status:{' '}
                    <span className={s.isActive ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Badges ({version.payload.badges.length})
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {version.payload.badges.map((b, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{b.label}:</span>
                <span className="text-slate-700">{b.value}</span>
                <span className="text-slate-400">({b.icon})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            Search Card
          </p>
          <p className="text-slate-900 font-medium mt-1">{version.payload.searchCard.title}</p>
          <p className="text-xs text-slate-600">{version.payload.searchCard.subtitle}</p>
        </div>
      </div>

      {/* ── Note ── */}
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Review Note {mode === 'reject' && <span className="text-red-500">*</span>}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            mode === 'reject'
              ? 'Reason for rejection (required)'
              : 'Optional note for the judicial records'
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
        />
      </label>

      {reviewError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{reviewError}</span>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        {mode === 'idle' && (
          <>
            <button
              onClick={handleApprove}
              disabled={isReviewing}
              className="flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{isReviewing ? 'Publishing…' : 'Approve & Publish'}</span>
            </button>
            <button
              onClick={() => setMode('reject')}
              disabled={isReviewing}
              className="flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject…</span>
            </button>
          </>
        )}

        {mode === 'reject' && (
          <>
            <button
              onClick={handleReject}
              disabled={isReviewing || !note.trim()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 cursor-pointer"
            >
              {isReviewing ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setMode('idle')}
              disabled={isReviewing}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const SuperAdminHero = () => {
  const dispatch = useAppDispatch();
  const { pendingVersions, isLoadingPending, pendingError } = useAppSelector(
    (s) => s.hero,
  );

  const [openVersion, setOpenVersion] = useState<HeroVersion | null>(null);
  const [isLoadingOne, setIsLoadingOne] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingVersions());
    return () => {
      dispatch(clearReviewState());
    };
  }, [dispatch]);

  const handleOpen = async (versionId: string) => {
    setIsLoadingOne(true);
    try {
      const result = await dispatch(fetchVersionById(versionId)).unwrap();
      setOpenVersion(result);
    } catch {
      // Handled via Redux state
    } finally {
      setIsLoadingOne(false);
    }
  };

  const handleCloseReview = () => {
    setOpenVersion(null);
    dispatch(fetchPendingVersions());
  };

  return (
    <div className="mx-auto max-w-4xl py-2">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-emerald-950">Hero Section — Review Queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review, approve, or reject proposed content changes to the landing page Hero section.
        </p>
      </header>

      {isLoadingPending && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading queue…
        </div>
      )}

      {pendingError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pendingError}
        </div>
      )}

      {!isLoadingPending && pendingVersions.length === 0 && !pendingError && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hero version submissions currently awaiting review.
        </div>
      )}

      {!isLoadingPending && pendingVersions.length > 0 && (
        <div className="mb-8 space-y-3">
          {pendingVersions.map((v) => (
            <VersionRow key={v.id} version={v} onOpen={handleOpen} />
          ))}
        </div>
      )}

      {isLoadingOne && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading version details…
        </div>
      )}

      {openVersion && (
        <ReviewPanel version={openVersion} onClose={handleCloseReview} />
      )}
    </div>
  );
};

export default SuperAdminHero;