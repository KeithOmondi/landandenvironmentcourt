import React, { useState, useMemo } from 'react';
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
  FaFilter
} from 'react-icons/fa';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Judicial Updates' | 'Environment' | 'Land Rights' | 'Court Operations';
  date: string;
  author: string;
  image: string;
  featured?: boolean;
}

const newsData: NewsItem[] = [
  {
    id: '1',
    title: 'ELC Launches Digitized Land Case Filing to Accelerate Adjudication',
    summary: 'The Environment and Land Court introduces fully integrated electronic filing stations to reduce backlog and increase transparency.',
    content: 'The Principal Judge of the Environment and Land Court (ELC) today presided over the launch of the enhanced national E-Filing System across all regional stations. The digital transformation initiative aims to streamline case management, eliminate fraudulent title submissions, and drastically reduce the time taken to process land ownership litigation.',
    category: 'Court Operations',
    date: 'August 14, 2026',
    author: 'Judiciary Communications Unit',
    image: '',
    featured: true
  },
  {
    id: '2',
    title: 'Landmark Ruling Enforces Protection of Wetland Water Basins',
    summary: 'ELC ruling halts illegal commercial developments along protected wetlands, reaffirming Article 69 environmental duties.',
    content: 'In a significant judgment delivered this week, the Environment and Land Court issued permanent injunctions against commercial developers encroaching on critical riparian zones. The Court emphasized that economic interests cannot override constitutional mandates to safeguard natural water ecosystems and community health.',
    category: 'Environment',
    date: 'August 02, 2026',
    author: 'Legal Affairs Reporter',
    image: ''
  },
  {
    id: '3',
    title: 'Judicial Circuit Drive to Adjudicate Communal Land Disputes',
    summary: 'Mobile court sessions deployed to remote counties to bring land justice closer to rural communities.',
    content: 'To enhance access to justice, ELC Judges have commenced a specialized mobile court circuit covering pastoral and agricultural regions. The initiative focuses on resolving long-standing communal land title boundaries and succession disputes without requiring residents to travel long distances to urban court stations.',
    category: 'Land Rights',
    date: 'July 28, 2026',
    author: 'Regional Court Registrar',
    image: ''
  },
  {
    id: '4',
    title: 'Annual Judicial Conference Focuses on Climate Change Litigation',
    summary: 'ELC judges gather to deliberate on emerging climate justice frameworks and environmental compliance standards.',
    content: 'The 2026 Environment and Land Court Annual Conference opened with a focus on integrating international climate protocols into domestic dispute resolution. Discussions centered on carbon credit regulation, community compensation for environmental degradation, and procedural standards for public interest environmental litigation.',
    category: 'Judicial Updates',
    date: 'July 19, 2026',
    author: 'ELC Secretariat',
    image: ''
  },
  {
    id: '5',
    title: 'Public Guidelines Issued for Appeals from Land & Rent Tribunals',
    summary: 'Clarified procedural steps released for parties seeking appellate review of tribunal determinations.',
    content: 'The Office of the Principal Judge has published comprehensive guidelines clarifying the appellate pathway from specialized bodies—including the Business Premises Rent Tribunal and National Environment Tribunal—to the Environment and Land Court.',
    category: 'Court Operations',
    date: 'June 30, 2026',
    author: 'Court Registry',
    image: ''
  }
];

const categories = ['All', 'Court Operations', 'Environment', 'Land Rights', 'Judicial Updates'];

const News: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Filtered Articles
  const filteredNews = useMemo(() => {
    return newsData.filter((article) => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const featuredArticle = newsData.find((item) => item.featured) || newsData[0];

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">

      {/* ================= HERO IMAGE BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-24 lg:py-32">
        {/* Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1920')` 
          }}
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/70 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaNewspaper />
            <span>Media & Announcements</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            Latest News 
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Stay informed with official updates, landmark rulings, press releases, and operational news from the Environment and Land Court of Kenya.
          </p>
        </div>
      </div>

      {/* ================= SEARCH & CATEGORY FILTER BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search news by keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <FaFilter className="text-[#C69A33] shrink-0 hidden sm:block" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div 
            onClick={() => setSelectedArticle(featuredArticle)}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer group hover:border-[#C69A33] transition-all duration-300"
          >
            <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-slate-900">
              <img 
                src={featuredArticle.image} 
                alt={featuredArticle.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#061e14] text-[#D4AF37] font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-[#C69A33]/40">
                Featured Bulletin
              </div>
            </div>

            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
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

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 group-hover:text-[#061e14] transition-colors leading-tight">
                  {featuredArticle.title}
                </h2>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {featuredArticle.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#061e14]">
                <span className="flex items-center gap-2">
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
            News & Articles ({filteredNews.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Click article to view full details</span>
        </div>

        {filteredNews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaNewspaper className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No articles found matching your query.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Image Header */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#061e14]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#D4AF37] border border-[#C69A33]/40">
                    {article.category}
                  </div>
                </div>

                {/* Body Content */}
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
                      Read More <FaChevronRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= FULL ARTICLE MODAL ================= */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden relative transform transition-all duration-300 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative h-64 sm:h-72 w-full bg-slate-900 shrink-0">
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-colors border border-white/20"
                aria-label="Close modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 space-y-2">
                <span className="px-3 py-1 rounded-full bg-[#C69A33] text-slate-950 text-[10px] font-mono font-bold uppercase">
                  {selectedArticle.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Article Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <FaUser className="text-[#C69A33]" />
                    {selectedArticle.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FaCalendarAlt className="text-[#C69A33]" />
                    {selectedArticle.date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-[#061e14] transition-colors">
                    <FaBookmark />
                  </button>
                  <button className="text-slate-400 hover:text-[#061e14] transition-colors">
                    <FaShareAlt />
                  </button>
                </div>
              </div>

              {/* Lead Summary */}
              <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-amber-50/60 border-l-4 border-[#C69A33] p-4 rounded-r-xl">
                {selectedArticle.summary}
              </p>

              {/* Article Content */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 font-sans">
                <p>{selectedArticle.content}</p>
                <p>
                  The Environment and Land Court continues to implement reforms prioritized in its Strategic Plan to enhance public legal education, safeguard environmental integrity, and promote transparent land administration.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default News;