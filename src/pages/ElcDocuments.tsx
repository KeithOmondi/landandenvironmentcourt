// src/features/documents/ElcDocuments.tsx
//
// Public documents repository.
//
//   - Lists published documents (fetchPublishedDocuments).
//   - Search box and both dropdowns drive server-side queries.
//   - "View" opens the PDF inline in a full-screen modal. The browser's
//     native PDF viewer handles pagination, zoom, and download.
//   - "Details" opens a compact metadata card: title, station, date,
//     size, description, plus a button to jump to the inline viewer.
//   - "Open in new tab" is available from inside the viewer for users
//     who prefer the browser's own tab chrome.
//
// URLs stored on the row are Cloudinary `f_pdf` delivery URLs. The
// `f_pdf` transformation tells Cloudinary to serve the PDF itself
// rather than rendering page 1 as an image. PDF delivery must be
// enabled in the Cloudinary account (Settings → Security) for these
// URLs to return 200; a 401 from Cloudinary means the toggle is off.
//
// The `download` HTML attribute is deliberately NOT used on the anchor
// buttons. Browsers ignore it for cross-origin URLs, and Cloudinary is
// a different origin. The browser's PDF viewer provides a download
// control instead — every major browser's PDF viewer has one.

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaFilePdf,
  FaSearch,
  FaFilter,
  FaExternalLinkAlt,
  FaEye,
  FaFolder,
  FaCalendarAlt,
  FaTimes,
  FaFileAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  fetchPublishedDocuments,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATIONS,
  type DocumentCategory,
  type DocumentStation,
  type PublicDocumentSummary,
} from '../store/slices/documentsSlice';
import type { AppDispatch, RootState } from '../store/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const monthName = monthNames[Number(m) - 1] ?? m;
  return `${monthName} ${d}, ${y}`;
};

// ─── Page ────────────────────────────────────────────────────────────────────

const ElcDocuments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    publicItems,
    publicTotal,
    isLoadingPublic,
    publicError,
  } = useSelector((s: RootState) => s.documents);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | DocumentCategory
  >('All');
  const [selectedStation, setSelectedStation] = useState<
    'All' | DocumentStation
  >('All');
  /** Document open in the inline PDF viewer. */
  const [previewDoc, setPreviewDoc] = useState<PublicDocumentSummary | null>(
    null,
  );
  /** Document open in the metadata info modal. */
  const [infoDoc, setInfoDoc] = useState<PublicDocumentSummary | null>(null);
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
      fetchPublishedDocuments({
        page,
        limit,
        search: searchTerm || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        station: selectedStation === 'All' ? undefined : selectedStation,
      }),
    );
  }, [dispatch, page, searchTerm, selectedCategory, selectedStation]);

  // Close the preview modal on Escape.
  useEffect(() => {
    if (!previewDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewDoc(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewDoc]);

  // Close the info modal on Escape.
  useEffect(() => {
    if (!infoDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoDoc(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [infoDoc]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(publicTotal / limit));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCategoryChange = (value: 'All' | DocumentCategory) => {
    if (value === selectedCategory) return;
    setSelectedCategory(value);
    setPage(1);
  };

  const handleStationChange = (value: 'All' | DocumentStation) => {
    if (value === selectedStation) return;
    setSelectedStation(value);
    setPage(1);
  };

  const handleRetry = () => {
    dispatch(
      fetchPublishedDocuments({
        page,
        limit,
        search: searchTerm || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        station: selectedStation === 'All' ? undefined : selectedStation,
      }),
    );
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedStation('All');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'All' ||
    selectedStation !== 'All';

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaFolder />
            <span>Document Repository</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight max-w-3xl mx-auto">
            ELC <span className="text-[#D4AF37]">Documents</span>
          </h1>
        </div>
      </div>

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col gap-4">
          {/* Row 1: search + category */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by title or station..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <FaFilter className="text-[#C69A33] shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as 'All' | DocumentCategory)
                }
                className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
              >
                <option value="All">All Categories</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: station + reset */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
                Station:
              </span>
              <select
                value={selectedStation}
                onChange={(e) =>
                  handleStationChange(e.target.value as 'All' | DocumentStation)
                }
                className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
              >
                <option value="All">All Stations</option>
                {DOCUMENT_STATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
      </div>

      {/* ================= DOCUMENTS GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Available Documents ({publicTotal})
          </h2>
        </div>

        {/* Loading */}
        {isLoadingPublic && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500">Loading documents…</p>
          </div>
        )}

        {/* Error */}
        {!isLoadingPublic && publicError && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaFileAlt className="w-10 h-10 text-slate-300 mx-auto" />
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
            <FaFileAlt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">
              No documents match your search criteria.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicItems.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#061e14]/10 text-[#061e14] text-[11px] font-mono font-bold">
                        <FaFilePdf className="text-red-600" />
                        {doc.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {doc.fileSize}
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="truncate max-w-[150px]">
                        {doc.station}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-[#C69A33]" />
                        {formatIssuedAt(doc.issuedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FaEye className="text-[#D4AF37]" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => setInfoDoc(doc)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        aria-label={`Show details for ${doc.title}`}
                      >
                        <FaInfoCircle /> Details
                      </button>
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

      {/* ================= PDF PREVIEW MODAL =================
          A full-screen viewer. The iframe points at the Cloudinary
          `f_pdf` URL; the browser's native PDF viewer renders the PDF
          inline, with pagination, zoom, and a download control. */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FaFilePdf className="text-red-500 text-lg shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-serif font-bold truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#D4AF37] truncate">
                    {previewDoc.category} · {previewDoc.station}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold transition-colors"
                >
                  <FaExternalLinkAlt className="w-3 h-3" />
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close preview"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PDF iframe. The browser's PDF viewer fills this area. */}
            <div className="flex-1 bg-slate-100">
              <iframe
                src={previewDoc.fileUrl}
                title={previewDoc.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= METADATA INFO MODAL ================= */}
      {infoDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          onClick={() => setInfoDoc(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaInfoCircle className="text-base" />
                <span>Document Details</span>
              </div>
              <button
                onClick={() => setInfoDoc(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close details"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#061e14]/10 text-[#061e14] text-xs font-mono font-bold">
                {infoDoc.category}
              </span>

              <h3 className="text-xl font-serif font-bold text-slate-900">
                {infoDoc.title}
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600 font-mono">
                <p>
                  <strong>Station:</strong> {infoDoc.station}
                </p>
                <p>
                  <strong>Issue Date:</strong>{' '}
                  {formatIssuedAt(infoDoc.issuedAt)}
                </p>
                <p>
                  <strong>File Size:</strong> {infoDoc.fileSize}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#C69A33] uppercase">
                  Summary
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {infoDoc.description}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setInfoDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(infoDoc);
                  setInfoDoc(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <FaEye className="text-[#D4AF37]" /> View Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElcDocuments;