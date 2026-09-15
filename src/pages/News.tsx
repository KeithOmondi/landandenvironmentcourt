// src/features/news/News.tsx
//
// Public news page.
//
//   - Lists published articles (fetchPublishedNews), paginated.
//   - Opens one article in a modal (fetchPublishedNewsById).
//   - Search box filters server-side (search param).
//   - Category chips currently filter client-side; see the TODO on
//     `NewsItem.category` if the backend gains that field.
//
// All HTTP lives in the slice.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaNewspaper,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaTimes,
  FaChevronRight,
  FaShareAlt,
  FaBookmark,
  FaFilter,
} from 'react-icons/fa';
import {
  fetchPublishedNews,
  fetchPublishedNewsById,
  clearPublicArticle,
  clearPublicError,
  type PublicNews,
  type PublicNewsSummary,
} from '../store/slices/newsSlice';
import type { AppDispatch, RootState } from '../store/store';

// ─── Local view model ────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category:
    | 'Judicial Updates'
    | 'Environment'
    | 'Land Rights'
    | 'Court Operations';
  date: string;
  author: string;
  image: string;
  featured?: boolean;
}

const CATEGORIES = [
  'All',
  'Court Operations',
  'Environment',
  'Land Rights',
  'Judicial Updates',
] as const;
type Category = (typeof CATEGORIES)[number];

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1200';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

const toNewsItem = (n: PublicNewsSummary | PublicNews): NewsItem => ({
  id: n.id,
  title: n.title,
  summary: n.summary,
  content: 'content' in n ? n.content : undefined,
  category: 'Judicial Updates', // TODO: sync with backend field `n.category`
  date: formatDate('publishedAt' in n ? n.publishedAt : null),
  author: n.author,
  image: n.imageUrl || FALLBACK_IMAGE,
  featured: n.isFeatured,
});

// ─── Safe image wrapper ──────────────────────────────────────────────────────

const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt,
  ...rest
}) => (
  <img
    src={src || FALLBACK_IMAGE}
    alt={alt || ''}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
    }}
    {...rest}
  />
);

// ─── Page ────────────────────────────────────────────────────────────────────

const News: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    publicItems,
    publicTotal,
    isLoadingPublic,
    publicError,
    publicArticle,
    isLoadingPublicArticle,
    publicArticleError,
  } = useSelector((s: RootState) => s.news);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch published list on pagination or search query updates
  useEffect(() => {
    dispatch(
      fetchPublishedNews({ page, limit, search: searchTerm || undefined })
    );
  }, [dispatch, page, searchTerm]);

  // Clear modal article state when closed
  useEffect(() => {
    if (!isModalOpen) dispatch(clearPublicArticle());
  }, [isModalOpen, dispatch]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // ── Handlers & Derived Data ────────────────────────────────────────────────
  const handleCategoryChange = (cat: Category) => {
    setSelectedCategory(cat);
    setPage(1); // Reset pagination on category change
  };

  const openArticle = useCallback(
    (id: string) => {
      setIsModalOpen(true);
      dispatch(fetchPublishedNewsById(id));
    },
    [dispatch]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('All');
    setPage(1);
  };

  const items = useMemo(() => publicItems.map(toNewsItem), [publicItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const featuredArticle = useMemo(
    () => items.find((i) => i.featured) ?? items[0] ?? null,
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(publicTotal / limit));
  const detail: NewsItem | null = useMemo(
    () => (publicArticle ? toNewsItem(publicArticle) : null),
    [publicArticle]
  );

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* ================= HERO IMAGE BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
          style={{
            backgroundImage: `url('${FALLBACK_IMAGE}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/70 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaNewspaper />
            <span>Media & Announcements</span>
          </div>

          <h1 className="text-3xl sm:text-3xl lg:text-3xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            Latest News
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Stay informed with official updates, landmark rulings, press
            releases, and operational news from the Environment and Land Court
            of Kenya.
          </p>
        </div>
      </div>

      {/* ================= SEARCH & CATEGORY FILTER BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search news by keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <FaFilter className="text-[#C69A33] shrink-0 hidden sm:block" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
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

{/* ================= FEATURED ARTICLE HIGHLIGHT ================= */}
{selectedCategory === 'All' && !searchTerm && featuredArticle && (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
    <div
      role="button"
      tabIndex={0}
      onClick={() => openArticle(featuredArticle.id)}
      onKeyDown={(e) => e.key === 'Enter' && openArticle(featuredArticle.id)}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer group hover:border-[#C69A33] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#061e14] max-h-none lg:max-h-[420px]"
    >
      {/* Featured Image Container */}
      <div className="lg:col-span-6 relative h-64 sm:h-72 lg:h-full w-full bg-slate-900 overflow-hidden shrink-0">
        <SafeImage
          src={featuredArticle.image}
          alt={featuredArticle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-[#061e14]/90 backdrop-blur-md text-[#D4AF37] font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-[#C69A33]/40 z-10">
          Featured Bulletin
        </div>
      </div>

      {/* Featured Details Container */}
      <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-white">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-[#061e14] font-bold">
              <FaTag className="text-[#C69A33]" />
              {featuredArticle.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FaCalendarAlt />
              {featuredArticle.date}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-slate-900 group-hover:text-[#061e14] transition-colors leading-tight line-clamp-2">
            {featuredArticle.title}
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {featuredArticle.summary}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#061e14]">
          <span className="flex items-center gap-2 text-slate-500 font-normal">
            <FaUser className="text-[#C69A33]" />
            {featuredArticle.author}
          </span>
          <span className="flex items-center gap-1 text-[#C69A33] group-hover:translate-x-1 transition-transform">
            Read Full Article <FaChevronRight />
          </span>
        </div>
      </div>
    </div>
  </div>
)}

      {/* ================= ARTICLES GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            News & Articles ({filteredItems.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Click article to view full details
          </span>
        </div>

        {isLoadingPublic && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500">Loading articles…</p>
          </div>
        )}

        {!isLoadingPublic && publicError && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaNewspaper className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">{publicError}</p>
            <button
              type="button"
              onClick={() => {
                dispatch(clearPublicError());
                dispatch(
                  fetchPublishedNews({
                    page,
                    limit,
                    search: searchTerm || undefined,
                  })
                );
              }}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoadingPublic && !publicError && filteredItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaNewspaper className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">
              No articles found matching your query.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Reset Search & Filters
            </button>
          </div>
        )}

        {!isLoadingPublic && !publicError && filteredItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((article) => (
                <div
                  key={article.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openArticle(article.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openArticle(article.id)}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                >
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    <SafeImage
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#061e14]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#D4AF37] border border-[#C69A33]/40">
                      {article.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        <FaCalendarAlt className="text-[#C69A33]" />
                        <span>{article.date}</span>
                      </div>

                      <h3 className="text-base font-serif font-bold text-slate-900 group-hover:text-[#061e14] transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-[#061e14] font-bold">
                      <span className="text-[11px] text-slate-500 font-normal truncate max-w-[140px]">
                        {article.author}
                      </span>
                      <span className="flex items-center gap-1 text-[#C69A33]">
                        Read More{' '}
                        <FaChevronRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                      </span>
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

      {/* ================= FULL ARTICLE MODAL ================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-article-title"
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden relative transform transition-all duration-300 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingPublicArticle && (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500">Loading article…</p>
              </div>
            )}

            {!isLoadingPublicArticle && publicArticleError && (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm text-red-600">{publicArticleError}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}

            {!isLoadingPublicArticle && !publicArticleError && detail && (
              <>
                <div className="relative h-64 sm:h-72 w-full bg-slate-900 shrink-0">
                  <SafeImage
                    src={detail.image}
                    alt={detail.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  <button
                    type="button"
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors border border-white/20"
                    aria-label="Close modal"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-4 left-6 right-6 space-y-2">
                    <span className="px-3 py-1 rounded-full bg-[#C69A33] text-slate-950 text-[10px] font-mono font-bold uppercase">
                      {detail.category}
                    </span>
                    <h3
                      id="modal-article-title"
                      className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight"
                    >
                      {detail.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <FaUser className="text-[#C69A33]" />
                        {detail.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-[#C69A33]" />
                        {detail.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-[#061e14] transition-colors"
                        aria-label="Bookmark article"
                      >
                        <FaBookmark />
                      </button>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-[#061e14] transition-colors"
                        aria-label="Share article"
                      >
                        <FaShareAlt />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-amber-50/60 border-l-4 border-[#C69A33] p-4 rounded-r-xl">
                    {detail.summary}
                  </p>

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 font-sans whitespace-pre-line">
                    {detail.content}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md"
                  >
                    Close Article
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

export default News;