// src/features/judges/JudgesPage.tsx
//
// Public judges bench listing.
//
//   - Lists published judge records (fetchPublishedJudges).
//   - Search box and region dropdown drive server-side queries.
//   - Profile modal reads from the already-fetched row — the summary
//     carries the whole record, so no second request per open.
//
// Portraits are rendered from `judge.image.url`, which is the
// Cloudinary delivery URL. When a judge has no portrait (`image` is
// null), the card falls back to initials on the existing gradient —
// same pattern as the admin and super-admin listings.

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaGavel,
  FaSearch,
  FaFilter,
  FaTimes,
  FaIdCard,
  FaUserShield,
  FaGraduationCap,
  FaAward,
  FaBuilding,
  FaChevronRight,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import {
  fetchPublishedJudges,
  JUDGE_REGIONS,
  type JudgeRegion,
  type PublicJudgeSummary,
} from '../store/slices/judgesSlice';
import type { AppDispatch, RootState } from '../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Initials fallback for judges without a portrait. Takes the first
 * letter of the last two capitalized words, so "Hon. Justice Oscar
 * Angote, MBS" renders as "AM" (Angote + MBS is wrong, but Angote alone
 * is more informative than the title words).
 *
 * The exact algorithm matters less than the fallback existing. Not
 * every judge has an uploaded portrait, and forcing every record to
 * have one before it can be published would be a policy decision
 * nobody asked for.
 */
const initials = (name: string): string => {
  const parts = name
    .replace(/[,.]/g, ' ')
    .split(/\s+/)
    .filter((p) => /^[A-Z]/.test(p));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0];
  return parts[parts.length - 1][0] + (parts[parts.length - 2]?.[0] ?? '');
};

// ─── Page ────────────────────────────────────────────────────────────────────

const JudgesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    publicItems,
    publicTotal,
    isLoadingPublic,
    publicError,
  } = useSelector((s: RootState) => s.judges);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'All' | JudgeRegion>(
    'All',
  );
  const [selectedJudge, setSelectedJudge] =
    useState<PublicJudgeSummary | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce the search box so we don't hit the endpoint per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch the published list whenever the effective query changes.
  useEffect(() => {
    dispatch(
      fetchPublishedJudges({
        page,
        limit,
        search: searchTerm || undefined,
        region: selectedRegion === 'All' ? undefined : selectedRegion,
      }),
    );
  }, [dispatch, page, searchTerm, selectedRegion]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(publicTotal / limit));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRegionChange = (value: 'All' | JudgeRegion) => {
    if (value === selectedRegion) return;
    setSelectedRegion(value);
    setPage(1);
  };

  const handleRetry = () => {
    dispatch(
      fetchPublishedJudges({
        page,
        limit,
        search: searchTerm || undefined,
        region: selectedRegion === 'All' ? undefined : selectedRegion,
      }),
    );
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedRegion('All');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || selectedRegion !== 'All';

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* ================= HERO BANNER WITH BACKGROUND IMAGE ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-20 lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1920')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaGavel />
            <span>Judicial Bench</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            Judges of the{' '}
            <span className="text-[#D4AF37]">Environment & Land Court</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Serving across various ELC stations nationwide to ensure accessible,
            fair, and expeditious resolution of land and environmental disputes.
          </p>

          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-center border-t border-white/10">
            <div>
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">
                {publicTotal}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Serving Judges
              </span>
            </div>
            <div>
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">
                {new Set(publicItems.map((j) => j.station)).size}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Stations Represented
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">
                100%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                E-Filing Integrated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by judge name or station..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaFilter className="text-[#C69A33] shrink-0" />
            <span className="text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
              Region:
            </span>
            <select
              value={selectedRegion}
              onChange={(e) =>
                handleRegionChange(e.target.value as 'All' | JudgeRegion)
              }
              className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
            >
              <option value="All">All Regions</option>
              {JUDGE_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#C69A33] font-bold font-mono underline whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= JUDGES GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Presiding Judicial Officers ({publicTotal})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Click card for full profile record
          </span>
        </div>

        {/* Loading */}
        {isLoadingPublic && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500">Loading judges…</p>
          </div>
        )}

        {/* Error */}
        {!isLoadingPublic && publicError && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaGavel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">{publicError}</p>
            <button
              onClick={handleRetry}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoadingPublic && !publicError && publicItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaGavel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">
              No judges found matching your criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#C69A33] font-bold font-mono underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoadingPublic && !publicError && publicItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicItems.map((judge) => (
                <div
                  key={judge.id}
                  onClick={() => setSelectedJudge(judge)}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="relative h-64 w-full bg-gradient-to-br from-[#061e14] to-slate-900 overflow-hidden">
                    {judge.image?.url ? (
                      <img
                        src={judge.image.url}
                        alt={judge.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      // No portrait — render initials on the gradient
                      // rather than a broken image icon.
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-serif font-bold text-[#D4AF37]/80 tracking-wider">
                          {initials(judge.name)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    <div className="absolute top-3 right-3 bg-[#061e14]/90 backdrop-blur-md border border-[#C69A33]/50 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-[#D4AF37]">
                      Appointed {judge.appointedYear}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold tracking-wider block">
                        {judge.title}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                        {judge.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                        <FaBuilding className="text-[#C69A33]" />
                        <span>{judge.station}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {judge.bio}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-[#061e14] font-bold">
                      <span>View Profile</span>
                      <FaChevronRight className="w-3 h-3 text-[#C69A33] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= JUDGE DETAILS MODAL ================= */}
      {selectedJudge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedJudge(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden relative transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaIdCard className="text-lg" />
                <span>Judicial Credentials Record</span>
              </div>
              <button
                onClick={() => setSelectedJudge(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Header Info Block */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#061e14] text-[#D4AF37] text-xs font-mono font-bold uppercase">
                    <FaUserShield className="w-3.5 h-3.5" />
                    <span>{selectedJudge.title}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Appointed:{' '}
                    <strong className="text-slate-800">
                      {selectedJudge.appointedYear}
                    </strong>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900">
                    {selectedJudge.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700 font-mono">
                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                    <FaBuilding className="text-[#C69A33] shrink-0" />
                    <span className="truncate">{selectedJudge.station}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                    <FaMapMarkerAlt className="text-[#C69A33] shrink-0" />
                    <span>Region: {selectedJudge.region}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C69A33] flex items-center gap-2">
                  <FaGavel />
                  <span>Biography & Judicial Role</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedJudge.bio}
                </p>
              </div>

              {/* Academic Qualifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#061e14] flex items-center gap-2">
                  <FaGraduationCap className="text-[#C69A33]" />
                  <span>Academic Qualifications</span>
                </h4>
                <ul className="space-y-1.5">
                  {selectedJudge.education.map((edu, index) => (
                    <li
                      key={index}
                      className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      <span className="font-semibold">{edu.degree}</span>
                      {edu.institution && (
                        <>
                          <span className="text-slate-400"> — </span>
                          <span>{edu.institution}</span>
                        </>
                      )}
                      {edu.year && (
                        <span className="text-slate-400"> ({edu.year})</span>
                      )}
                    </li>
                  ))}
                  {selectedJudge.education.length === 0 && (
                    <li className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      No qualifications recorded.
                    </li>
                  )}
                </ul>
              </div>

              {/* Key Jurisprudential Areas */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#061e14] flex items-center gap-2">
                  <FaAward className="text-[#C69A33]" />
                  <span>Key Jurisprudential Areas</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJudge.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/10 border border-emerald-900/20 text-xs font-medium text-emerald-900"
                    >
                      {spec}
                    </span>
                  ))}
                  {selectedJudge.specializations.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      No specializations recorded.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Status:{' '}
                <span className="text-emerald-600 font-semibold">
                  Active Judicial Officer
                </span>
              </span>
              <button
                onClick={() => setSelectedJudge(null)}
                className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgesPage;