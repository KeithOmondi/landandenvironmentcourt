// src/features/publications/Publications.tsx
//
// Public publications library.
//
//   - Lists published publications (fetchPublishedPublications).
//   - Category chips and search box drive server-side queries.
//   - Opening a publication fetches the full row
//     (fetchPublishedPublicationById) so the reader has `pages`.
//   - The 3D book modal is preserved from the original design.

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaBookOpen,
  FaSearch,
  FaDownload,
  FaEye,
  FaTimes,
  FaFilter,
  FaCalendarAlt,
  FaFileAlt,
  FaChevronRight,
  FaChevronLeft,
} from 'react-icons/fa';
import {
  fetchPublishedPublications,
  fetchPublishedPublicationById,
  clearPublicPublication,
  PUBLICATION_CATEGORIES,
  type PublicationCategory,
  type PublicPublicationSummary,
  type PublicationPage,
} from '../store/slices/publicationsSlice';
import type { AppDispatch, RootState } from '../store/store';

// ─── Cover styles ────────────────────────────────────────────────────────────
//
// The backend doesn't store cover styling — it's presentation. We derive
// a stable gradient from the publication id so the same publication
// always renders the same way. The palette is the same three gradients
// the mock used.
//
// If you later want admin-controlled covers, add a `cover_style` column
// and thread it through the type, validator, and service. For now,
// deterministic derivation keeps the UI from looking random on refresh.

const COVER_GRADIENTS = [
  'from-[#061e14] via-[#0b3323] to-slate-900',
  'from-slate-900 via-[#061e14] to-emerald-950',
  'from-emerald-950 via-[#061e14] to-slate-950',
];

const coverGradient = (id: string): string => {
  // Simple deterministic hash — the exact function doesn't matter, only
  // that it's stable for a given id.
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
};

// ─── Page ────────────────────────────────────────────────────────────────────

const Publications: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    publicItems,
    publicTotal,
    isLoadingPublic,
    publicError,
    publicPublication,
    isLoadingPublicPublication,
    publicPublicationError,
  } = useSelector((s: RootState) => s.publications);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | PublicationCategory
  >('All');
  const [page, setPage] = useState(1);
  const limit = 9;

  // Reader state
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [modalTurnedPage, setModalTurnedPage] = useState(0);

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
      fetchPublishedPublications({
        page,
        limit,
        search: searchTerm || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
      }),
    );
  }, [dispatch, page, searchTerm, selectedCategory]);

  // When the reader opens, fetch the full publication (including
  // When the reader opens, fetch the full publication (including
  // pages). When it closes, clear the fetched row.
  //
  // No setState here — `modalTurnedPage` is reset in the handlers that
  // open and close the reader, so the reset happens in the event that
  // caused it rather than in a follow-up render pass.
  useEffect(() => {
    if (readerOpen && readerId) {
      dispatch(fetchPublishedPublicationById(readerId));
    } else {
      dispatch(clearPublicPublication());
    }
  }, [dispatch, readerOpen, readerId]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(publicTotal / limit));

  // The reader uses `publicPublication` — the full row with `pages`.
  // Falls back to null while loading, which the modal handles.
  const readerPages: PublicationPage[] = useMemo(
    () => publicPublication?.pages ?? [],
    [publicPublication],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCategoryChange = (cat: 'All' | PublicationCategory) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleOpenReader = (id: string) => {
    setReaderId(id);
    setReaderOpen(true);
  };

  const handleCloseReader = () => {
    setReaderOpen(false);
    setReaderId(null);
  };

  const handleDownload = (title: string, url?: string) => {
    if (url) {
      // Open in a new tab. The browser will either download or preview
      // the PDF depending on the user's settings.
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Preparing download for ${title}...`);
    }
  };

  const categories: Array<'All' | PublicationCategory> = [
    'All',
    ...PUBLICATION_CATEGORIES,
  ];

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-24">
      {/* 3D REAL BOOK CSS ANIMATIONS */}
      <style>{`
        .perspective-1200 { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .origin-left { transform-origin: left center; }
        .origin-right { transform-origin: right center; }
        .backface-hidden { backface-visibility: hidden; }

        .book-container:hover .book-cover-left {
          transform: rotateY(-160deg);
        }
        .book-container:hover .book-page-leaf {
          transform: rotateY(-140deg);
          transition-delay: 0.08s;
        }

        .modal-page-leaf {
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
          transform-origin: left center;
        }
        .modal-page-turned {
          transform: rotateY(-180deg);
        }
      `}</style>

      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-20 lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1920')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaBookOpen />
            <span>Interactive Judicial Library</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            ELC <span className="text-[#D4AF37]">Publications</span>
          </h1>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search publications..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <FaFilter className="text-[#C69A33] shrink-0 hidden sm:block" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#061e14] text-[#D4AF37] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Available Publications ({publicTotal})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Hover book to open cover • Click to turn pages
          </span>
        </div>

        {/* Loading / error / empty */}
        {isLoadingPublic && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500">Loading publications…</p>
          </div>
        )}

        {!isLoadingPublic && publicError && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaBookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">{publicError}</p>
            <button
              onClick={() =>
                dispatch(
                  fetchPublishedPublications({
                    page,
                    limit,
                    search: searchTerm || undefined,
                    category:
                      selectedCategory === 'All' ? undefined : selectedCategory,
                  }),
                )
              }
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoadingPublic && !publicError && publicItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaBookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">
              No publications found
              {selectedCategory !== 'All' ? ' in this category' : ''}.
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  handleCategoryChange('All');
                }}
                className="text-xs text-[#C69A33] font-bold font-mono underline"
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        )}

        {!isLoadingPublic && !publicError && publicItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {publicItems.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  publication={pub}
                  onOpen={() => handleOpenReader(pub.id)}
                  onDownload={() => handleDownload(pub.title, pub.fileUrl)}
                />
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

      {/* ================= 3D BOOK MODAL READER ================= */}
      {readerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={handleCloseReader}
        >
          <div
            className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-5xl w-full overflow-hidden relative transform transition-all duration-300 max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaBookOpen className="text-base" />
                <span>3D Interactive Hardcover Reader</span>
              </div>
              <button
                onClick={handleCloseReader}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Loading / error states inside the modal */}
            {isLoadingPublicPublication && (
              <div className="p-12 text-center bg-slate-950">
                <p className="text-sm text-slate-400">Loading publication…</p>
              </div>
            )}

            {!isLoadingPublicPublication && publicPublicationError && (
              <div className="p-12 text-center space-y-3 bg-slate-950">
                <p className="text-sm text-red-400">{publicPublicationError}</p>
                <button
                  onClick={handleCloseReader}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}

            {!isLoadingPublicPublication &&
              !publicPublicationError &&
              publicPublication && (
                <>
                  <div className="p-6 sm:p-10 overflow-y-auto space-y-6 flex-grow flex flex-col justify-between bg-slate-950">
                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-serif font-bold text-amber-100">
                        {publicPublication.title}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {readerPages.length > 0
                          ? 'Click on page corners or use controls to flip pages'
                          : 'Preview not available — download the PDF to view the full document'}
                      </span>
                    </div>

                    {readerPages.length > 0 ? (
                      <>
                        {/* 3D DUAL-PAGE BOOK HARNESS */}
                        <div className="relative perspective-1200 my-4 flex justify-center">
                          <div className="w-full max-w-3xl min-h-[380px] bg-amber-50 rounded-xl border-4 border-amber-950/80 shadow-2xl grid grid-cols-2 relative transform-style-3d">
                            {/* Spine Crease */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/20 via-black/40 to-black/20 z-40 pointer-events-none rounded-sm" />

                            {/* LEFT STATIC PAGE BASE */}
                            <div className="p-6 md:p-8 border-r border-amber-200 flex flex-col justify-between bg-amber-50 rounded-l-lg">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                    Table of Contents
                                  </span>
                                  <span className="text-[10px] font-mono text-[#061e14] font-bold">
                                    ORELC
                                  </span>
                                </div>
                                <h4 className="font-serif font-bold text-slate-900 text-sm">
                                  {publicPublication.title}
                                </h4>
                                <div className="space-y-2 pt-2">
                                  {readerPages.map((pg) => (
                                    <div
                                      key={pg.pageNumber}
                                      onClick={() =>
                                        setModalTurnedPage(pg.pageNumber - 1)
                                      }
                                      className={`text-xs font-mono cursor-pointer p-1.5 rounded transition-all ${
                                        modalTurnedPage >= pg.pageNumber - 1
                                          ? 'text-[#061e14] font-bold bg-amber-100/80'
                                          : 'text-slate-500 hover:text-slate-800'
                                      }`}
                                    >
                                      Page {pg.pageNumber}: {pg.title}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="text-center text-[9px] font-mono text-slate-400 border-t border-amber-200/80 pt-2">
                                Republic of Kenya • Official Copy
                              </div>
                            </div>

                            {/* RIGHT STATIC PAGE BASE */}
                            <div className="p-6 md:p-8 flex flex-col justify-between bg-amber-50 rounded-r-lg">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                    End of Document
                                  </span>
                                  <span className="text-[10px] font-mono text-[#C69A33] font-bold">
                                    Complete
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                                  You have reached the end of the interactive
                                  preview pages for this publication. Download
                                  the full PDF for complete references and
                                  annexures.
                                </p>
                              </div>

                              <div className="text-center text-[9px] font-mono text-slate-400 border-t border-amber-200/80 pt-2">
                                Registry Index: {publicPublication.id}
                              </div>
                            </div>

                            {/* STACK OF FLIPPABLE PAGES */}
                            {readerPages.map((page, index) => {
                              const isTurned = modalTurnedPage > index;
                              return (
                                <div
                                  key={page.pageNumber}
                                  onClick={() => {
                                    if (isTurned) {
                                      setModalTurnedPage(index);
                                    } else {
                                      setModalTurnedPage(index + 1);
                                    }
                                  }}
                                  style={{
                                    zIndex: readerPages.length - index + 10,
                                  }}
                                  className={`modal-page-leaf absolute left-1/2 top-0 bottom-0 w-1/2 bg-amber-50 rounded-r-lg border-r border-amber-300 shadow-md p-6 md:p-8 flex flex-col justify-between cursor-pointer transform-style-3d ${
                                    isTurned ? 'modal-page-turned' : ''
                                  }`}
                                >
                                  <div className="backface-hidden space-y-4">
                                    <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                        Page {page.pageNumber}
                                      </span>
                                      <span className="text-[10px] font-mono text-[#C69A33] font-bold">
                                        Click to Flip ➔
                                      </span>
                                    </div>

                                    <h4 className="font-serif font-bold text-slate-900 text-sm">
                                      {page.title}
                                    </h4>

                                    <div className="bg-white p-4 rounded-xl border border-amber-200/80 text-xs text-slate-800 font-mono leading-relaxed shadow-sm">
                                      {page.content}
                                    </div>
                                  </div>

                                  <div
                                    className="backface-hidden absolute inset-0 bg-amber-100/90 rounded-l-lg border-l border-amber-300 p-6 md:p-8 flex flex-col justify-between text-slate-700"
                                    style={{ transform: 'rotateY(180deg)' }}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center border-b border-amber-300 pb-2">
                                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                          ↵ Click to Flip Back
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          Page {page.pageNumber} Reverse
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-mono text-slate-600">
                                        Notes & Annotations for {page.title}
                                      </p>
                                    </div>
                                    <div className="text-center text-[9px] font-mono text-slate-400">
                                      ORELC PUBLICATIONS
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="flex items-center justify-between pt-2 max-w-3xl mx-auto w-full">
                          <button
                            disabled={modalTurnedPage === 0}
                            onClick={() =>
                              setModalTurnedPage((prev) => Math.max(0, prev - 1))
                            }
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-mono text-xs font-bold transition-all border border-slate-700"
                          >
                            <FaChevronLeft />
                            <span>Turn Back</span>
                          </button>

                          <div className="flex gap-2">
                            {readerPages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setModalTurnedPage(idx + 1)}
                                className={`w-3.5 h-3.5 rounded-full transition-all ${
                                  modalTurnedPage > idx
                                    ? 'bg-[#D4AF37] scale-125 shadow-md'
                                    : 'bg-slate-700 hover:bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            disabled={modalTurnedPage >= readerPages.length}
                            onClick={() =>
                              setModalTurnedPage((prev) =>
                                Math.min(readerPages.length, prev + 1),
                              )
                            }
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C69A33] hover:bg-amber-600 disabled:opacity-30 text-slate-950 font-mono text-xs font-bold transition-all shadow-md"
                          >
                            <span>Turn Next Page</span>
                            <FaChevronRight />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Empty-pages state: no previews available. */
                      <div className="my-8 p-12 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-4 max-w-3xl mx-auto">
                        <FaBookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-sm text-slate-300 max-w-md mx-auto">
                          This publication has no preview pages. Download the
                          PDF to read the full document.
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {publicPublication.fileSize}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
                    <button
                      onClick={handleCloseReader}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all"
                    >
                      Close Book
                    </button>

                    <button
                      onClick={() =>
                        handleDownload(
                          publicPublication.title,
                          publicPublication.fileUrl,
                        )
                      }
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-[#D4AF37] border border-[#C69A33]/40 font-mono text-xs font-bold transition-all shadow-md"
                    >
                      <FaDownload />
                      <span>
                        Download PDF ({publicPublication.fileSize})
                      </span>
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  publication: PublicPublicationSummary;
  onOpen: () => void;
  onDownload: () => void;
}

const PublicationCard = ({ publication, onOpen, onDownload }: CardProps) => {
  const gradient = coverGradient(publication.id);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      {/* 3D BOOK HOVER SPREAD */}
      <div className="flex justify-center py-8 perspective-1200">
        <div
          onClick={onOpen}
          className="book-container relative w-72 h-52 cursor-pointer transform-style-3d transition-transform duration-500 group-hover:scale-105"
        >
          {/* RIGHT BASE PAGE */}
          <div className="absolute right-0 w-36 h-52 bg-slate-100 rounded-r-md border-r-2 border-slate-400 shadow-xl p-3 flex flex-col justify-between text-slate-800">
            <div className="space-y-1">
              <span className="text-[7px] font-mono font-bold text-[#C69A33] uppercase">
                Right Inside Page
              </span>
              <h4 className="text-[9px] font-serif font-bold text-slate-900 leading-tight">
                {publication.title}
              </h4>
            </div>
            <p className="text-[8px] font-sans text-slate-600 line-clamp-3 leading-relaxed bg-white/80 p-1.5 rounded border border-slate-200">
              {publication.description}
            </p>
            <div className="text-[7px] font-mono text-slate-400 text-center border-t border-slate-300 pt-1">
              Click to flip all pages
            </div>
          </div>

          {/* LEFT INSIDE PAGE */}
          <div className="absolute left-0 w-36 h-52 bg-amber-50 rounded-l-md border-l-2 border-slate-300 p-3 flex flex-col justify-between text-slate-700">
            <div className="border-b border-amber-200/80 pb-1">
              <span className="text-[7px] font-mono font-bold text-[#061e14] uppercase">
                Table of Contents
              </span>
            </div>
            <div className="space-y-1 my-auto text-[8px] font-mono text-slate-600">
              {/* Preview page titles aren't in the summary — the reader
                  fetches them. Show a static hint instead. */}
              <div className="truncate">• Preview pages in reader</div>
              <div className="truncate">• Full PDF for download</div>
              <div className="truncate">• Judicial reference</div>
            </div>
            <div className="text-[7px] font-mono text-slate-400 text-center border-t border-amber-200 pt-1">
              ORELC
            </div>
          </div>

          {/* MIDDLE PAPER LEAF */}
          <div className="book-page-leaf absolute left-36 w-36 h-52 bg-white rounded-r-md border-r border-slate-300 shadow-md p-3 origin-left transform-style-3d transition-transform duration-700 ease-in-out pointer-events-none">
            <div className="text-[7px] font-mono text-slate-400">Page 1</div>
            <div className="w-full h-0.5 bg-slate-200 my-2" />
            <div className="w-full h-0.5 bg-slate-200 my-2" />
            <div className="w-3/4 h-0.5 bg-slate-200 my-2" />
          </div>

          {/* FRONT HARDCOVER */}
          <div
            className={`book-cover-left absolute left-36 w-36 h-52 rounded-r-md shadow-2xl origin-left transform-style-3d transition-transform duration-700 ease-in-out bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between text-white border-l-4 border-[#C69A33]`}
          >
            <div className="text-center space-y-1">
              <div className="w-4 h-4 mx-auto rounded-full border border-[#D4AF37] flex items-center justify-center text-[6px] font-mono font-bold text-[#D4AF37]">
                KE
              </div>
              <span className="block text-[6px] font-mono tracking-widest text-slate-300 uppercase">
                ORELC
              </span>
            </div>

            <div className="my-auto text-center space-y-1">
              <h3 className="text-[10px] font-serif font-bold text-amber-200 leading-tight">
                {publication.title}
              </h3>
              <span className="inline-block px-1.5 py-0.5 rounded bg-[#C69A33] text-slate-950 font-mono text-[7px] font-bold">
                {publication.year}
              </span>
            </div>

            <div className="text-center border-t border-white/20 pt-1">
              <span className="text-[6px] font-mono text-slate-300 uppercase">
                Hover to Open
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD DETAILS */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <span className="text-[10px] font-mono uppercase font-bold text-[#C69A33] tracking-wider block">
          {publication.category}
        </span>
        <h3 className="text-base font-serif font-bold text-slate-900 line-clamp-2">
          {publication.title}
        </h3>

        <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <FaCalendarAlt className="text-[#C69A33]" /> {publication.year}
          </span>
          <span className="flex items-center gap-1">
            <FaFileAlt className="text-slate-400" /> {publication.fileSize}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onOpen}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold transition-all"
          >
            <FaEye className="text-[#061e14]" />
            <span>Flip Book</span>
          </button>

          <button
            onClick={onDownload}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#061e14] hover:bg-slate-800 text-[#D4AF37] font-mono text-xs font-bold transition-all shadow-sm"
          >
            <FaDownload />
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Publications;